import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";
import { generateUniqueOrderNumber } from "@/lib/orderNumber";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// Zod Input Validation Schema
const CreateOrderSchema = z.object({
  locationSlug: z.string().min(1).default("EMBA"),
  terminalCode: z.string().min(1).default("KIOSK-01"),
  orderType: z.enum(["DINE_IN", "TAKE_AWAY"]).default("DINE_IN"),
  paymentMethod: z.enum(["CASH", "CARD", "NFC_WALLET", "QR_CODE"]).default("CARD"),
  locale: z.enum(["en", "de", "gr"]).default("en"),
  customerNote: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(50),
        spiceLevel: z.number().int().min(1).max(5).default(1),
        modifiers: z.array(z.object({ modifierId: z.string() })).default([]),
        isMealBundle: z.boolean().default(false),
        mealDrinkName: z.string().optional(),
        mealSideName: z.string().optional(),
        itemNotes: z.string().max(200).optional(),
      })
    )
    .min(1, "Order must have at least 1 item"),
});

export async function POST(request: Request) {
  try {
    await initializeDatabasePragmas();

    const body = await request.json();
    const parseResult = CreateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, errors: parseResult.error.errors },
        { status: 400 }
      );
    }

    const {
      locationSlug,
      terminalCode,
      orderType,
      paymentMethod,
      locale,
      customerNote,
      items: rawItems,
    } = parseResult.data;

    // 1. Verify Location & Terminal
    const location = await prisma.location.findUnique({
      where: { slug: locationSlug.toUpperCase() },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location '${locationSlug}' not found` },
        { status: 404 }
      );
    }

    let terminal = await prisma.terminal.findUnique({
      where: {
        locationId_terminalCode: {
          locationId: location.id,
          terminalCode,
        },
      },
    });

    if (!terminal) {
      // Auto-register terminal if first boot
      terminal = await prisma.terminal.create({
        data: {
          locationId: location.id,
          terminalCode,
          terminalType: "KIOSK",
          printerType: "EPSON_TM",
        },
      });
    }

    // 2. Zero-Trust Server-Side Price & Availability Recalculation
    let computedGrossTotal = 0;
    const validatedItemsData: {
      productId: string;
      productName: string;
      productSku: string;
      basePrice: number;
      quantity: number;
      spiceLevel: number;
      isMealBundle: boolean;
      mealDrinkName?: string;
      mealSideName?: string;
      mealPriceAddon: number;
      itemNotes?: string;
      totalPrice: number;
      modifiers: {
        modifierId: string;
        groupName: string;
        modifierName: string;
        priceAdjustment: number;
      }[];
    }[] = [];

    for (const rawItem of rawItems) {
      // Query SQLite for product
      const product = await prisma.product.findUnique({
        where: { id: rawItem.productId },
        include: {
          locationPrices: {
            where: { locationId: location.id },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ID '${rawItem.productId}' not found` },
          { status: 400 }
        );
      }

      // Check product availability
      const locationOverride = product.locationPrices[0];
      const isAvailable = locationOverride
        ? locationOverride.isAvailable
        : product.isAvailable;

      if (!isAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: `Product '${product.name}' is currently SOLD OUT. Please choose an alternative.`,
            soldOutProductId: product.id,
          },
          { status: 409 }
        );
      }

      const effectiveBasePrice = locationOverride ? locationOverride.price : product.basePrice;

      // Validate Modifiers
      let itemModTotal = 0;
      const validatedModifiers: {
        modifierId: string;
        groupName: string;
        modifierName: string;
        priceAdjustment: number;
      }[] = [];

      for (const mRef of rawItem.modifiers) {
        const modifier = await prisma.modifier.findUnique({
          where: { id: mRef.modifierId },
          include: { modifierGroup: true },
        });

        if (!modifier || !modifier.isAvailable) {
          return NextResponse.json(
            {
              success: false,
              error: `Modifier '${modifier?.name || mRef.modifierId}' is sold out.`,
            },
            { status: 409 }
          );
        }

        itemModTotal += modifier.priceAdjustment;
        validatedModifiers.push({
          modifierId: modifier.id,
          groupName: modifier.modifierGroup.name,
          modifierName: modifier.name,
          priceAdjustment: modifier.priceAdjustment,
        });
      }

      const mealPriceAddon = rawItem.isMealBundle ? 3.5 : 0.0;
      const unitPrice = Number((effectiveBasePrice + itemModTotal + mealPriceAddon).toFixed(2));
      const lineTotal = Number((unitPrice * rawItem.quantity).toFixed(2));

      computedGrossTotal += lineTotal;

      validatedItemsData.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        basePrice: effectiveBasePrice,
        quantity: rawItem.quantity,
        spiceLevel: rawItem.spiceLevel,
        isMealBundle: rawItem.isMealBundle,
        mealDrinkName: rawItem.mealDrinkName,
        mealSideName: rawItem.mealSideName,
        mealPriceAddon,
        itemNotes: rawItem.itemNotes,
        totalPrice: lineTotal,
        modifiers: validatedModifiers,
      });
    }

    // 3. Compute Tax & Subtotals (Cyprus Standard: 19% VAT inclusive)
    const totalAmount = Number(computedGrossTotal.toFixed(2));
    const vatRate = location.vatRate || 0.19;
    const subtotal = Number((totalAmount / (1 + vatRate)).toFixed(2));
    const vatAmount = Number((totalAmount - subtotal).toFixed(2));

    // 4. Generate Unique Order Number: {LOCATION}-{YYYYMMDD}-{HHmm}-{SEQ}
    const { orderNumber, dailySequence } = await generateUniqueOrderNumber(location.slug);

    // 5. Generate Payment Reference & QR payload
    let paymentRef = `TXN-${Date.now()}`;
    let qrDataUrl: string | undefined = undefined;

    if (paymentMethod === "QR_CODE") {
      // Standalone payment payload: Cyprus Instant SEPA / Revolut / Crypto payload simulation
      const qrPayload = JSON.stringify({
        store: location.name,
        order: orderNumber,
        amount: totalAmount,
        currency: "EUR",
        iban: "CY12002001234567890123456789",
        timestamp: new Date().toISOString(),
      });
      paymentRef = `QR-${orderNumber}`;
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#1A1A1A",
          light: "#FFFFFF",
        },
      });
    }

    // 6. Execute ACID Database Transaction in SQLite
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          dailySequence,
          locationId: location.id,
          terminalId: terminal.id,
          orderType,
          orderStatus: paymentMethod === "CASH" ? "PENDING_PAYMENT" : "PAID",
          paymentMethod,
          paymentStatus: paymentMethod === "CASH" ? "PENDING" : "CAPTURED",
          paymentRef,
          subtotal,
          vatRate,
          vatAmount,
          totalAmount,
          customerNote,
          locale,
          paidAt: paymentMethod === "CASH" ? null : new Date(),
        },
      });

      // Create line items and modifiers
      for (const itemData of validatedItemsData) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: itemData.productId,
            productName: itemData.productName,
            productSku: itemData.productSku,
            basePrice: itemData.basePrice,
            quantity: itemData.quantity,
            spiceLevel: itemData.spiceLevel,
            isMealBundle: itemData.isMealBundle,
            mealDrinkName: itemData.mealDrinkName,
            mealSideName: itemData.mealSideName,
            mealPriceAddon: itemData.mealPriceAddon,
            itemNotes: itemData.itemNotes,
            totalPrice: itemData.totalPrice,
          },
        });

        if (itemData.modifiers.length > 0) {
          await tx.orderItemModifier.createMany({
            data: itemData.modifiers.map((m) => ({
              orderItemId: orderItem.id,
              modifierId: m.modifierId,
              groupName: m.groupName,
              modifierName: m.modifierName,
              priceAdjustment: m.priceAdjustment,
            })),
          });
        }
      }

      // Generate Kitchen Ticket (Module M5 KDS Payload)
      const kitchenPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        items: validatedItemsData.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          spiceLevel: item.spiceLevel,
          modifiers: item.modifiers.map((m) => m.modifierName),
          isMealBundle: item.isMealBundle,
          mealDrinkName: item.mealDrinkName,
          mealSideName: item.mealSideName,
          notes: item.itemNotes,
        })),
        customerNote: order.customerNote,
        createdAt: order.createdAt.toISOString(),
      };

      await tx.kitchenTicket.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          ticketData: JSON.stringify(kitchenPayload),
          ticketStatus: "QUEUED",
        },
      });

      // Log Security Audit
      await tx.auditLog.create({
        data: {
          locationId: location.id,
          terminalId: terminal.id,
          action: "ORDER_CREATED",
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            total: totalAmount,
            paymentMethod,
          }),
          severity: "INFO",
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      dailySequence: createdOrder.dailySequence,
      orderType: createdOrder.orderType,
      subtotal: createdOrder.subtotal,
      vatRate: createdOrder.vatRate,
      vatAmount: createdOrder.vatAmount,
      totalAmount: createdOrder.totalAmount,
      paymentMethod: createdOrder.paymentMethod,
      status: createdOrder.orderStatus,
      paymentStatus: createdOrder.paymentStatus,
      qrDataUrl,
      createdAt: createdOrder.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Critical error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing order" },
      { status: 500 }
    );
  }
}

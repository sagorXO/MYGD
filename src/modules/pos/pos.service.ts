// MY GERMAN DÖNER — POS Service
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { POSOrderTender, POSOrderTenderSchema, Link4PayTerminalResponse } from "./pos.schema";
import { tcpPrintSpooler } from "../printer/tcp-spooler";
import { ThermalChitPayload } from "../printer/printer.schema";
import { deductOrderBOMAsync } from "../inventory/bom-decrement.engine";
import { calculateReverseVat, DEFAULT_VAT_RATE } from "@/lib/tax";
import { priceCart, type CartLine } from "@/lib/discounts/engine";
import { findVoucher, loadActivePromotions, voucherToInput } from "@/lib/discounts/store";

export interface POSTenderResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  dailySequence: number;
  subtotal: number;
  discountAmount: number;
  appliedPromotions: { code: string; name: string; amount: number }[];
  voucherAmount: number;
  taxableSubtotal: number;
  vatAmount: number;
  totalAmount: number;
  changeDue?: number;
  paymentRef?: string;
  printed: boolean;
  error?: string;
}

export class POSService {
  /**
   * Process POS counter order with atomic calculations and hardware thermal dispatch
   */
  public static async tenderOrder(rawPayload: unknown): Promise<POSTenderResult> {
    const validated = POSOrderTenderSchema.parse(rawPayload);

    // 1-2. Price the cart server-side: automatic promotions -> voucher / gift card -> staff percent.
    const products = await prisma.product.findMany({
      where: { id: { in: validated.lines.map((l) => l.productId) } },
      select: { id: true, category: { select: { slug: true } } },
    });
    const sectionByProduct = new Map(products.map((p) => [p.id, p.category.slug]));
    const cartLines: CartLine[] = validated.lines.map((l) => ({
      sku: l.sku,
      sectionSlug: sectionByProduct.get(l.productId) ?? "",
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    }));

    const voucherRow = validated.voucherCode ? await findVoucher(prisma, validated.voucherCode) : null;
    if (validated.voucherCode && !voucherRow) {
      throw new Error(`Voucher ${validated.voucherCode.toUpperCase()} does not exist`);
    }
    const priced = priceCart({
      lines: cartLines,
      promotions: await loadActivePromotions(prisma),
      voucher: voucherRow ? voucherToInput(voucherRow) : undefined,
      manualPercent: validated.discountPercent,
    });
    if (priced.voucher?.rejectedReason) {
      throw new Error(`Voucher ${priced.voucher.code} cannot be used: ${priced.voucher.rejectedReason}`);
    }
    const grossSubtotal = priced.subtotal;
    const discountAmount = priced.discountTotal;
    const finalTotal = priced.total;
    const voucherAmount = priced.voucher?.amount ?? 0;

    // 3. VAT is included in the consumer price: net = gross / (1 + rate), vat = gross - net
    const { net: netSubtotal, vatAmount } = calculateReverseVat(finalTotal);

    // 4. Cash change calculation
    let changeDue = 0;
    if (validated.paymentMethod === "CASH" && validated.cashTendered !== undefined) {
      if (validated.cashTendered < finalTotal) {
        throw new Error(`Insufficient cash tendered: Received €${validated.cashTendered.toFixed(2)}, required €${finalTotal.toFixed(2)}`);
      }
      changeDue = Number((validated.cashTendered - finalTotal).toFixed(2));
    }

    // 5. Generate Daily Order Sequence & Order Reference
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Find location ID
    const location = await prisma.location.findUnique({
      where: { slug: validated.locationSlug },
    });
    if (!location) {
      throw new Error(`Invalid location slug: ${validated.locationSlug}`);
    }

    // Get sequence count for today
    const countToday = await prisma.order.count({
      where: {
        locationId: location.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const dailySeq = countToday + 1;
    const orderNumber = `${validated.locationSlug}-${datePrefix}-${String(dailySeq).padStart(3, "0")}`;

    // Find or create terminal
    let terminal = await prisma.terminal.findUnique({
      where: {
        locationId_terminalCode: {
          locationId: location.id,
          terminalCode: validated.terminalCode,
        },
      },
    });

    if (!terminal) {
      terminal = await prisma.terminal.create({
        data: {
          locationId: location.id,
          terminalCode: validated.terminalCode,
          terminalType: "POS_COUNTER",
        },
      });
    }

    // 6. Persist Order, Items and the voucher redemption atomically
    const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        dailySequence: dailySeq,
        locationId: location.id,
        terminalId: terminal.id,
        orderType: validated.orderType,
        orderStatus: "PREPARING",
        paymentMethod: validated.paymentMethod,
        paymentStatus: "CAPTURED",
        subtotal: netSubtotal,
        vatRate: DEFAULT_VAT_RATE,
        vatAmount,
        totalAmount: finalTotal,
        discountAmount,
        voucherCode: voucherRow?.code ?? null,
        promotionCodes: priced.discounts.length ? JSON.stringify(priced.discounts.map((d) => d.code)) : null,
        customerNote: validated.customerNote,
        items: {
          create: validated.lines.map((l) => ({
            productId: l.productId,
            productName: l.name,
            productSku: l.sku,
            basePrice: l.basePrice,
            quantity: l.quantity,
            spiceLevel: l.spiceLevel,
            totalPrice: l.totalPrice,
            itemNotes: [
              l.breadType ? `Bread: ${l.breadType}` : "",
              l.selectedSauces.length ? `Sauces: ${l.selectedSauces.join(", ")}` : "",
              l.selectedAdditions.length ? `Add: ${l.selectedAdditions.map((a) => a.name).join(", ")}` : "",
              l.selectedOmissions.length ? `No: ${l.selectedOmissions.join(", ")}` : "",
              l.notes || "",
            ]
              .filter(Boolean)
              .join(" | "),
          })),
        },
        kitchenTickets: {
          create: {
            orderNumber,
            orderType: validated.orderType,
            station: "ALL",
            ticketData: JSON.stringify(validated.lines),
            ticketStatus: "QUEUED",
          },
        },
      },
      include: {
        items: true,
        kitchenTickets: true,
      },
    });

    if (voucherRow && voucherAmount > 0) {
      // Optimistic guard: only succeeds if nobody redeemed this voucher since we read it.
      const claimed = await tx.voucher.updateMany({
        where: { id: voucherRow.id, redemptions: voucherRow.redemptions },
        data: {
          redemptions: { increment: 1 },
          ...(voucherRow.kind === "GIFT_CARD" ? { balance: priced.voucher?.balanceAfter ?? 0 } : {}),
        },
      });
      if (claimed.count !== 1) {
        throw new Error(`Voucher ${voucherRow.code} was just used on another till — try again`);
      }
      await tx.voucherRedemption.create({
        data: { voucherId: voucherRow.id, orderId: created.id, amount: voucherAmount },
      });
    }
    return created;
    });

    // 7. Atomic BOM Inventory Decrement
    try {
      await deductOrderBOMAsync(location.id, validated.lines);
    } catch (invErr) {
      console.error("[POSService] Non-blocking BOM inventory deduction error:", invErr);
    }

    // 8. Raw TCP ESC/POS Thermal Print Dispatch (Silent, Dual-Station)
    let printSuccess = false;
    try {
      const thermalPayload: ThermalChitPayload = {
        orderNumber,
        dailySequence: dailySeq,
        orderType: validated.orderType,
        locationSlug: validated.locationSlug,
        createdAt: order.createdAt.toISOString(),
        customerNote: validated.customerNote,
        items: validated.lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          spiceLevel: l.spiceLevel,
          breadType: l.breadType,
          additions: l.selectedAdditions.map((a) => a.name),
          omissions: l.selectedOmissions,
          sauces: l.selectedSauces,
          notes: l.notes,
          stationTarget: "BOTH",
        })),
      };

      const printRes = await tcpPrintSpooler.dispatchDualStationPrint(thermalPayload);
      printSuccess = printRes.indoorResult.success || printRes.grillResult.success;
    } catch (printErr) {
      console.error("[POSService] Background thermal print error:", printErr);
    }

    // 9. Real-Time WebSocket / SSE Broadcast (<500ms)
    eventBroker.publish("kds", {
      type: "ORDER_CREATED",
      orderId: order.id,
      orderNumber,
      orderType: validated.orderType,
      dailySequence: dailySeq,
      items: validated.lines,
      status: "PREPARING",
      createdAt: order.createdAt.toISOString(),
    });

    eventBroker.publish("display", {
      type: "ORDER_CREATED",
      orderNumber,
      dailySequence: dailySeq,
      status: "PREPARING",
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber,
      dailySequence: dailySeq,
      subtotal: grossSubtotal,
      discountAmount,
      appliedPromotions: priced.discounts.map((d) => ({ ...d })),
      voucherAmount,
      taxableSubtotal: netSubtotal,
      vatAmount,
      totalAmount: finalTotal,
      changeDue: changeDue > 0 ? changeDue : undefined,
      paymentRef: `LP-${Date.now().toString().slice(-6)}`,
      printed: printSuccess,
    };
  }

  /**
   * Mock Link4Pay Card Terminal Communication (Simulates NFC / Chip terminal handshake)
   */
  public static async processLink4PayPayment(amountEUR: number, orderRef: string): Promise<Link4PayTerminalResponse> {
    // Simulate ~450ms EMV terminal capture
    await new Promise((resolve) => setTimeout(resolve, 450));

    return {
      success: true,
      transactionId: `L4P-TX-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      authCode: `AUTH${Math.floor(100000 + Math.random() * 900000)}`,
      cardScheme: "CONTACTLESS_NFC",
      maskedPan: "**** **** **** 4892",
    };
  }
}

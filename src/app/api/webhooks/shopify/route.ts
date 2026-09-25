// MY GERMAN DÖNER — Shopify Inbound Webhook Receiver
// Routes Shopify orders to Prisma DB, generates KDS Kitchen Tickets, updates stock, and syncs via SSE

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { verifyShopifyHMAC, transformShopifyOrder } from "@/lib/shopify-order-sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic") || "unknown";
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || "shopify_dev_secret_key";

    // 1. Verify HMAC Signature (Allow dev bypass if header missing in local tests)
    if (hmacHeader && !verifyShopifyHMAC(rawBody, hmacHeader, webhookSecret)) {
      console.warn(`[Shopify Webhook] Unauthorized signature for topic: ${topic}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log(`[Shopify Webhook Received] Topic: ${topic} | ID: ${payload.id || "N/A"}`);

    // 2. Resolve default Location & Terminal
    const location =
      (await prisma.location.findUnique({ where: { slug: "EMBA" } })) ||
      (await prisma.location.findFirst()) ||
      (await prisma.location.create({
        data: {
          slug: "EMBA",
          name: "MY GERMAN DÖNER — Emba (Paphos)",
          address: "Agíou Stefánou Street 134, Emba, Paphos",
          city: "Paphos",
          vatRate: 0.19,
        },
      }));

    let terminal = await prisma.terminal.findFirst({
      where: { locationId: location.id, terminalCode: "SHOPIFY-WEB" },
    });

    if (!terminal) {
      terminal = await prisma.terminal.create({
        data: {
          locationId: location.id,
          terminalCode: "SHOPIFY-WEB",
          terminalType: "POS_COUNTER",
          printerType: "EPSON_TM",
        },
      });
    }

    // 3. Dispatch Based on Webhook Topic
    switch (topic) {
      case "orders/create":
      case "orders/paid": {
        const transformed = transformShopifyOrder(payload, location.slug);

        // Check for duplicate order (Idempotency)
        let existingOrder = await prisma.order.findUnique({
          where: { orderNumber: transformed.orderNumber },
        });

        if (!existingOrder) {
          // Count today's orders for sequence
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const countToday = await prisma.order.count({
            where: { locationId: location.id, createdAt: { gte: todayStart } },
          });

          // Create order and tickets atomically
          await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
              data: {
                orderNumber: transformed.orderNumber,
                dailySequence: countToday + 1,
                locationId: location.id,
                terminalId: terminal.id,
                orderType: transformed.orderType,
                orderStatus: transformed.orderStatus,
                paymentMethod: transformed.paymentMethod,
                paymentStatus: transformed.orderStatus === "PAID" ? "CAPTURED" : "PENDING",
                paymentRef: transformed.shopifyOrderId,
                subtotal: transformed.subtotal,
                vatRate: 0.19,
                vatAmount: transformed.vatAmount,
                totalAmount: transformed.totalAmount,
                customerNote: transformed.customerNote,
                paidAt: transformed.orderStatus === "PAID" ? new Date() : null,
              },
            });

            // Insert line items
            for (const item of transformed.items) {
              // Find or default product
              let product = await tx.product.findFirst({
                where: { sku: item.productSku },
              });

              if (!product) {
                product = await tx.product.findFirst();
              }

              if (product) {
                await tx.orderItem.create({
                  data: {
                    orderId: order.id,
                    productId: product.id,
                    productName: item.title,
                    productSku: item.productSku || product.sku,
                    basePrice: item.price,
                    quantity: item.quantity,
                    spiceLevel: item.spiceLevel,
                    totalPrice: Math.round(item.price * item.quantity * 100) / 100,
                  },
                });
              }
            }

            // Create Kitchen Ticket
            const ticketData = JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              orderType: order.orderType,
              items: transformed.items.map((i) => ({
                name: i.title,
                quantity: i.quantity,
                spiceLevel: i.spiceLevel,
                modifiers: i.modifiers,
              })),
              customerNote: order.customerNote,
              createdAt: order.createdAt.toISOString(),
            });

            await tx.kitchenTicket.create({
              data: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                orderType: order.orderType,
                ticketData,
                ticketStatus: "QUEUED",
                station: "ALL",
              },
            });
          });
        }

        // Broadcast to KDS and Customer TV
        eventBroker.publish("kds", {
          type: "ORDER_CREATED",
          orderNumber: transformed.orderNumber,
          source: "SHOPIFY",
        });

        eventBroker.publish("display", {
          type: "ORDER_CREATED",
          orderNumber: transformed.orderNumber,
          shortNumber: transformed.orderNumber.replace("SHOPIFY-", ""),
        });

        break;
      }

      case "orders/cancelled": {
        const orderNumber = payload.name ? `SHOPIFY-${payload.name.replace("#", "")}` : `SHOPIFY-${payload.id}`;

        const existingOrder = await prisma.order.findUnique({
          where: { orderNumber },
        });

        if (existingOrder) {
          await prisma.order.update({
            where: { id: existingOrder.id },
            data: {
              orderStatus: "CANCELLED",
              cancelledAt: new Date(),
              cancellationReason: payload.cancel_reason || "Cancelled in Shopify Admin",
            },
          });

          await prisma.kitchenTicket.updateMany({
            where: { orderId: existingOrder.id },
            data: { ticketStatus: "VOIDED" },
          });

          eventBroker.publish("kds", {
            type: "TICKET_UPDATED",
            orderNumber,
            status: "CANCELLED",
          });
        }
        break;
      }

      case "inventory_levels/update": {
        const sku = payload.sku;
        const available = payload.available;

        if (sku && typeof available === "number") {
          const item = await prisma.inventoryItem.findFirst({
            where: { ingredient: { sku } },
          });

          if (item) {
            await prisma.inventoryItem.update({
              where: { id: item.id },
              data: { currentStock: available },
            });

            eventBroker.publish("admin", {
              type: "STOCK_CHANGED",
              sku,
              currentStock: available,
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({
      received: true,
      topic,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Shopify Webhook Error]", err);
    return NextResponse.json(
      { error: err.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

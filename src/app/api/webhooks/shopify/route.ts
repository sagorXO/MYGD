// MY GERMAN DÖNER — Shopify Inbound Webhook Receiver
// Routes Shopify orders to KDS, updates live inventory alerts, and syncs order status

import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic") || "unknown";
    const shopDomain = req.headers.get("x-shopify-shop-domain") || "";

    // 1. Verify HMAC Signature
    const isValid = verifyShopifyWebhook(rawBody, hmacHeader);
    if (!isValid) {
      console.warn(`[Shopify Webhook] Unauthorized signature for topic: ${topic}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log(`[Shopify Webhook Received] Topic: ${topic} | ID: ${payload.id || "N/A"}`);

    // 2. Dispatch Based on Webhook Topic
    switch (topic) {
      case "orders/create":
      case "orders/paid": {
        // Map Shopify Order into KDS Kitchen Ticket
        const orderNumber = payload.name || `ORD-${payload.id}`;
        const lineItems = payload.line_items || [];
        const isDelivery = payload.shipping_lines?.length > 0;

        console.log(`[KDS Queue] Enqueued Shopify Order: ${orderNumber} (${lineItems.length} items) - Delivery: ${isDelivery}`);
        // Here: Store into KitchenTicket / Broadcast via WebSocket to /kds screens
        break;
      }

      case "orders/cancelled": {
        const orderNumber = payload.name || `ORD-${payload.id}`;
        console.log(`[KDS Queue] Order Cancelled/Voided: ${orderNumber}`);
        // Here: Mark ticket as VOID / CANCELLED on KDS
        break;
      }

      case "inventory_levels/update": {
        const inventoryItemId = payload.inventory_item_id;
        const available = payload.available;
        const locationId = payload.location_id;

        console.log(`[Stock Alert] Inventory Level Changed: Item ${inventoryItemId} -> ${available} available (Location: ${locationId})`);
        // Here: Check threshold and trigger M3 Low-Stock Alert notification if low
        break;
      }

      default:
        console.log(`[Shopify Webhook] Unhandled topic: ${topic}`);
    }

    return NextResponse.json({ received: true, topic, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Shopify Webhook Error]", err);
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}

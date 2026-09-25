// MY GERMAN DÖNER — Shopify Inbound Webhook & Order Synchronizer
// Handles HMAC validation, line item parsing, and database transactions

import crypto from "node:crypto";
import { calculateOrderFinancials } from "./order-engine";

export interface TransformedShopifyOrder {
  orderNumber: string;
  locationSlug: string;
  orderType: "TAKE_AWAY" | "DELIVERY" | "DINE_IN";
  orderStatus: "PAID" | "PENDING_PAYMENT" | "CANCELLED";
  paymentMethod: "CARD" | "CASH" | "QR_CODE";
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  customerNote?: string;
  shopifyOrderId: string;
  items: {
    title: string;
    productSku?: string;
    quantity: number;
    price: number;
    spiceLevel: number;
    modifiers: string[];
  }[];
}

/**
 * Verify Shopify Webhook HMAC-SHA256 Signature using timing-safe comparison
 */
export function verifyShopifyHMAC(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    const computedHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    const computedBuffer = Buffer.from(computedHmac, "utf8");
    const signatureBuffer = Buffer.from(signatureHeader, "utf8");

    if (computedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
  } catch (err) {
    console.error("[Shopify HMAC] Error verifying signature:", err);
    return false;
  }
}

/**
 * Transform Shopify Inbound Webhook JSON into internal schema representation
 */
export function transformShopifyOrder(
  payload: any,
  locationSlug: string = "EMBA"
): TransformedShopifyOrder {
  const orderNumber = payload.name ? `SHOPIFY-${payload.name.replace("#", "")}` : `SHOPIFY-${payload.id}`;
  const totalAmount = parseFloat(payload.total_price || "0");
  const subtotal = parseFloat(payload.subtotal_price || `${totalAmount / 1.19}`);
  const vatAmount = parseFloat(payload.total_tax || `${totalAmount - subtotal}`);

  const items = (payload.line_items || []).map((li: any) => {
    let spiceLevel = 1;
    const modifiers: string[] = [];

    if (Array.isArray(li.properties)) {
      for (const prop of li.properties) {
        if (prop.name?.toLowerCase().includes("spice")) {
          const match = String(prop.value).match(/\d+/);
          if (match) spiceLevel = parseInt(match[0], 10);
        } else if (prop.name && prop.value) {
          modifiers.push(`${prop.name}: ${prop.value}`);
        }
      }
    }

    return {
      title: li.title || "Shopify Menu Item",
      productSku: li.sku || `SKU-${li.product_id || li.id}`,
      quantity: li.quantity || 1,
      price: parseFloat(li.price || "0"),
      spiceLevel,
      modifiers,
    };
  });

  let orderStatus: "PAID" | "PENDING_PAYMENT" | "CANCELLED" = "PENDING_PAYMENT";
  if (payload.financial_status === "paid") {
    orderStatus = "PAID";
  } else if (payload.financial_status === "voided" || payload.cancelled_at) {
    orderStatus = "CANCELLED";
  }

  return {
    orderNumber,
    locationSlug,
    orderType: "TAKE_AWAY",
    orderStatus,
    paymentMethod: "CARD",
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    customerNote: payload.note || undefined,
    shopifyOrderId: String(payload.id),
    items,
  };
}

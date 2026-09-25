import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

test("WU-2: Shopify Webhook - HMAC Verification Validates Correct Signature", async () => {
  const { verifyShopifyHMAC } = await import("../src/lib/shopify-order-sync.js").catch(async () => {
    return await import("../src/lib/shopify-order-sync.ts");
  });

  const secret = "test_shopify_webhook_secret_key_123";
  const body = JSON.stringify({ id: 1001, email: "customer@mygermandoener.com", total_price: "15.00" });

  // Calculate true HMAC-SHA256
  const hmac = crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");

  const isValid = verifyShopifyHMAC(body, hmac, secret);
  assert.equal(isValid, true, "Valid HMAC should pass verification");

  const isInvalid = verifyShopifyHMAC(body, "invalid_signature_string", secret);
  assert.equal(isInvalid, false, "Invalid HMAC should fail verification");
});

test("WU-2: Shopify Webhook - Transform Inbound Shopify Order to MYGD Prisma Schema", async () => {
  const { transformShopifyOrder } = await import("../src/lib/shopify-order-sync.js").catch(async () => {
    return await import("../src/lib/shopify-order-sync.ts");
  });

  const shopifyPayload = {
    id: 987654321,
    name: "#1042",
    created_at: "2026-08-24T12:00:00Z",
    total_price: "21.50",
    subtotal_price: "18.07",
    total_tax: "3.43",
    currency: "EUR",
    financial_status: "paid",
    note: "Extra Garlic Sauce please",
    line_items: [
      {
        id: 111,
        product_id: 201,
        title: "Original German Döner (150g)",
        quantity: 2,
        price: "7.50",
        sku: "DONER-CLASSIC-150G",
        properties: [
          { name: "Spice Level", value: "Level 4 (Hot)" },
          { name: "Bread", value: "Berlin Fladenbrot" },
          { name: "Sauce", value: "Knoblauch + Kräuter" },
        ],
      },
      {
        id: 112,
        product_id: 202,
        title: "Crispy Berlin Pommes",
        quantity: 1,
        price: "3.50",
        sku: "SIDES-FRIES-REG",
        properties: [],
      },
    ],
  };

  const transformed = transformShopifyOrder(shopifyPayload, "EMBA");

  assert.equal(transformed.orderNumber, "SHOPIFY-1042");
  assert.equal(transformed.locationSlug, "EMBA");
  assert.equal(transformed.orderType, "TAKE_AWAY");
  assert.equal(transformed.orderStatus, "PAID");
  assert.equal(transformed.subtotal, 18.07);
  assert.equal(transformed.vatAmount, 3.43);
  assert.equal(transformed.totalAmount, 21.5);
  assert.equal(transformed.items.length, 2);
  assert.equal(transformed.items[0].spiceLevel, 4);
  assert.equal(transformed.items[0].modifiers.length, 2);
});

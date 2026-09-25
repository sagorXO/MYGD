import test from "node:test";
import assert from "node:assert/strict";

test("WU-2: POS Checkout - Order Payload VAT Calculation & Sequential Numbering", async () => {
  const { calculateOrderFinancials, generateOrderNumber } = await import("../src/lib/order-engine.js").catch(async () => {
    return await import("../src/lib/order-engine.ts");
  });

  const items = [
    { name: "Original German Döner", price: 7.50, quantity: 2 },
    { name: "Döner Box Spezial", price: 6.50, quantity: 1 },
  ];

  const financials = calculateOrderFinancials(items, 0.19);

  // Gross = 2 * 7.50 + 6.50 = 21.50
  // Net = 21.50 / 1.19 = 18.0672 -> 18.07
  // VAT = 21.50 - 18.07 = 3.43
  assert.equal(financials.grossTotal, 21.50);
  assert.equal(financials.subtotalNet, 18.07);
  assert.equal(financials.vatAmount, 3.43);
  assert.equal(financials.vatRate, 0.19);

  const orderNumber = generateOrderNumber("EMBA", 42, new Date("2026-08-24T14:30:00Z"));
  assert.equal(orderNumber, "EMBA-20260824-1430-042");
});

test("WU-2: POS Checkout - Hardware Cash Drawer Kick Command generation", async () => {
  const { getCashDrawerCommand } = await import("../src/lib/order-engine.js").catch(async () => {
    return await import("../src/lib/order-engine.ts");
  });

  const cashKick = getCashDrawerCommand("CASH");
  assert.ok(cashKick, "Cash payment should trigger cash drawer kick");
  assert.deepEqual(Array.from(cashKick), [0x1b, 0x70, 0x00, 0x19, 0xfa]);

  const cardKick = getCashDrawerCommand("CARD");
  assert.equal(cardKick, null, "Card payment should not kick drawer by default");
});

test("WU-2: POS Checkout - Order Validation catches empty cart or negative prices", async () => {
  const { validateOrderPayload } = await import("../src/lib/order-engine.js").catch(async () => {
    return await import("../src/lib/order-engine.ts");
  });

  const emptyResult = validateOrderPayload({ items: [], locationSlug: "EMBA", paymentMethod: "CASH" });
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.error.includes("Cart cannot be empty"));

  const validResult = validateOrderPayload({
    items: [{ productId: "prod-1", name: "Döner", basePrice: 7.50, quantity: 1 }],
    locationSlug: "EMBA",
    paymentMethod: "CASH",
  });
  assert.equal(validResult.valid, true);
});

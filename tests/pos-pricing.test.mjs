import test from "node:test";
import assert from "node:assert/strict";
import { priceTender } from "../src/modules/pos/pos.pricing.ts";
import { POSOrderTenderSchema } from "../src/modules/pos/pos.schema.ts";

// Synthetic rates in basis points, as the VatRate table would supply them.
const RATES = { FOOD_BEV: 900, ALCOHOL: 1900, ZERO: 0 };

function line(overrides = {}) {
  return {
    lineId: "l1",
    productId: "p-food",
    sku: "SKU-1",
    name: "Item",
    basePrice: 10,
    quantity: 1,
    unitPrice: 10,
    totalPrice: 10,
    ...overrides,
  };
}

function deps(over = {}) {
  const calls = { rates: 0 };
  return {
    calls,
    findProductCategories: async (ids) => {
      const known = { "p-food": "FOOD_BEV", "p-beer": "ALCOHOL", "p-zero": "ZERO" };
      return ids.filter((id) => known[id]).map((id) => ({ id, vatCategory: known[id] }));
    },
    loadRates: async () => {
      calls.rates += 1;
      return RATES;
    },
    ...over,
  };
}

const parse = (payload) => POSOrderTenderSchema.parse(payload);

test("each line takes its VAT category from the product record, not from the client", async () => {
  const order = parse({
    paymentMethod: "CARD",
    lines: [line({ productId: "p-food", totalPrice: 15, unitPrice: 15, basePrice: 15 }), line({ lineId: "l2", productId: "p-beer", totalPrice: 7, unitPrice: 7, basePrice: 7 })],
  });
  const priced = await priceTender(order, deps());
  assert.deepEqual(
    priced.lines.map((l) => [l.vatCategory, l.rateBp, l.netCents, l.vatCents]),
    [
      ["FOOD_BEV", 900, 1376, 124],
      ["ALCOHOL", 1900, 588, 112],
    ],
  );
  assert.equal(priced.totals.totalCents, 2200);
  assert.equal(priced.totals.netCents + priced.totals.vatCents, 2200);
});

test("a discount is applied before VAT, line by line", async () => {
  const order = parse({
    paymentMethod: "CARD",
    discountPercent: 10,
    lines: [line({ productId: "p-food", totalPrice: 15, unitPrice: 15, basePrice: 15 }), line({ lineId: "l2", productId: "p-beer", totalPrice: 7, unitPrice: 7, basePrice: 7 })],
  });
  const priced = await priceTender(order, deps());
  assert.equal(priced.totals.discountCents, 220);
  assert.equal(priced.totals.totalCents, 1980);
  assert.equal(priced.totals.vatCents, 212);
});

test("an unknown product is refused instead of guessing a VAT category", async () => {
  const order = parse({ paymentMethod: "CARD", lines: [line({ productId: "p-ghost" })] });
  await assert.rejects(() => priceTender(order, deps()), /unknown product.*p-ghost/i);
});

test("the VAT rate comes from the rate loader, read once per order", async () => {
  const d = deps({ loadRates: async () => ({ ...RATES, FOOD_BEV: 500 }) });
  const order = parse({ paymentMethod: "CARD", lines: [line({ totalPrice: 10.5, unitPrice: 10.5, basePrice: 10.5 })] });
  const priced = await priceTender(order, d);
  assert.equal(priced.totals.netCents, 1000);
  assert.equal(priced.totals.vatCents, 50);

  const d2 = deps();
  await priceTender(parse({ paymentMethod: "CARD", lines: [line(), line({ lineId: "l2" })] }), d2);
  assert.equal(d2.calls.rates, 1);
});

test("cash change is exact in cents (20.00 tendered for 19.80 gives 0.20, not 0.1999...)", async () => {
  const order = parse({
    paymentMethod: "CASH",
    cashTendered: 20,
    lines: [line({ totalPrice: 19.8, unitPrice: 19.8, basePrice: 19.8 })],
  });
  const priced = await priceTender(order, deps());
  assert.equal(priced.changeDueCents, 20);
});

test("insufficient cash is refused", async () => {
  const order = parse({ paymentMethod: "CASH", cashTendered: 5, lines: [line()] });
  await assert.rejects(() => priceTender(order, deps()), /Insufficient cash/);
});

test("card payments never produce change", async () => {
  const order = parse({ paymentMethod: "CARD", cashTendered: 50, lines: [line()] });
  const priced = await priceTender(order, deps());
  assert.equal(priced.changeDueCents, 0);
});

test("the schema refuses prices with more than 2 decimals", () => {
  assert.throws(() => parse({ paymentMethod: "CARD", lines: [line({ totalPrice: 10.005 })] }));
  assert.throws(() => parse({ paymentMethod: "CASH", cashTendered: 20.123, lines: [line()] }));
});

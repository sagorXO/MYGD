import test from "node:test";
import assert from "node:assert/strict";
import { computePOSTotals } from "../src/modules/pos/pos.totals.ts";

// Synthetic rates in basis points, injected like the VatRate table would supply them.
const RATES = { FOOD_BEV: 900, ALCOHOL: 1900, ZERO: 0 };

test("a single food line splits VAT at the food rate from the rate table", () => {
  const t = computePOSTotals({
    lines: [{ totalPriceCents: 1000, category: "FOOD_BEV" }],
    discountPercent: 0,
    rates: RATES,
  });
  assert.equal(t.grossSubtotalCents, 1000);
  assert.equal(t.discountCents, 0);
  assert.equal(t.totalCents, 1000);
  assert.equal(t.netCents, 917);
  assert.equal(t.vatCents, 83);
});

test("VAT follows the injected rate: changing the table changes the result", () => {
  const t = computePOSTotals({
    lines: [{ totalPriceCents: 1050, category: "FOOD_BEV" }],
    discountPercent: 0,
    rates: { ...RATES, FOOD_BEV: 500 },
  });
  assert.equal(t.netCents, 1000);
  assert.equal(t.vatCents, 50);
});

test("mixed categories with a discount: discount is shared per line, VAT is exact per line", () => {
  const t = computePOSTotals({
    lines: [
      { totalPriceCents: 1500, category: "FOOD_BEV" },
      { totalPriceCents: 700, category: "ALCOHOL" },
    ],
    discountPercent: 10,
    rates: RATES,
  });
  assert.equal(t.grossSubtotalCents, 2200);
  assert.equal(t.discountCents, 220);
  assert.equal(t.totalCents, 1980);
  assert.deepEqual(
    t.lines.map((l) => l.grossCents),
    [1350, 630],
  );
  assert.deepEqual(
    t.lines.map((l) => [l.netCents, l.vatCents]),
    [
      [1239, 111],
      [529, 101],
    ],
  );
  assert.equal(t.netCents, 1768);
  assert.equal(t.vatCents, 212);
});

test("net plus VAT always equals the total, and line gross always sums to the total", () => {
  const cases = [
    { lines: [{ totalPriceCents: 333, category: "FOOD_BEV" }, { totalPriceCents: 777, category: "ALCOHOL" }, { totalPriceCents: 1, category: "ZERO" }], pct: 7.5 },
    { lines: [{ totalPriceCents: 1999, category: "FOOD_BEV" }], pct: 33.33 },
    { lines: [{ totalPriceCents: 5, category: "ALCOHOL" }, { totalPriceCents: 5, category: "ALCOHOL" }, { totalPriceCents: 5, category: "ALCOHOL" }], pct: 50 },
  ];
  for (const c of cases) {
    const t = computePOSTotals({ lines: c.lines, discountPercent: c.pct, rates: RATES });
    assert.equal(t.netCents + t.vatCents, t.totalCents, `net+vat for ${JSON.stringify(c)}`);
    assert.equal(t.lines.reduce((s, l) => s + l.grossCents, 0), t.totalCents, `lines for ${JSON.stringify(c)}`);
    assert.equal(t.grossSubtotalCents - t.discountCents, t.totalCents);
  }
});

test("a 100% discount gives a zero total with no VAT", () => {
  const t = computePOSTotals({
    lines: [{ totalPriceCents: 1500, category: "FOOD_BEV" }],
    discountPercent: 100,
    rates: RATES,
  });
  assert.equal(t.totalCents, 0);
  assert.equal(t.vatCents, 0);
  assert.equal(t.netCents, 0);
});

test("a zero-rated line carries no VAT", () => {
  const t = computePOSTotals({
    lines: [{ totalPriceCents: 400, category: "ZERO" }],
    discountPercent: 0,
    rates: RATES,
  });
  assert.equal(t.netCents, 400);
  assert.equal(t.vatCents, 0);
});

test("invalid input is refused: empty cart, bad discount, missing rate", () => {
  assert.throws(() => computePOSTotals({ lines: [], discountPercent: 0, rates: RATES }), RangeError);
  assert.throws(
    () => computePOSTotals({ lines: [{ totalPriceCents: 100, category: "FOOD_BEV" }], discountPercent: 101, rates: RATES }),
    RangeError,
  );
  assert.throws(
    () => computePOSTotals({ lines: [{ totalPriceCents: 100, category: "ALCOHOL" }], discountPercent: 0, rates: { FOOD_BEV: 900, ZERO: 0 } }),
    /ALCOHOL/,
  );
});

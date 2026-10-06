import test from "node:test";
import assert from "node:assert/strict";
import * as tax from "../src/lib/tax.ts";

const {
  rateToBp,
  bpToRate,
  splitGross,
  calculateOrderTax,
  calculateReverseVat,
  calculateOrderTaxBreakdown,
  CYPRUS_VAT_RATES,
  DEFAULT_VAT_RATE,
} = tax;

test("bpToRate writes basis points back as a Decimal(5,4) string and round-trips", () => {
  assert.equal(bpToRate(900), "0.0900");
  assert.equal(bpToRate(1900), "0.1900");
  assert.equal(bpToRate(0), "0.0000");
  assert.equal(bpToRate(10000), "1.0000");
  for (const bp of [0, 1, 500, 900, 1900, 10000]) assert.equal(rateToBp(bpToRate(bp)), bp);
  assert.throws(() => bpToRate(10001), RangeError);
  assert.throws(() => bpToRate(9.5), RangeError);
});

// Synthetic rates in basis points, injected like the VatRate table would supply them.
// Business rates live in the database (VatRate), never in code (PRD P.8).
const RATES = { FOOD_BEV: 900, ALCOHOL: 1900, ZERO: 0 };

test("rateToBp reads a database rate (4 decimals) as basis points", () => {
  assert.equal(rateToBp("0.0900"), 900);
  assert.equal(rateToBp("0.19"), 1900);
  assert.equal(rateToBp("0"), 0);
  assert.equal(rateToBp(0.09), 900);
});

test("rateToBp refuses malformed rates", () => {
  assert.throws(() => rateToBp("0.09001"), RangeError);
  assert.throws(() => rateToBp("-0.01"), RangeError);
  assert.throws(() => rateToBp("1.0001"), RangeError);
  assert.throws(() => rateToBp("abc"), TypeError);
});

test("reduced rate: €7.50 gross splits into net 6.88 and VAT 0.62", () => {
  const r = splitGross(750, RATES.FOOD_BEV);
  // Net = 7.50 / 1.09 = 6.8807 -> 6.88
  assert.deepEqual(r, { netCents: 688, vatCents: 62 });
  assert.equal(r.netCents + r.vatCents, 750);
});

test("standard rate: €3.50 gross splits into net 2.94 and VAT 0.56", () => {
  const r = splitGross(350, RATES.ALCOHOL);
  // Net = 3.50 / 1.19 = 2.9411 -> 2.94
  assert.deepEqual(r, { netCents: 294, vatCents: 56 });
  assert.equal(r.netCents + r.vatCents, 350);
});

test("zero rate keeps the whole amount as net", () => {
  assert.deepEqual(splitGross(5000, 0), { netCents: 5000, vatCents: 0 });
  assert.deepEqual(splitGross(0, 900), { netCents: 0, vatCents: 0 });
});

test("negative amounts (refund lines) split symmetrically", () => {
  assert.deepEqual(splitGross(-750, 900), { netCents: -688, vatCents: -62 });
});

test("multi-category order breakdown matches the legacy figures", () => {
  const breakdown = calculateOrderTax(
    [
      { grossCents: 1500, category: "FOOD_BEV" }, // 2x Döner at 7.50
      { grossCents: 490, category: "FOOD_BEV" }, // 1x fries at 4.90
      { grossCents: 700, category: "ALCOHOL" }, // 2x beer at 3.50
    ],
    RATES,
  );

  assert.equal(breakdown.grossCents, 2690);
  assert.deepEqual(breakdown.byCategory.FOOD_BEV, { rateBp: 900, grossCents: 1990, netCents: 1826, vatCents: 164 });
  assert.deepEqual(breakdown.byCategory.ALCOHOL, { rateBp: 1900, grossCents: 700, netCents: 588, vatCents: 112 });
  assert.deepEqual(breakdown.byCategory.ZERO, { rateBp: 0, grossCents: 0, netCents: 0, vatCents: 0 });
  assert.equal(breakdown.netCents, 2414);
  assert.equal(breakdown.vatCents, 276);
  assert.equal(breakdown.netCents + breakdown.vatCents, breakdown.grossCents);
});

test("calculateOrderTax fails visibly when a category has no rate", () => {
  assert.throws(
    () => calculateOrderTax([{ grossCents: 100, category: "ALCOHOL" }], { FOOD_BEV: 900, ZERO: 0 }),
    /ALCOHOL/,
  );
});

test("VAT is 5% on every category (zero-rated stays 0%)", () => {
  assert.equal(CYPRUS_VAT_RATES.FOOD_BEV, 0.05);
  assert.equal(CYPRUS_VAT_RATES.ALCOHOL, 0.05);
  assert.equal(CYPRUS_VAT_RATES.ZERO, 0.0);
  assert.equal(DEFAULT_VAT_RATE, 0.05);
});

test("5% VAT - €7.50 split (food)", () => {
  const result = calculateReverseVat(7.5, "FOOD_BEV");
  assert.equal(result.gross, 7.5);
  assert.equal(result.vatRate, 0.05);
  assert.equal(result.net, 7.14); // 7.50 / 1.05 = 7.1428…
  assert.equal(result.vatAmount, 0.36);
  assert.equal(Number((result.net + result.vatAmount).toFixed(2)), 7.5);
});

test("5% VAT - €3.50 beer carries the same rate", () => {
  const result = calculateReverseVat(3.5, "ALCOHOL");
  assert.equal(result.vatRate, 0.05);
  assert.equal(result.net, 3.33); // 3.50 / 1.05 = 3.3333…
  assert.equal(result.vatAmount, 0.17);
  assert.equal(Number((result.net + result.vatAmount).toFixed(2)), 3.5);
});

test("Multi-category order tax breakdown at 5%", () => {
  const items = [
    { grossPrice: 7.5, quantity: 2, category: "FOOD_BEV" }, // €15.00
    { grossPrice: 4.9, quantity: 1, category: "FOOD_BEV" }, // €4.90
    { grossPrice: 3.5, quantity: 2, category: "ALCOHOL" }, // €7.00
  ];
  const breakdown = calculateOrderTaxBreakdown(items);

  assert.equal(breakdown.grossTotal, 26.9);
  assert.equal(breakdown.categories.FOOD_BEV.gross, 19.9);
  assert.equal(breakdown.categories.FOOD_BEV.net, 18.96); // rounded per line: 14.29 + 4.67
  assert.equal(breakdown.categories.FOOD_BEV.vatAmount, 0.94); // 0.71 + 0.23
  assert.equal(breakdown.categories.ALCOHOL.gross, 7.0);
  assert.equal(breakdown.categories.ALCOHOL.net, 6.67); // 7.00 / 1.05
  assert.equal(breakdown.categories.ALCOHOL.vatAmount, 0.33);
  assert.equal(breakdown.subtotalNet, 25.63);
  assert.equal(breakdown.totalVat, 1.27);
  assert.equal(Number((breakdown.subtotalNet + breakdown.totalVat).toFixed(2)), 26.9);
});

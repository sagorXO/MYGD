import test from "node:test";
import assert from "node:assert/strict";
import { calculateReverseVat, calculateOrderTaxBreakdown, CYPRUS_VAT_RATES, DEFAULT_VAT_RATE } from "../src/lib/tax.ts";

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

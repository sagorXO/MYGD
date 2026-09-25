import test from "node:test";
import assert from "node:assert/strict";
import { calculateReverseVat, calculateOrderTaxBreakdown, CYPRUS_VAT_RATES } from "../src/lib/tax.ts";

test("Cyprus VAT Rates Constant Verification", () => {
  assert.equal(CYPRUS_VAT_RATES.FOOD_BEV, 0.09);
  assert.equal(CYPRUS_VAT_RATES.ALCOHOL, 0.19);
  assert.equal(CYPRUS_VAT_RATES.ZERO, 0.00);
});

test("Cyprus 9% Reduced VAT - €7.50 Classic Döner Split", () => {
  const result = calculateReverseVat(7.50, "FOOD_BEV");
  assert.equal(result.gross, 7.50);
  assert.equal(result.vatRate, 0.09);
  // Net = 7.50 / 1.09 = 6.88073 -> 6.88
  assert.equal(result.net, 6.88);
  // Vat = 7.50 - 6.88 = 0.62
  assert.equal(result.vatAmount, 0.62);
  assert.equal(Number((result.net + result.vatAmount).toFixed(2)), 7.50);
});

test("Cyprus 19% Standard VAT - €3.50 German Pilsner Beer", () => {
  const result = calculateReverseVat(3.50, "ALCOHOL");
  assert.equal(result.gross, 3.50);
  assert.equal(result.vatRate, 0.19);
  // Net = 3.50 / 1.19 = 2.94117 -> 2.94
  assert.equal(result.net, 2.94);
  // Vat = 3.50 - 2.94 = 0.56
  assert.equal(result.vatAmount, 0.56);
  assert.equal(Number((result.net + result.vatAmount).toFixed(2)), 3.50);
});

test("Cyprus Multi-Category Order Tax Breakdown", () => {
  const items = [
    { grossPrice: 7.50, quantity: 2, category: "FOOD_BEV" }, // 2x Döner = €15.00 gross (9%)
    { grossPrice: 4.90, quantity: 1, category: "FOOD_BEV" }, // 1x Truffle Fries = €4.90 gross (9%)
    { grossPrice: 3.50, quantity: 2, category: "ALCOHOL" },  // 2x Beer = €7.00 gross (19%)
  ];

  const breakdown = calculateOrderTaxBreakdown(items);

  // Total Gross = 15.00 + 4.90 + 7.00 = €26.90
  assert.equal(breakdown.grossTotal, 26.90);

  // Food Gross = €19.90 -> Net = 19.90 / 1.09 = 18.26, VAT = 1.64
  assert.equal(breakdown.categories.FOOD_BEV.gross, 19.90);
  assert.equal(breakdown.categories.FOOD_BEV.net, 18.26);
  assert.equal(breakdown.categories.FOOD_BEV.vatAmount, 1.64);

  // Alcohol Gross = €7.00 -> Net = 7.00 / 1.19 = 5.88, VAT = 1.12
  assert.equal(breakdown.categories.ALCOHOL.gross, 7.00);
  assert.equal(breakdown.categories.ALCOHOL.net, 5.88);
  assert.equal(breakdown.categories.ALCOHOL.vatAmount, 1.12);

  // Subtotal Net = 18.26 + 5.88 = 24.14
  assert.equal(breakdown.subtotalNet, 24.14);
  // Total VAT = 1.64 + 1.12 = 2.76
  assert.equal(breakdown.totalVat, 2.76);
  assert.equal(Number((breakdown.subtotalNet + breakdown.totalVat).toFixed(2)), 26.90);
});

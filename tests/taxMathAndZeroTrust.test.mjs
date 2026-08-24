import test from "node:test";
import assert from "node:assert/strict";

function calculateCyprusVAT(grossAmount) {
  const safeGross = Math.max(0, Number(grossAmount.toFixed(2)));
  const net = Number((safeGross / 1.19).toFixed(2));
  const vat = Number((safeGross - net).toFixed(2));
  return { net, vat, gross: safeGross };
}

test("Cyprus 19% VAT - €7.50 Classic Döner Split", () => {
  const result = calculateCyprusVAT(7.50);
  assert.equal(result.gross, 7.50);
  assert.equal(result.net, 6.30); // 7.50 / 1.19 = 6.3025 -> 6.30
  assert.equal(result.vat, 1.20); // 7.50 - 6.30 = 1.20
  assert.equal(Number((result.net + result.vat).toFixed(2)), result.gross);
});

test("Cyprus 19% VAT - €100.00 Large Catering Order", () => {
  const result = calculateCyprusVAT(100.00);
  assert.equal(result.gross, 100.00);
  assert.equal(result.net, 84.03); // 100 / 1.19 = 84.0336 -> 84.03
  assert.equal(result.vat, 15.97); // 100 - 84.03 = 15.97
  assert.equal(Number((result.net + result.vat).toFixed(2)), 100.00);
});

test("Cyprus 19% VAT - Edge Case €0.01 Cent", () => {
  const result = calculateCyprusVAT(0.01);
  assert.equal(result.gross, 0.01);
  assert.equal(result.net, 0.01);
  assert.equal(result.vat, 0.00);
});

import test from "node:test";
import assert from "node:assert/strict";

function deductRecipeBOM(currentStockGrams, portionsOrdered, portionWeightGrams = 150) {
  const totalDeduction = portionsOrdered * portionWeightGrams;
  const remainingStock = currentStockGrams - totalDeduction;
  return {
    deductedGrams: totalDeduction,
    remainingStockGrams: remainingStock,
    isLowStock: remainingStock < 5000, // Alert below 5kg
  };
}

test("M3 Recipe BOM - 10 Classic Dönners deducts exactly 1500g meat", () => {
  const result = deductRecipeBOM(25000, 10, 150); // 25kg starting stock
  assert.equal(result.deductedGrams, 1500);
  assert.equal(result.remainingStockGrams, 23500);
  assert.equal(result.isLowStock, false);
});

test("M3 Recipe BOM - Low stock alert fires when meat dips below 5kg", () => {
  const result = deductRecipeBOM(6000, 10, 150); // 6kg - 1.5kg = 4.5kg
  assert.equal(result.remainingStockGrams, 4500);
  assert.equal(result.isLowStock, true);
});

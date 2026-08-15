import test from "node:test";
import assert from "node:assert";

test("Cyprus 19% VAT subtotal and line item calculations", () => {
  // Scenario 1: Classic Döner (€6.50) + Beef modifier (+€0.50) + Meal upgrade (+€3.50) = €10.50
  const basePrice = 6.5;
  const modifierPrice = 0.5;
  const mealUpgradePrice = 3.5;
  const quantity = 2;

  const unitPrice = Number((basePrice + modifierPrice + mealUpgradePrice).toFixed(2));
  assert.strictEqual(unitPrice, 10.5);

  const grossTotal = Number((unitPrice * quantity).toFixed(2));
  assert.strictEqual(grossTotal, 21.0);

  // Cyprus VAT calculation (Gross includes 19% VAT)
  const vatRate = 0.19;
  const netSubtotal = Number((grossTotal / (1 + vatRate)).toFixed(2));
  const vatAmount = Number((grossTotal - netSubtotal).toFixed(2));

  assert.strictEqual(netSubtotal, 17.65);
  assert.strictEqual(vatAmount, 3.35);
  assert.strictEqual(Number((netSubtotal + vatAmount).toFixed(2)), grossTotal);
});

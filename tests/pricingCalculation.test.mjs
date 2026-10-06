import test from "node:test";
import assert from "node:assert";
import { calculateReverseVat } from "../src/lib/tax.ts";

test("5% VAT subtotal and line item calculations", () => {
  // Scenario 1: Classic Döner (€6.50) + Beef modifier (+€0.50) + Meal upgrade (+€3.50) = €10.50
  const basePrice = 6.5;
  const modifierPrice = 0.5;
  const mealUpgradePrice = 3.5;
  const quantity = 2;

  const unitPrice = Number((basePrice + modifierPrice + mealUpgradePrice).toFixed(2));
  assert.strictEqual(unitPrice, 10.5);

  const grossTotal = Number((unitPrice * quantity).toFixed(2));
  assert.strictEqual(grossTotal, 21.0);

  // Gross includes 5% VAT
  const { net: netSubtotal, vatAmount } = calculateReverseVat(grossTotal);

  assert.strictEqual(netSubtotal, 20.0);
  assert.strictEqual(vatAmount, 1.0);
  assert.strictEqual(Number((netSubtotal + vatAmount).toFixed(2)), grossTotal);
});

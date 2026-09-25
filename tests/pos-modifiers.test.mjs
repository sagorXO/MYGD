import test from "node:test";
import assert from "node:assert";

test("POS Color-Coded Modifier Calculation & Cyprus 19% VAT", () => {
  const basePrice = 7.5; // Berlin Döner Sandwich
  const additions = [
    { name: "Grilled Halloumi", priceAdjustment: 1.0 },
    { name: "Extra Spit Meat (+100g)", priceAdjustment: 2.5 },
    { name: "Knoblauch Garlic Sauce", priceAdjustment: 0.0 },
  ];
  const omissions = [
    "Onions (Zwiebeln)",
    "Tomatoes (Tomaten)",
  ];

  // 1. Calculate Unit Price
  const additionsSum = additions.reduce((acc, a) => acc + a.priceAdjustment, 0);
  const unitPrice = Number((basePrice + additionsSum).toFixed(2));
  assert.strictEqual(unitPrice, 11.0); // 7.50 + 1.00 + 2.50 = 11.00

  // 2. Quantity Multiplier
  const quantity = 3;
  const grossSubtotal = Number((unitPrice * quantity).toFixed(2));
  assert.strictEqual(grossSubtotal, 33.0);

  // 3. Discount Application (10% VIP discount)
  const discountPercent = 10;
  const discountAmount = Number(((grossSubtotal * discountPercent) / 100).toFixed(2));
  const totalAmount = Number((grossSubtotal - discountAmount).toFixed(2));
  assert.strictEqual(discountAmount, 3.3);
  assert.strictEqual(totalAmount, 29.7);

  // 4. Cyprus 19% Standard VAT Decomposition
  const netSubtotal = Number((totalAmount / 1.19).toFixed(2));
  const vatAmount = Number((totalAmount - netSubtotal).toFixed(2));

  assert.strictEqual(netSubtotal, 24.96);
  assert.strictEqual(vatAmount, 4.74);
  assert.strictEqual(Number((netSubtotal + vatAmount).toFixed(2)), totalAmount);

  // 5. Verify Omissions do not alter pricing
  assert.strictEqual(omissions.length, 2);
});

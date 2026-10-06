import test from "node:test";
import assert from "node:assert/strict";
import { calculateReverseVat } from "../src/lib/tax.ts";

test("M2/M10 Menu CRUD - Validate Product Creation & VAT Classification (5% on all)", () => {
  const foodProduct = { name: "Margherita", basePrice: 7.5, vatCategory: "FOOD_BEV" };
  const alcoholProduct = { name: "Draft Beer 0.5L", basePrice: 3.5, vatCategory: "ALCOHOL" };

  const foodTax = calculateReverseVat(foodProduct.basePrice, foodProduct.vatCategory);
  assert.equal(foodTax.vatRate, 0.05);
  assert.equal(foodTax.net, 7.14);
  assert.equal(foodTax.vatAmount, 0.36);

  const alcoholTax = calculateReverseVat(alcoholProduct.basePrice, alcoholProduct.vatCategory);
  assert.equal(alcoholTax.vatRate, 0.05);
  assert.equal(alcoholTax.net, 3.33);
  assert.equal(alcoholTax.vatAmount, 0.17);
});

test("M3 Recipe BOM - Add, Update & Deduct Ingredients from Recipe", () => {
  // Simulate Product Recipe BOM
  let recipeBOM = [
    { ingredientId: "ing-veal-beef", amountGrams: 150, isOptional: false },
    { ingredientId: "ing-fladenbrot", amountGrams: 1, isOptional: false },
  ];

  // 1. Add ingredient to recipe
  const halloumiIngredient = { ingredientId: "ing-halloumi", amountGrams: 50, isOptional: true };
  recipeBOM.push(halloumiIngredient);
  assert.equal(recipeBOM.length, 3);
  assert.equal(recipeBOM.find((b) => b.ingredientId === "ing-halloumi")?.amountGrams, 50);

  // 2. Update ingredient portion
  recipeBOM = recipeBOM.map((b) =>
    b.ingredientId === "ing-halloumi" ? { ...b, amountGrams: 60 } : b
  );
  assert.equal(recipeBOM.find((b) => b.ingredientId === "ing-halloumi")?.amountGrams, 60);

  // 3. Remove ingredient from recipe
  recipeBOM = recipeBOM.filter((b) => b.ingredientId !== "ing-halloumi");
  assert.equal(recipeBOM.length, 2);
  assert.equal(recipeBOM.find((b) => b.ingredientId === "ing-halloumi"), undefined);
});

test("M3/M4 Supplier Contact & Low-Stock Alert Generation", () => {
  const inventory = [
    {
      sku: "ING-KOFTE",
      name: "Berlin Style Spiced Köfte Meatballs",
      currentStock: 25,
      minThreshold: 40,
      unit: "PIECES",
      supplier: {
        name: "Berlin Döner Fleischerei GmbH",
        whatsApp: "+35799531198",
        email: "orders@berlinfleisch.de",
      },
    },
    {
      sku: "ING-CHICKEN",
      name: "Crispy Chicken Spit Meat",
      currentStock: 28000,
      minThreshold: 5000,
      unit: "GRAMS",
      supplier: {
        name: "Berlin Döner Fleischerei GmbH",
        whatsApp: "+35799531198",
        email: "orders@berlinfleisch.de",
      },
    },
  ];

  // Detect low stock items
  const lowStock = inventory.filter((item) => item.currentStock <= item.minThreshold);
  assert.equal(lowStock.length, 1);
  assert.equal(lowStock[0].sku, "ING-KOFTE");

  // Format supplier WhatsApp click-to-chat URL
  const supplier = lowStock[0].supplier;
  const cleanPhone = supplier.whatsApp.replace(/[^0-9]/g, "");
  assert.equal(cleanPhone, "35799531198");

  const messageText = `Urgent restock needed for ${lowStock[0].name} (Stock: ${lowStock[0].currentStock} ${lowStock[0].unit}).`;
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  assert.ok(waUrl.startsWith("https://wa.me/35799531198?text="));
  assert.ok(waUrl.includes("Urgent%20restock%20needed"));
});

import test from "node:test";
import assert from "node:assert/strict";

test("M2/M10 Menu CRUD - Validate Product Creation & Cyprus VAT Classification", () => {
  // Food items must be 9% VAT, alcoholic items must be 19% VAT
  const foodProduct = {
    name: "Berlin Döner Sandwich",
    basePrice: 7.5,
    vatCategory: "FOOD_BEV",
  };

  const alcoholProduct = {
    name: "German Pilsner Draft Beer",
    basePrice: 3.5,
    vatCategory: "ALCOHOL_TOBACCO",
  };

  const computeVAT = (price, category) => {
    const rate = category === "FOOD_BEV" ? 0.09 : 0.19;
    const net = Math.round((price / (1 + rate)) * 100) / 100;
    const vat = Math.round((price - net) * 100) / 100;
    return { rate, net, vat };
  };

  const foodTax = computeVAT(foodProduct.basePrice, foodProduct.vatCategory);
  assert.equal(foodTax.rate, 0.09);
  assert.equal(foodTax.net, 6.88);
  assert.equal(foodTax.vat, 0.62);

  const alcoholTax = computeVAT(alcoholProduct.basePrice, alcoholProduct.vatCategory);
  assert.equal(alcoholTax.rate, 0.19);
  assert.equal(alcoholTax.net, 2.94);
  assert.equal(alcoholTax.vat, 0.56);
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

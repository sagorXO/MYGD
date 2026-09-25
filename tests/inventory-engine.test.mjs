import test from "node:test";
import assert from "node:assert/strict";

test("WU-3: Inventory Engine - Calculate Portions Yield from BOM & Inventory Levels", async () => {
  const { calculateProductYield } = await import("../src/lib/inventory-engine.js").catch(async () => {
    return await import("../src/lib/inventory-engine.ts");
  });

  // Recipe: 1 Classic Döner requires 150g Chicken Meat + 1 Fladenbrot Bread + 30g Sauce
  const recipe = {
    productId: "prod-doner-1",
    productName: "Original German Döner (150g)",
    ingredients: [
      { ingredientId: "ing-meat-chicken", amountUnits: 150, isOptional: false },
      { ingredientId: "ing-bread-fladenbrot", amountUnits: 1, isOptional: false },
      { ingredientId: "ing-sauce-garlic", amountUnits: 30, isOptional: true }, // Optional sauce
    ],
  };

  const inventoryStock = new Map([
    ["ing-meat-chicken", 1500], // 1500g / 150g = 10 portions
    ["ing-bread-fladenbrot", 15], // 15 breads / 1 = 15 portions
    ["ing-sauce-garlic", 300], // 300g / 30g = 10 portions (optional)
  ]);

  const result = calculateProductYield(recipe, inventoryStock);

  assert.equal(result.isAvailable, true);
  assert.equal(result.maxYieldPortions, 10, "Bottleneck is chicken meat (10 portions)");
  assert.equal(result.limitingIngredientId, "ing-meat-chicken");
});

test("WU-3: Inventory Engine - Required Ingredient at 0 Automatically Sets isAvailable to False", async () => {
  const { calculateProductYield } = await import("../src/lib/inventory-engine.js").catch(async () => {
    return await import("../src/lib/inventory-engine.ts");
  });

  const recipe = {
    productId: "prod-doner-1",
    productName: "Original German Döner (150g)",
    ingredients: [
      { ingredientId: "ing-meat-chicken", amountUnits: 150, isOptional: false },
      { ingredientId: "ing-bread-fladenbrot", amountUnits: 1, isOptional: false },
    ],
  };

  // Meat depleted to 0g
  const inventoryStock = new Map([
    ["ing-meat-chicken", 0],
    ["ing-bread-fladenbrot", 25],
  ]);

  const result = calculateProductYield(recipe, inventoryStock);

  assert.equal(result.isAvailable, false, "Product must be marked SOLD OUT (isAvailable = false)");
  assert.equal(result.maxYieldPortions, 0);
  assert.equal(result.limitingIngredientId, "ing-meat-chicken");
});

test("WU-3: Inventory Engine - Deduct Order BOM from Inventory Stock", async () => {
  const { deductOrderBOM } = await import("../src/lib/inventory-engine.js").catch(async () => {
    return await import("../src/lib/inventory-engine.ts");
  });

  const currentStock = new Map([
    ["ing-meat-chicken", 3000],
    ["ing-bread-fladenbrot", 20],
  ]);

  const orderDeductions = [
    { ingredientId: "ing-meat-chicken", amountToDeduct: 300 }, // 2x 150g
    { ingredientId: "ing-bread-fladenbrot", amountToDeduct: 2 }, // 2x bread
  ];

  const updatedStock = deductOrderBOM(currentStock, orderDeductions);

  assert.equal(updatedStock.get("ing-meat-chicken"), 2700);
  assert.equal(updatedStock.get("ing-bread-fladenbrot"), 18);
});

test("WU-3: Inventory Engine - Low Stock Alert Trigger when Stock Dips Below Threshold", async () => {
  const { checkLowStockAlerts } = await import("../src/lib/inventory-engine.js").catch(async () => {
    return await import("../src/lib/inventory-engine.ts");
  });

  const inventoryItems = [
    { id: "item-1", name: "Rotisserie Chicken Spit Meat", currentStock: 4500, minThreshold: 5000, unit: "g" },
    { id: "item-2", name: "Berlin Fladenbrot Bread", currentStock: 80, minThreshold: 20, unit: "pcs" },
  ];

  const alerts = checkLowStockAlerts(inventoryItems);

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].itemId, "item-1");
  assert.equal(alerts[0].severity, "WARNING");
  assert.ok(alerts[0].message.includes("4500g") && alerts[0].message.includes("5000g"));
});

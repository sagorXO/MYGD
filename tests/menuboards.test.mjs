import test from "node:test";
import assert from "node:assert/strict";

// Helper to load menuboard engine module
async function getEngine() {
  return await import("../src/lib/menuboard-engine.js").catch(async () => {
    return await import("../src/lib/menuboard-engine.ts");
  });
}

// Reusable 7-Screen CMS Mock Configuration
const mock7ScreenConfigs = {
  1: {
    slotId: 1,
    title: "BERLIN ROTISSERIE HERO",
    subtitle: "BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS",
    categoryBadge: "FLAGSHIP ROTISSERIE",
    layoutType: "PROMO_HERO",
    heroLayout: true,
    items: [
      {
        id: "prod-hero-1",
        name: "Original German Döner (150g)",
        nameDE: "Original Berliner Döner Kebab",
        desc: "Freshly carved veal/beef or chicken rotisserie, toasted sesame Fladenbrot.",
        price: 7.5,
        badge: "BITE THE HYPE",
        isAvailable: true,
      },
    ],
  },
  2: {
    slotId: 2,
    title: "ORIGINAL DÖNER SELECTION",
    subtitle: "100% FRESH GERMAN ROTISSERIE · CARVED TO ORDER",
    categoryBadge: "SANDWICHES",
    layoutType: "PRICE_MATRIX",
    items: [
      {
        id: "prod-doner-1",
        name: "Original German Döner",
        price: 7.5,
        isAvailable: true,
      },
      {
        id: "prod-steak-1",
        name: "Steak Döner (100% Beef)",
        price: 9.0,
        isAvailable: true,
      },
      {
        id: "prod-spezial-1",
        name: "Döner Spezial (Double Meat)",
        price: 10.5,
        isAvailable: true,
      },
      {
        id: "prod-falafel-1",
        name: "Falafel & Grilled Halloumi",
        price: 7.0,
        isAvailable: true,
      },
    ],
  },
  3: {
    slotId: 3,
    title: "WRAPS & DÜRÜM",
    subtitle: "ROLLED WARM IN THIN FLATBREAD WITH HOMEMADE SAUCES",
    categoryBadge: "ROLLED DÜRÜM",
    layoutType: "PRICE_MATRIX",
    items: [
      {
        id: "prod-durum-1",
        name: "Standard Dürüm Wrap (150g)",
        price: 8.0,
        isAvailable: true,
      },
      {
        id: "prod-durum-chicken",
        name: "Chicken Dürüm Spezial",
        price: 8.5,
        isAvailable: true,
      },
    ],
  },
  4: {
    slotId: 4,
    title: "BOWLS & DÖNER BOXES",
    subtitle: "OVER CRISPY BERLIN FRIES OR AROMATIC SEASONED RICE",
    categoryBadge: "BOXES & BOWLS",
    layoutType: "SPLIT_COMBO",
    items: [
      {
        id: "prod-box-1",
        name: "Original Döner Box",
        price: 7.0,
        isAvailable: true,
      },
      {
        id: "prod-bowl-1",
        name: "Döner Rice Bowl XL (200g)",
        price: 11.5,
        isAvailable: true,
      },
    ],
  },
  5: {
    slotId: 5,
    title: "SPECIALTIES & MEAL COMBOS",
    subtitle: "BERLIN FAST-CASUAL ICONS & BUNDLE DEALS",
    categoryBadge: "ICONS & MEALS",
    layoutType: "SPLIT_COMBO",
    items: [
      {
        id: "prod-currywurst-1",
        name: "Original Berlin Currywurst",
        price: 7.5,
        isAvailable: true,
      },
    ],
  },
  6: {
    slotId: 6,
    title: "SIDES & SAUCE BAR",
    subtitle: "CRISPY SIDES & HOMEMADE SIGNATURE SAUCES",
    categoryBadge: "SIDES & SAUCES",
    layoutType: "PRICE_MATRIX",
    items: [
      {
        id: "prod-fries-1",
        name: "Crispy Berlin Fries",
        price: 3.5,
        isAvailable: true,
      },
    ],
  },
  7: {
    slotId: 7,
    title: "DRINKS & HOMEMADE DESSERTS",
    subtitle: "ICE-COLD SODAS, TRADITIONAL AYRAN & FRESH BAKLAVA",
    categoryBadge: "DRINKS & SWEETS",
    layoutType: "PRICE_MATRIX",
    items: [
      {
        id: "prod-ayran-1",
        name: "Traditional Salted Ayran (250ml)",
        price: 2.0,
        isAvailable: true,
      },
      {
        id: "prod-gazoz-1",
        name: "Uludağ Gazoz (330ml Can)",
        price: 2.5,
        isAvailable: true,
      },
    ],
  },
};

// ============================================================================
// 1. DAYPART SCHEDULING ENGINE TESTS
// ============================================================================

test("M10 Daypart Engine - LUNCH Schedule (11:00 to 16:00)", async () => {
  const { resolveActiveDaypart } = await getEngine();

  // Exactly at lower boundary (11:00)
  assert.equal(resolveActiveDaypart(11), "LUNCH", "11:00 must resolve to LUNCH");

  // Mid-lunch hours
  assert.equal(resolveActiveDaypart(12), "LUNCH", "12:00 must resolve to LUNCH");
  assert.equal(resolveActiveDaypart(13.5), "LUNCH", "13:30 must resolve to LUNCH");
  assert.equal(resolveActiveDaypart(14), "LUNCH", "14:00 must resolve to LUNCH");
  assert.equal(resolveActiveDaypart(15), "LUNCH", "15:00 must resolve to LUNCH");

  // Upper boundary edge (15:59)
  assert.equal(resolveActiveDaypart(15.99), "LUNCH", "15:59 must resolve to LUNCH");
});

test("M10 Daypart Engine - DINNER Schedule (16:00 to 23:00)", async () => {
  const { resolveActiveDaypart } = await getEngine();

  // Exactly at lower boundary (16:00)
  assert.equal(resolveActiveDaypart(16), "DINNER", "16:00 must resolve to DINNER");

  // Mid-dinner hours
  assert.equal(resolveActiveDaypart(18), "DINNER", "18:00 must resolve to DINNER");
  assert.equal(resolveActiveDaypart(19.5), "DINNER", "19:30 must resolve to DINNER");
  assert.equal(resolveActiveDaypart(21), "DINNER", "21:00 must resolve to DINNER");
  assert.equal(resolveActiveDaypart(22), "DINNER", "22:00 must resolve to DINNER");

  // Upper boundary edge (22:59)
  assert.equal(resolveActiveDaypart(22.99), "DINNER", "22:59 must resolve to DINNER");
});

test("M10 Daypart Engine - LATE_NIGHT Schedule (23:00 to 04:00 Overnight)", async () => {
  const { resolveActiveDaypart } = await getEngine();

  // Late evening boundary (23:00)
  assert.equal(resolveActiveDaypart(23), "LATE_NIGHT", "23:00 must resolve to LATE_NIGHT");
  assert.equal(resolveActiveDaypart(23.75), "LATE_NIGHT", "23:45 must resolve to LATE_NIGHT");

  // Post-midnight hours
  assert.equal(resolveActiveDaypart(0), "LATE_NIGHT", "00:00 midnight must resolve to LATE_NIGHT");
  assert.equal(resolveActiveDaypart(1), "LATE_NIGHT", "01:00 must resolve to LATE_NIGHT");
  assert.equal(resolveActiveDaypart(2.5), "LATE_NIGHT", "02:30 must resolve to LATE_NIGHT");
  assert.equal(resolveActiveDaypart(3), "LATE_NIGHT", "03:00 must resolve to LATE_NIGHT");

  // Upper boundary edge (03:59)
  assert.equal(resolveActiveDaypart(3.99), "LATE_NIGHT", "03:59 must resolve to LATE_NIGHT");
});

test("M10 Daypart Engine - MORNING Schedule (04:00 to 11:00)", async () => {
  const { resolveActiveDaypart } = await getEngine();

  // Exactly at lower boundary (04:00)
  assert.equal(resolveActiveDaypart(4), "MORNING", "04:00 must resolve to MORNING");

  // Morning preparation and breakfast hours
  assert.equal(resolveActiveDaypart(6), "MORNING", "06:00 must resolve to MORNING");
  assert.equal(resolveActiveDaypart(8.5), "MORNING", "08:30 must resolve to MORNING");
  assert.equal(resolveActiveDaypart(10), "MORNING", "10:00 must resolve to MORNING");

  // Upper boundary edge (10:59)
  assert.equal(resolveActiveDaypart(10.99), "MORNING", "10:59 must resolve to MORNING");
});

test("M10 Daypart Engine - Micro-Step Boundary Transitions (Precision Check)", async () => {
  const { resolveActiveDaypart } = await getEngine();

  // 03:59:59 -> LATE_NIGHT, 04:00:00 -> MORNING
  assert.equal(resolveActiveDaypart(3.9999), "LATE_NIGHT");
  assert.equal(resolveActiveDaypart(4.0000), "MORNING");

  // 10:59:59 -> MORNING, 11:00:00 -> LUNCH
  assert.equal(resolveActiveDaypart(10.9999), "MORNING");
  assert.equal(resolveActiveDaypart(11.0000), "LUNCH");

  // 15:59:59 -> LUNCH, 16:00:00 -> DINNER
  assert.equal(resolveActiveDaypart(15.9999), "LUNCH");
  assert.equal(resolveActiveDaypart(16.0000), "DINNER");

  // 22:59:59 -> DINNER, 23:00:00 -> LATE_NIGHT
  assert.equal(resolveActiveDaypart(22.9999), "DINNER");
  assert.equal(resolveActiveDaypart(23.0000), "LATE_NIGHT");
});

test("M10 Daypart Engine - Accepts Date Object Input & Normalizes Overflow", async () => {
  const { resolveActiveDaypart } = await getEngine();

  // Pass Date object at 12:30 (Lunch)
  const lunchDate = new Date("2026-08-24T12:30:00");
  assert.equal(resolveActiveDaypart(lunchDate), "LUNCH");

  // Pass Date object at 20:15 (Dinner)
  const dinnerDate = new Date("2026-08-24T20:15:00");
  assert.equal(resolveActiveDaypart(dinnerDate), "DINNER");

  // Pass Date object at 02:00 (Late Night)
  const lateNightDate = new Date("2026-08-24T02:00:00");
  assert.equal(resolveActiveDaypart(lateNightDate), "LATE_NIGHT");

  // Pass Date object at 08:00 (Morning)
  const morningDate = new Date("2026-08-24T08:00:00");
  assert.equal(resolveActiveDaypart(morningDate), "MORNING");

  // Handles modulo 24 wrap-around gracefully
  assert.equal(resolveActiveDaypart(25), "LATE_NIGHT", "Hour 25 wraps to 01:00 -> LATE_NIGHT");
  assert.equal(resolveActiveDaypart(-1), "LATE_NIGHT", "Hour -1 wraps to 23:00 -> LATE_NIGHT");
});

// ============================================================================
// 2. SCREEN LAYOUT SLOT RESOLUTION & SOLD OUT OVERLAY TESTS
// ============================================================================

test("M10 Slot Resolution - Resolves Physical Screens 1 to 4 correctly", async () => {
  const { resolveScreenConfig } = await getEngine();

  // Screen 1 -> Hero Promo (Slot 1)
  const screen1 = resolveScreenConfig(1, mock7ScreenConfigs);
  assert.equal(screen1.title, "BERLIN ROTISSERIE HERO");
  assert.equal(screen1.layoutType, "PROMO_HERO");
  assert.equal(screen1.items.length, 1);
  assert.equal(screen1.items[0].name, "Original German Döner (150g)");

  // Screen 2 -> Döner Kebab Selection (Slot 2)
  const screen2 = resolveScreenConfig(2, mock7ScreenConfigs);
  assert.equal(screen2.title, "ORIGINAL DÖNER SELECTION");
  assert.equal(screen2.layoutType, "PRICE_MATRIX");
  assert.equal(screen2.items.length, 4);

  // Screen 3 -> Wraps & Dürüm (Slot 3)
  const screen3 = resolveScreenConfig(3, mock7ScreenConfigs);
  assert.equal(screen3.title, "WRAPS & DÜRÜM");
  assert.equal(screen3.items.length, 2);

  // Screen 4 -> Bowls & Boxes (Slot 4)
  const screen4 = resolveScreenConfig(4, mock7ScreenConfigs);
  assert.equal(screen4.title, "BOWLS & DÖNER BOXES");
  assert.equal(screen4.items.length, 2);
});

test("M10 Slot Resolution - Supports All 7 Content Rotation Slots", async () => {
  const { resolveScreenConfig } = await getEngine();

  // Verify full 7-slot rotation range
  for (let slot = 1; slot <= 7; slot++) {
    const config = resolveScreenConfig(slot, mock7ScreenConfigs);
    assert.ok(config, `Slot ${slot} config must be resolved`);
    assert.equal(config.slotId, slot, `Slot ID must match ${slot}`);
    assert.ok(Array.isArray(config.items), `Slot ${slot} must have items array`);
    assert.ok(config.items.length > 0, `Slot ${slot} must contain at least 1 item`);
  }

  // Screen 5 -> Specialties & Combos
  const screen5 = resolveScreenConfig(5, mock7ScreenConfigs);
  assert.equal(screen5.title, "SPECIALTIES & MEAL COMBOS");

  // Screen 6 -> Sides & Sauce Bar
  const screen6 = resolveScreenConfig(6, mock7ScreenConfigs);
  assert.equal(screen6.title, "SIDES & SAUCE BAR");

  // Screen 7 -> Drinks & Sweets
  const screen7 = resolveScreenConfig(7, mock7ScreenConfigs);
  assert.equal(screen7.title, "DRINKS & HOMEMADE DESSERTS");
});

test("M10 Sold Out Overlay - Overlays isSoldOut: true when Product.isAvailable === false", async () => {
  const { resolveScreenConfig } = await getEngine();

  // Live Inventory indicates Steak Döner is depleted/sold out
  const liveInventory = [
    { id: "prod-doner-1", isAvailable: true },
    { id: "prod-steak-1", isAvailable: false }, // SOLD OUT
    { id: "prod-spezial-1", isAvailable: true },
    { id: "prod-falafel-1", isAvailable: true },
  ];

  const screen2 = resolveScreenConfig(2, mock7ScreenConfigs, liveInventory);

  assert.equal(screen2.items.length, 4);

  // Available items
  const doner = screen2.items.find((i) => i.id === "prod-doner-1");
  assert.equal(doner.isSoldOut, false);
  assert.equal(doner.isAvailable, true);

  // Sold Out item
  const steak = screen2.items.find((i) => i.id === "prod-steak-1");
  assert.equal(steak.isSoldOut, true, "Depleted steak item must have isSoldOut = true");
  assert.equal(steak.isAvailable, false, "Depleted steak item must have isAvailable = false");
  assert.equal(steak.badge, "SOLD OUT", "Depleted item should have SOLD OUT badge overlay");
});

test("M10 Sold Out Overlay - Supports Map and Object Record Inventory Formats", async () => {
  const { resolveScreenConfig } = await getEngine();

  // Test Map format: Map<productId, boolean | { isAvailable: boolean }>
  const inventoryMap = new Map([
    ["prod-doner-1", { isAvailable: false }],
    ["prod-steak-1", { isAvailable: true }],
  ]);

  const fromMap = resolveScreenConfig(2, mock7ScreenConfigs, inventoryMap);
  const donerFromMap = fromMap.items.find((i) => i.id === "prod-doner-1");
  assert.equal(donerFromMap.isSoldOut, true);

  // Test Record/Object format: { [productId]: boolean }
  const inventoryObj = {
    "prod-falafel-1": false,
  };

  const fromObj = resolveScreenConfig(2, mock7ScreenConfigs, inventoryObj);
  const falafelFromObj = fromObj.items.find((i) => i.id === "prod-falafel-1");
  assert.equal(falafelFromObj.isSoldOut, true);
});

test("M10 Slot Resolution - Immutability & Safe Defaults", async () => {
  const { resolveScreenConfig } = await getEngine();

  const originalConfigs = JSON.parse(JSON.stringify(mock7ScreenConfigs));
  const liveInventory = [{ id: "prod-hero-1", isAvailable: false }];

  const resolved = resolveScreenConfig(1, originalConfigs, liveInventory);

  // Resolved config is marked sold out
  assert.equal(resolved.items[0].isSoldOut, true);

  // Original input configs object must NOT be mutated
  assert.equal(originalConfigs[1].items[0].isSoldOut, undefined);
  assert.equal(originalConfigs[1].items[0].isAvailable, true);

  // Out of bounds screen number fallback (e.g. 0, 99)
  const fallback = resolveScreenConfig(99, mock7ScreenConfigs);
  assert.ok(fallback, "Out of bounds screen number should return fallback config");
});

// ============================================================================
// 3. LAYOUT PRESET VALIDATOR TESTS
// ============================================================================

test("M10 Layout Validator - Accepts Valid Layout Presets", async () => {
  const { validateLayoutType } = await getEngine();

  // The 3 official layout presets
  assert.equal(validateLayoutType("PROMO_HERO"), true, "'PROMO_HERO' must be valid");
  assert.equal(validateLayoutType("PRICE_MATRIX"), true, "'PRICE_MATRIX' must be valid");
  assert.equal(validateLayoutType("SPLIT_COMBO"), true, "'SPLIT_COMBO' must be valid");
});

test("M10 Layout Validator - Rejects Invalid Presets, Lowercase & Non-String Types", async () => {
  const { validateLayoutType } = await getEngine();

  // Invalid layout names
  assert.equal(validateLayoutType("GRID"), false);
  assert.equal(validateLayoutType("CAROUSEL"), false);
  assert.equal(validateLayoutType("HERO_BANNER"), false);
  assert.equal(validateLayoutType("RANDOM_LAYOUT"), false);
  assert.equal(validateLayoutType(""), false);

  // Case sensitivity enforcement (must be exact uppercase)
  assert.equal(validateLayoutType("promo_hero"), false);
  assert.equal(validateLayoutType("Price_Matrix"), false);
  assert.equal(validateLayoutType("split_combo"), false);

  // Malformed & Non-String Types
  assert.equal(validateLayoutType(null), false);
  assert.equal(validateLayoutType(undefined), false);
  assert.equal(validateLayoutType(123), false);
  assert.equal(validateLayoutType(true), false);
  assert.equal(validateLayoutType({}), false);
  assert.equal(validateLayoutType(["PROMO_HERO"]), false);
});

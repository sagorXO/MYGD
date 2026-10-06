// The official MYGD menu (single source) — guards prices, sections and board layout.
import test from "node:test";
import assert from "node:assert/strict";

const {
  MYGD_MENU_SECTIONS,
  MYGD_SAUCES,
  MYGD_MODIFIER_GROUPS,
  MYGD_PROMOTIONS,
  MYGD_MENU_BOARDS,
  allMenuItems,
  findMenuItem,
} = await import("../src/lib/menu/mygd-menu.ts");

const price = (sku) => {
  const item = findMenuItem(sku);
  assert.ok(item, `missing ${sku}`);
  return item.price;
};

test("menu has every section from the official menu, in order", () => {
  assert.deepEqual(
    MYGD_MENU_SECTIONS.map((s) => s.slug),
    [
      "pizza", "tacos", "doezza", "burgers", "doener-burgers", "wraps", "bigs", "bowls",
      "kids-meal", "chicken-nuggets", "chicken-wings", "crunchy-fries", "sweet-potato-fries",
      "loaded-fries", "fresh-salad", "meatballs", "mozzarella-sticks",
      "smoothies", "milkshakes", "fruit-juices", "water-ayran", "energy-drinks", "kombucha",
      "draft-beer", "bottled-beer", "wine", "soft-drinks", "canned-drinks", "coffee",
    ],
  );
});

test("SKUs are unique and every price is a positive amount in cents", () => {
  const items = allMenuItems();
  const skus = items.map((i) => i.sku);
  assert.equal(new Set(skus).size, skus.length);
  for (const i of items) {
    assert.ok(i.price > 0, i.sku);
    assert.equal(Math.round(i.price * 100) / 100, i.price, i.sku);
  }
});

test("food prices match the official menu", () => {
  assert.equal(price("MYGD-PIZZA-MARGHERITA"), 15.9);
  assert.equal(price("MYGD-PIZZA-FIVE-CHEESE"), 17.5);
  assert.equal(price("MYGD-PIZZA-CHICKEN-DOENER"), 17.9);
  assert.equal(price("MYGD-TACO-BEEF"), 3.5);
  assert.equal(price("MYGD-DOEZZA-FUNGHI"), 6.95);
  assert.equal(price("MYGD-BURGER-CHEESY-GD"), 9.95);
  assert.equal(price("MYGD-DB-HAMBURG"), 6.9);
  assert.equal(price("MYGD-DB-CHEESE-CHICKEN"), 7.5);
  assert.equal(price("MYGD-WRAP-MIX"), 9.9);
  assert.equal(price("MYGD-WRAP-VEGAN"), 9.9);
  assert.equal(price("MYGD-BIG-GREEN"), 11.9);
  assert.equal(price("MYGD-BOWL-MIX"), 9.9);
  assert.equal(price("MYGD-KIDS-MEAL"), 5);
  assert.equal(price("MYGD-NUGGETS-20"), 11.9);
  assert.equal(price("MYGD-WINGS-12"), 9.9);
  assert.equal(price("MYGD-FRIES-XL"), 4.5);
  assert.equal(price("MYGD-SWEET-FRIES-REG"), 2.9);
  assert.equal(price("MYGD-LOADED-GRAVY"), 7.9);
  assert.equal(price("MYGD-SALAD-HALLOUMI"), 8.9);
  assert.equal(price("MYGD-MEATBALLS-20"), 16.5);
  assert.equal(price("MYGD-MOZZ-6"), 5.9);
});

test("typos from the source menu are fixed", () => {
  assert.equal(findMenuItem("MYGD-WRAP-MIX").name, "Mix Wrap");
  assert.equal(findMenuItem("MYGD-KOMBUCHA-HIBISCUS").name, "Hibiscus");
  assert.equal(MYGD_MENU_SECTIONS.find((s) => s.slug === "wraps").name, "My Wraps");
  assert.equal(MYGD_MENU_SECTIONS.find((s) => s.slug === "water-ayran").name, "Water & Ayran");
  assert.equal(MYGD_MENU_SECTIONS.find((s) => s.slug === "canned-drinks").name, "Canned Drinks");
});

test("Big Mix includes tomatoes", () => {
  assert.match(findMenuItem("MYGD-BIG-MIX").description, /tomatoes/);
});

test("drink prices match the official menu, alcohol carries the ALCOHOL VAT category", () => {
  assert.equal(price("MYGD-SMOOTHIE-TROPICAL"), 2.99);
  assert.equal(price("MYGD-AYRAN-05"), 3.5);
  assert.equal(price("MYGD-KOMBUCHA-HIBISCUS"), 3.5);
  assert.equal(price("MYGD-DRAFT-05"), 6);
  assert.equal(price("MYGD-DRAFT-03"), 4);
  assert.equal(price("MYGD-BEER-HOFBRAEU-ORIGINAL"), 5);
  assert.equal(price("MYGD-BEER-KEO"), 3);
  assert.equal(price("MYGD-WINE-RED"), 4);
  assert.equal(price("MYGD-POSTMIX-COLA"), 2.5);
  assert.equal(price("MYGD-CAN-FANTA-ZERO"), 2.5);
  assert.equal(price("MYGD-COFFEE-LATTE-MACCHIATO"), 3);
  const alcohol = ["draft-beer", "bottled-beer", "wine"];
  for (const item of allMenuItems()) {
    assert.equal(item.vat, alcohol.includes(item.sectionSlug) ? "ALCOHOL" : "FOOD_BEV", item.sku);
  }
});

test("the 12 sauces from the menu, nothing else", () => {
  assert.deepEqual(
    MYGD_SAUCES.map((s) => s.name),
    [
      "Garlic", "BBQ", "Honey Mustard", "Cheese Hot", "Tzatziki", "Sour Cream",
      "Lemon Herb", "Cocktail", "Hot Spicy", "Vegan Garlic", "Mayonnaise", "Ketchup",
    ],
  );
});

test("make it a menu: 3 sizes, fries or rice, a 0.4L drink", () => {
  const group = (slug) => MYGD_MODIFIER_GROUPS.find((g) => g.slug === slug);
  assert.deepEqual(
    group("make-it-a-menu").options.map((o) => [o.name, o.price]),
    [["Regular Menu", 3], ["Medium Menu", 3.5], ["Large Menu", 4.5]],
  );
  assert.deepEqual(group("menu-side").options.map((o) => o.name), ["Fries", "White Rice"]);
  const drinks = group("menu-drink").options.map((o) => o.name);
  assert.ok(drinks.length > 0);
  assert.ok(drinks.every((d) => d.endsWith("(0.4L)")), drinks.join());
  for (const sku of ["MYGD-DB-MY-CHICKEN", "MYGD-WRAP-BEEF", "MYGD-BIG-CHICK", "MYGD-BURGER-BEEFSTER"]) {
    const item = findMenuItem(sku);
    assert.ok(item.allowMealUpgrade, sku);
    for (const g of ["make-it-a-menu", "menu-side", "menu-drink"]) assert.ok(item.modifierGroups.includes(g), `${sku} ${g}`);
  }
});

test("every modifier group an item uses exists", () => {
  const slugs = new Set(MYGD_MODIFIER_GROUPS.map((g) => g.slug));
  for (const item of allMenuItems()) {
    for (const g of item.modifierGroups ?? []) assert.ok(slugs.has(g), `${item.sku} → ${g}`);
  }
});

test("menu offers are defined as automatic promotions", () => {
  const byCode = Object.fromEntries(MYGD_PROMOTIONS.map((p) => [p.code, p]));
  assert.deepEqual(byCode["PIZZA-2ND-20"].rule, { type: "NTH_ITEM_PERCENT", sectionSlug: "pizza", nth: 2, percent: 20 });
  assert.deepEqual(byCode["TACOS-4-FOR-1190"].rule, { type: "BUNDLE_PRICE", sectionSlug: "tacos", quantity: 4, bundlePrice: 11.9 });
});

test("menu boards only reference real sections and cover every section once", () => {
  const sectionSlugs = MYGD_MENU_SECTIONS.map((s) => s.slug);
  const onBoards = MYGD_MENU_BOARDS.flatMap((b) => b.sectionSlugs);
  assert.deepEqual([...onBoards].sort(), [...sectionSlugs].sort());
  assert.deepEqual(MYGD_MENU_BOARDS.map((b) => b.screenNumber), [1, 2, 3, 4, 5]);
});

test("no items from the old menu remain", () => {
  const names = allMenuItems().map((i) => i.name.toLowerCase()).join("|");
  for (const old of ["falafel", "steak", "currywurst", "truffle", "onion ring", "freddo", "chili cheese"]) {
    assert.ok(!names.includes(old), `old item still present: ${old}`);
  }
});

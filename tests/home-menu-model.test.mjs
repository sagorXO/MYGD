import test from "node:test";
import assert from "node:assert/strict";

const m = await import("../src/features/home/menuModel.ts");

const p = (over = {}) => ({ id: "x", name: "Classic Döner", description: "Beef", basePrice: 10, badge: null, isVeggie: false, isSpicy: false, isAvailable: true, ...over });

test("displayCategoryName strips the internal 'Board N:' prefix", () => {
  assert.equal(m.displayCategoryName("Board 1: Döner Buns & Wraps"), "Döner Buns & Wraps");
  assert.equal(m.displayCategoryName("Drinks"), "Drinks");
  assert.equal(m.displayCategoryName("  "), "Menu");
});

test("filterProducts keeps legacy rules and hides unavailable items", () => {
  const items = [
    p({ id: "a", badge: "POPULAR" }),
    p({ id: "b", badge: "CHEF_CHOICE" }),
    p({ id: "c", isVeggie: true }),
    p({ id: "d", name: "Halloumi Salad", isVeggie: true }),
    p({ id: "e", isSpicy: true }),
    p({ id: "f", description: "with chili sauce" }),
    p({ id: "g", isAvailable: false }),
    p({ id: "h", badge: "TOP_SELLER" }),
  ];
  const ids = (f) => m.filterProducts(items, f).map((x) => x.id);
  assert.deepEqual(ids("ALL"), ["a", "b", "c", "d", "e", "f", "h"]);
  assert.deepEqual(ids("POPULAR"), ["a", "b", "h"]);
  assert.deepEqual(ids("VEGGIE"), ["c", "d"]);
  assert.deepEqual(ids("SPICY"), ["e", "f"]);
});

test("productBadges maps backend badges and flags to kit tones without duplicates", () => {
  assert.deepEqual(m.productBadges(p({ badge: "TOP_SELLER" })), [{ label: "Bestseller", tone: "highlight" }]);
  assert.deepEqual(m.productBadges(p({ badge: "CHEF_CHOICE", isSpicy: true })), [
    { label: "Chef's choice", tone: "accent" },
    { label: "Spicy", tone: "critical" },
  ]);
  assert.deepEqual(m.productBadges(p({ badge: "VEGGIE", isVeggie: true })), [{ label: "Veggie", tone: "success" }]);
  assert.deepEqual(m.productBadges(p({ badge: "UNKNOWN" })), []);
});

test("products that can be made a menu say so, after their other badges", () => {
  assert.deepEqual(m.productBadges(p({ allowMealUpgrade: true })), [{ label: "Make it a menu", tone: "info" }]);
  assert.deepEqual(m.productBadges(p({ badge: "TOP_SELLER", allowMealUpgrade: true })), [
    { label: "Bestseller", tone: "highlight" },
    { label: "Make it a menu", tone: "info" },
  ]);
  assert.deepEqual(m.productBadges(p({ allowMealUpgrade: false })), []);
});

test("offerTitles lists active offers by name and ignores blanks", () => {
  assert.deepEqual(m.offerTitles([{ name: "Second pizza 20% off" }, { name: "  " }, { name: "4 tacos for €11.90" }]), [
    "Second pizza 20% off",
    "4 tacos for €11.90",
  ]);
  assert.deepEqual(m.offerTitles(undefined), []);
});

// Option selection rules for the till's customise popup (sauces, kids meal, make-it-a-menu).
import test from "node:test";
import assert from "node:assert/strict";

const sel = await import("../src/modules/pos/option-selection.ts");
const { findMenuItem, findModifierGroup } = await import("../src/lib/menu/mygd-menu.ts");

const groupsOf = (sku) => findMenuItem(sku).modifierGroups.map((slug) => {
  const g = findModifierGroup(slug);
  return { slug: g.slug, name: g.name, minSelected: g.minSelected, maxSelected: g.maxSelected, isRequired: g.isRequired,
    modifiers: g.options.map((o) => ({ slug: o.slug, name: o.name, priceAdjustment: o.price, isDefault: Boolean(o.isDefault) })) };
});

test("defaults are preselected; menu side/drink stay hidden until a size is chosen", () => {
  const groups = groupsOf("MYGD-WRAP-BEEF");
  const s = sel.initialSelection(groups);
  assert.deepEqual(sel.visibleGroups(groups, s).map((g) => g.slug), ["make-it-a-menu"]);
  assert.deepEqual(s["make-it-a-menu"] ?? [], []);
});

test("choosing a menu size reveals side and drink with defaults, and prices the upgrade", () => {
  const groups = groupsOf("MYGD-WRAP-BEEF");
  let s = sel.initialSelection(groups);
  s = sel.toggleOption(groups, s, "make-it-a-menu", "large");
  assert.deepEqual(sel.visibleGroups(groups, s).map((g) => g.slug), ["make-it-a-menu", "menu-side", "menu-drink"]);
  assert.deepEqual(s["menu-side"], ["fries"]);
  assert.equal(s["menu-drink"].length, 1);
  assert.equal(sel.extrasTotal(groups, s), 4.5);
  s = sel.toggleOption(groups, s, "menu-side", "white-rice");
  assert.deepEqual(s["menu-side"], ["white-rice"]);
  assert.deepEqual(sel.validateSelection(groups, s), []);
});

test("deselecting the menu size clears side and drink", () => {
  const groups = groupsOf("MYGD-WRAP-BEEF");
  let s = sel.toggleOption(groups, sel.initialSelection(groups), "make-it-a-menu", "regular");
  s = sel.toggleOption(groups, s, "make-it-a-menu", "regular");
  assert.deepEqual(s["make-it-a-menu"], []);
  assert.deepEqual(s["menu-side"] ?? [], []);
  assert.equal(sel.extrasTotal(groups, s), 0);
});

test("required groups block adding until chosen (bowl needs rice-or-fries and a sauce)", () => {
  const groups = groupsOf("MYGD-BOWL-BEEF");
  let s = sel.initialSelection(groups); // bowl-base defaults to white rice, sauce has no default
  assert.deepEqual(sel.validateSelection(groups, s), ["Sauce of your choice"]);
  s = sel.toggleOption(groups, s, "sauce-choice", "garlic");
  assert.deepEqual(sel.validateSelection(groups, s), []);
  s = sel.toggleOption(groups, s, "sauce-choice", "bbq"); // single choice replaces
  assert.deepEqual(s["sauce-choice"], ["bbq"]);
  s = sel.toggleOption(groups, s, "sauce-choice", "bbq"); // required: cannot be cleared
  assert.deepEqual(s["sauce-choice"], ["bbq"]);
});

test("sauces go to the kitchen as sauces, priced options as additions", () => {
  const groups = groupsOf("MYGD-BIG-B");
  let s = sel.toggleOption(groups, sel.initialSelection(groups), "make-it-a-menu", "medium");
  const out = sel.toLineSelections(groups, s);
  assert.deepEqual(out.selectedSauces, []);
  assert.deepEqual(out.selectedAdditions.map((a) => [a.name, a.priceAdjustment]), [["Medium Menu", 3.5], ["Fries", 0], ["Coca-Cola (0.4L)", 0]]);

  const bowl = groupsOf("MYGD-BOWL-CHICKEN");
  const b = sel.toggleOption(bowl, sel.initialSelection(bowl), "sauce-choice", "lemon-herb");
  assert.deepEqual(sel.toLineSelections(bowl, b).selectedSauces, ["Lemon Herb"]);
});

test("kids meal needs a main and a drink", () => {
  const groups = groupsOf("MYGD-KIDS-MEAL");
  const s = sel.initialSelection(groups);
  assert.deepEqual(sel.validateSelection(groups, s), []);
  assert.deepEqual(sel.toLineSelections(groups, s).selectedAdditions.map((a) => a.name), ["Kids Doener", "Water"]);
});

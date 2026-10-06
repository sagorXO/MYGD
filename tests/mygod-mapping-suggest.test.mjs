import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { suggestMappings, normalizeLabel } = await import("../src/modules/mygod/mapping.suggest.ts");
const { catalogResponseSchema } = await import("../src/modules/mygod/catalog.schema.ts");

const catalog = () => catalogResponseSchema.parse(JSON.parse(readFileSync(new URL("./fixtures/mygod/catalog.json", import.meta.url), "utf8")));

const ourMenu = () => ({
  products: [
    { id: "prd_wrap", sku: "SYN-WRAP", name: "Synthetic Wrap", basePriceCents: 850 },
    { id: "prd_doner", sku: "SYN-DONER", name: "Synthetic Doner", basePriceCents: 690 },
    { id: "prd_burger", sku: "SYN-BURGER", name: "Unrelated Burger", basePriceCents: 1200 },
  ],
  modifierGroups: [
    {
      id: "grp_sauce", slug: "sauce", name: "Sauce",
      modifiers: [
        { id: "mod_garlic", slug: "garlic", name: "Synthetic Garlic", priceAdjustmentCents: 0 },
        { id: "mod_chilli", slug: "chilli", name: "Chilli", priceAdjustmentCents: 0 },
      ],
    },
    { id: "grp_extras", slug: "extras", name: "Extras", modifiers: [{ id: "mod_cheese", slug: "cheese", name: "Synthetic Cheese", priceAdjustmentCents: 50 }] },
    { id: "grp_unused", slug: "unused", name: "Unused Group", modifiers: [{ id: "mod_unused", slug: "unused", name: "Unused", priceAdjustmentCents: 0 }] },
  ],
});

const pick = (report, entityType, externalId) => report.suggestions.find((s) => s.entityType === entityType && s.externalId === externalId);

test("normalizeLabel ignores case, diacritics, punctuation and spacing", () => {
  assert.equal(normalizeLabel("  Synthetic  Döner! "), "synthetic doner");
  assert.equal(normalizeLabel("Synthetic Doner"), "synthetic doner");
  assert.equal(normalizeLabel("Σαλάτα"), normalizeLabel("ΣΑΛΑΤΑ"));
});

test("products: exact name and price is high confidence", () => {
  const report = suggestMappings(catalog(), ourMenu());
  const wrap = pick(report, "PRODUCT", "P001");
  assert.deepEqual(wrap.target, { productId: "prd_wrap" });
  assert.equal(wrap.reason, "name+price");
  assert.equal(wrap.confidence, "high");
  assert.equal(pick(report, "PRODUCT", "P002").target.productId, "prd_doner");
});

test("products: same name but a different price is only medium confidence", () => {
  const report = suggestMappings(catalog(), ourMenu());
  const second = pick(report, "PRODUCT", "P003");
  assert.equal(second.target.productId, "prd_wrap");
  assert.equal(second.reason, "name");
  assert.equal(second.confidence, "medium");
});

test("a DM duplicate display name does not collide: each external id keeps its own suggestion", () => {
  const report = suggestMappings(catalog(), ourMenu());
  const ids = report.suggestions.filter((s) => s.entityType === "PRODUCT").map((s) => s.externalId);
  assert.deepEqual(ids, ["P001", "P002", "P003"]);
});

test("option groups map by title, with high confidence when the choices line up", () => {
  const report = suggestMappings(catalog(), ourMenu());
  const sauce = pick(report, "OPTION_GROUP", "P001_O01");
  assert.deepEqual(sauce.target, { modifierGroupId: "grp_sauce" });
  assert.equal(sauce.reason, "name+choices");
  assert.equal(sauce.confidence, "high");
  assert.equal(pick(report, "OPTION_GROUP", "P002_O01").target.modifierGroupId, "grp_sauce");
  assert.equal(pick(report, "OPTION_GROUP", "P001_O02").target.modifierGroupId, "grp_extras");
});

test("choices map inside the matched group; null DM price is unknown so only name matches", () => {
  const report = suggestMappings(catalog(), ourMenu());
  const garlic = pick(report, "CHOICE", "P001_O01_C01");
  assert.deepEqual(garlic.target, { modifierId: "mod_garlic" });
  assert.equal(garlic.reason, "name+price");
  assert.equal(pick(report, "CHOICE", "P001_O02_C02").target.modifierId, "mod_cheese");
  const unknownPrice = pick(report, "CHOICE", "P002_O01_C01");
  assert.equal(unknownPrice.target.modifierId, "mod_garlic");
  assert.equal(unknownPrice.reason, "name");
});

test("composite ids are never split: choices that share a short id stay separate", () => {
  const report = suggestMappings(catalog(), ourMenu());
  const garlics = report.suggestions.filter((s) => s.entityType === "CHOICE" && s.externalLabel === "Synthetic Garlic");
  assert.deepEqual(garlics.map((s) => s.externalId).sort(), ["P001_O01_C01", "P002_O01_C01"]);
});

test("text options have no counterpart in our menu and are reported as unsupported", () => {
  const report = suggestMappings(catalog(), ourMenu());
  assert.equal(pick(report, "OPTION_GROUP", "P002_O03"), undefined);
  assert.deepEqual(report.unsupported, [{ externalId: "P002_O03", externalLabel: "Name on bag", reason: "text_option" }]);
});

test("an ambiguous name is never guessed", () => {
  const menu = ourMenu();
  menu.products.push({ id: "prd_wrap2", sku: "SYN-WRAP-2", name: "synthetic wrap", basePriceCents: 900 });
  const report = suggestMappings(catalog(), menu);
  // P001 (8.50) and P003 (9.00) each match exactly one of the two by price.
  assert.equal(pick(report, "PRODUCT", "P001").target.productId, "prd_wrap");
  assert.equal(pick(report, "PRODUCT", "P003").target.productId, "prd_wrap2");

  const tied = ourMenu();
  tied.products.push({ id: "prd_wrap_dup", sku: "SYN-WRAP-DUP", name: "Synthetic Wrap", basePriceCents: 850 });
  const tiedReport = suggestMappings(catalog(), tied);
  assert.equal(pick(tiedReport, "PRODUCT", "P001"), undefined);
  const ambiguous = tiedReport.ambiguous.find((a) => a.externalId === "P001");
  assert.deepEqual([...ambiguous.candidates].sort(), ["prd_wrap", "prd_wrap_dup"]);
});

test("C5: the report lists unmatched on their side and unmatched on ours, ids intact", () => {
  const menu = ourMenu();
  menu.products = menu.products.filter((p) => p.id !== "prd_doner");
  const report = suggestMappings(catalog(), menu);
  assert.ok(report.unmatchedExternal.some((u) => u.entityType === "PRODUCT" && u.externalId === "P002"));
  assert.deepEqual(report.unmatchedOurs.productIds, ["prd_burger"]);
  assert.deepEqual(report.unmatchedOurs.modifierGroupIds, ["grp_unused"]);
  assert.deepEqual([...report.unmatchedOurs.modifierIds].sort(), ["mod_chilli", "mod_unused"]);
});

test("C5: counts summarise the report", () => {
  const report = suggestMappings(catalog(), ourMenu());
  assert.equal(report.counts.suggested, report.suggestions.length);
  assert.equal(report.counts.dmProducts, 3);
  assert.equal(report.counts.dmOptionGroups, 3);
  assert.equal(report.counts.dmChoices, 3);
});

test("suggestions are deterministic and sorted (products, groups, choices; by id)", () => {
  const a = suggestMappings(catalog(), ourMenu());
  const b = suggestMappings(catalog(), ourMenu());
  assert.deepEqual(a, b);
  const order = a.suggestions.map((s) => s.entityType);
  const sorted = [...order].sort((x, y) => ["PRODUCT", "OPTION_GROUP", "CHOICE"].indexOf(x) - ["PRODUCT", "OPTION_GROUP", "CHOICE"].indexOf(y));
  assert.deepEqual(order, sorted);
});

test("an empty menu on our side yields no suggestions and everything unmatched", () => {
  const report = suggestMappings(catalog(), { products: [], modifierGroups: [] });
  assert.equal(report.suggestions.length, 0);
  assert.equal(report.counts.dmProducts, 3);
  assert.ok(report.unmatchedExternal.some((u) => u.externalId === "P001"));
});

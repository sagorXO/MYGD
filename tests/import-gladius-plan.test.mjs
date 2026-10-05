import test from "node:test";
import assert from "node:assert/strict";

const load = () => import("../src/lib/import/gladius/plan.ts");

// Synthetic fixture (not real store data) shaped like the Gladius snapshot export.
const item = (o) => ({
  ItemNum: "001-0001", ItemName: "Doner Classic", ItemShortName: null, Store_ID: "1010", Dept_ID: "MEALS", RDept_ID: null,
  Price: 7.5, Retail_Price: 0, Cost: 2.1, LastCost: 2.1, TaxRate: 9, IsModifier: false, IsKit: false, ChoiceItem: false,
  ActiveItem: true, Kitchen: "1", ModGroupCode: null, ModGroupCode1: null, ModGroupCode2: null, PromptPrice: false,
  ImageName: null, LastUpdate: "2026-09-01T10:00:00", ...o,
});
const snapshot = (o = {}) => ({
  departments: [
    { Dept_ID: "MEALS", Description: "MY MEALS", Type: 0, Dept_Parent: "MEALS", Dept_Stations: "01-02-99", TSDisplay: true },
    { Dept_ID: "DRINK", Description: "DRINK", Type: 0, Dept_Parent: "DRINK", Dept_Stations: "01-99-02", TSDisplay: true },
    { Dept_ID: "EMPTY", Description: "NOTHING HERE", Type: 0, Dept_Parent: "EMPTY", Dept_Stations: "", TSDisplay: true },
    { Dept_ID: "888", Description: "FOOD MODIFIERS", Type: 0, Dept_Parent: "888", Dept_Stations: "", TSDisplay: false },
  ],
  taxRates: [{ TaxRate: 0, TaxDesc: "Vat 0", TaxFC: "Z" }, { TaxRate: 5, TaxDesc: "Vat 5", TaxFC: "C" },
    { TaxRate: 9, TaxDesc: "Vat 9", TaxFC: "B" }, { TaxRate: 19, TaxDesc: "Vat 19", TaxFC: "A" }],
  inventory: [
    item({ ModGroupCode: "SAUCE" }),
    item({ ItemNum: "002-0001", ItemName: "Beer", Dept_ID: "DRINK", Price: 4, TaxRate: 19 }),
    item({ ItemNum: "002-0002", ItemName: "Cola", Dept_ID: "DRINK", Price: 2.5, TaxRate: 5 }),
    item({ ItemNum: "002-0003", ItemName: "Water", Dept_ID: "DRINK", Price: 0, TaxRate: 9 }),
    item({ ItemNum: "002-0004", ItemName: "Old Lemonade", Dept_ID: "DRINK", ActiveItem: false }),
    item({ ItemNum: "888-0001", ItemName: "Garlic sauce", Dept_ID: "888", IsModifier: true, Price: 0 }),
    item({ ItemNum: "888-0002", ItemName: "Chili sauce", Dept_ID: "888", IsModifier: true, Price: 0.5 }),
    item({ ItemNum: "001-0002", ItemName: "Doner Classic", Price: 8, Kitchen: "2" }),
  ],
  groupModifiers: [
    { ModGroup: "SAUCE", ModDesc: "Sauces", ModNum: "888-0001", ModName: "Garlic sauce", Priced: false, Price: 0, NumSel: "= 1", SortOrder: 1 },
    { ModGroup: "SAUCE", ModDesc: "Sauces", ModNum: "888-0002", ModName: "Chili sauce", Priced: true, Price: 0.5, NumSel: "= 1", SortOrder: 2 },
  ],
  itemPrinters: [{ ItemNum: "001-0001", PrinterName: "kitchen" }, { ItemNum: "001-0001", PrinterName: "PREPARATION" }],
  lastChargedPrice: [{ ItemNum: "001-0001", LastChargedPrice: 7.0, LastSold: "2026-09-20T12:00:00" }],
  ...o,
});
const contractVat = { vatRateToCategory: { "0": "ZERO", "9": "FOOD_BEV", "19": "ALCOHOL" } };

test("import/gladius: active non-modifier items become products keyed by GLD-<ItemNum>", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  const doner = plan.products.find((p) => p.sku === "GLD-001-0001");
  assert.ok(doner);
  assert.equal(doner.name, "Doner Classic");
  assert.equal(doner.basePrice, 7.5);
  assert.equal(doner.vatCategory, "FOOD_BEV");
  assert.equal(doner.categorySlug, "gld-meals");
  assert.equal(plan.products.find((p) => p.sku === "GLD-002-0001").vatCategory, "ALCOHOL");
  assert.ok(!plan.products.some((p) => p.sku === "GLD-888-0001"), "modifier items are not products");
  assert.ok(!plan.products.some((p) => p.sku === "GLD-002-0004"), "inactive items are not imported");
});

test("import/gladius: inactive items are reported, never silently dropped", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  assert.ok(plan.issues.some((i) => i.code === "INACTIVE_SKIPPED" && i.itemNum === "002-0004"));
});

test("import/gladius: an unmapped VAT rate blocks that product and asks for a decision", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  assert.ok(!plan.products.some((p) => p.sku === "GLD-002-0002"), "5% item not imported without a decision");
  const issue = plan.issues.find((i) => i.itemNum === "002-0002");
  assert.equal(issue.code, "VAT_UNMAPPED");
  assert.equal(issue.blocking, true);
});

test("import/gladius: a VAT decision for 5% unblocks those products", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), { vatRateToCategory: { ...contractVat.vatRateToCategory, "5": "FOOD_BEV" } });
  assert.equal(plan.products.find((p) => p.sku === "GLD-002-0002").vatCategory, "FOOD_BEV");
});

test("import/gladius: a missing price blocks the product unless a price override is given", async () => {
  const { buildImportPlan } = await load();
  const blocked = buildImportPlan(snapshot(), contractVat);
  assert.ok(!blocked.products.some((p) => p.sku === "GLD-002-0003"));
  assert.ok(blocked.issues.some((i) => i.code === "PRICE_MISSING" && i.itemNum === "002-0003" && i.blocking));
  const fixed = buildImportPlan(snapshot(), { ...contractVat, priceOverrides: { "002-0003": 1.5 } });
  assert.equal(fixed.products.find((p) => p.sku === "GLD-002-0003").basePrice, 1.5);
});

test("import/gladius: price different from the last sale and duplicate names are warnings, not blockers", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  const diff = plan.issues.find((i) => i.code === "PRICE_DIFFERS_FROM_LAST_SALE" && i.itemNum === "001-0001");
  assert.ok(diff && !diff.blocking);
  assert.match(diff.message, /7\.50.*7\.00/);
  const dup = plan.issues.filter((i) => i.code === "DUPLICATE_NAME");
  assert.deepEqual(dup.map((d) => d.itemNum).sort(), ["001-0001", "001-0002"]);
  assert.ok(dup.every((d) => !d.blocking));
  assert.ok(plan.products.some((p) => p.sku === "GLD-001-0002"), "both duplicates are imported (different SKU)");
});

test("import/gladius: skipItems excludes an item and reports it", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), { ...contractVat, skipItems: ["001-0002"] });
  assert.ok(!plan.products.some((p) => p.sku === "GLD-001-0002"));
  assert.ok(plan.issues.some((i) => i.code === "SKIPPED_BY_DECISION" && i.itemNum === "001-0002"));
});

test("import/gladius: categories come from departments that have importable products only", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  assert.deepEqual(plan.categories.map((c) => c.slug).sort(), ["gld-drink", "gld-meals"]);
  assert.equal(plan.categories.find((c) => c.slug === "gld-meals").name, "MY MEALS");
});

test("import/gladius: modifier groups, priced options and product links", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  assert.equal(plan.modifierGroups.length, 1);
  const g = plan.modifierGroups[0];
  assert.deepEqual({ slug: g.slug, name: g.name, min: g.minSelected, max: g.maxSelected, req: g.isRequired },
    { slug: "gld-sauce", name: "Sauces", min: 1, max: 1, req: true });
  const chili = plan.modifiers.find((m) => m.slug === "888-0002");
  assert.deepEqual({ group: chili.groupSlug, name: chili.name, price: chili.priceAdjustment }, { group: "gld-sauce", name: "Chili sauce", price: 0.5 });
  assert.equal(plan.modifiers.find((m) => m.slug === "888-0001").priceAdjustment, 0);
  assert.deepEqual(plan.productModifierGroups, [{ sku: "GLD-001-0001", groupSlug: "gld-sauce", sortOrder: 0 }]);
});

test("import/gladius: NumSel rules map to min/max and are flagged as an assumption", async () => {
  const { selectionRule } = await load();
  assert.deepEqual(selectionRule("= 1", 5), { minSelected: 1, maxSelected: 1, isRequired: true });
  assert.deepEqual(selectionRule(">=1", 5), { minSelected: 1, maxSelected: 5, isRequired: true });
  assert.deepEqual(selectionRule("= 0", 5), { minSelected: 0, maxSelected: 5, isRequired: false });
  assert.equal(selectionRule("weird", 5), null);
});

test("import/gladius: station hints from the old printer routing are reported for Q-HW-3", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot(), contractVat);
  const hint = plan.stationHints.find((h) => h.sku === "GLD-001-0001");
  assert.deepEqual(hint.printers, ["PREPARATION", "kitchen"]);
  assert.equal(hint.kitchen, "1");
  assert.ok(plan.stationHints.some((h) => h.sku === "GLD-002-0002"), "blocked items still get a routing hint");
  assert.ok(!plan.stationHints.some((h) => h.sku === "GLD-002-0004"), "inactive items don't");
});

test("import/gladius: prices are rounded to cents and names trimmed", async () => {
  const { buildImportPlan } = await load();
  const plan = buildImportPlan(snapshot({ inventory: [item({ ItemName: "  Doner  ", Price: 7.4999 })] }), contractVat);
  assert.equal(plan.products[0].name, "Doner");
  assert.equal(plan.products[0].basePrice, 7.5);
});

test("import/gladius: the snapshot is validated; malformed rows fail loudly", async () => {
  const { parseSnapshot } = await load();
  assert.throws(() => parseSnapshot({ ...snapshot(), inventory: [{ ItemNum: 1 }] }));
});

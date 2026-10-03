import test from "node:test";
import assert from "node:assert/strict";

const { applyImportPlan } = await import("../src/lib/import/gladius/apply.ts");

/** In-memory catalogue implementing the CatalogStore interface. */
function memoryStore() {
  const db = { categories: new Map(), products: new Map(), groups: new Map(), modifiers: new Map(), links: new Set(), audit: [] };
  let id = 0;
  const next = (p) => `${p}_${++id}`;
  return {
    db,
    async upsertCategory(c) {
      const cur = db.categories.get(c.slug);
      if (!cur) { db.categories.set(c.slug, { id: next("cat"), ...c }); return { id: db.categories.get(c.slug).id, change: "created" }; }
      const changed = cur.name !== c.name || cur.sortOrder !== c.sortOrder;
      if (changed) Object.assign(cur, c);
      return { id: cur.id, change: changed ? "updated" : "unchanged" };
    },
    async upsertProduct(p, categoryId) {
      const cur = db.products.get(p.sku);
      if (!cur) { db.products.set(p.sku, { id: next("prd"), ...p, categoryId }); return { id: db.products.get(p.sku).id, change: "created", previousPrice: null }; }
      const changed = cur.name !== p.name || cur.basePrice !== p.basePrice || cur.vatCategory !== p.vatCategory || cur.categoryId !== categoryId;
      const previousPrice = cur.basePrice;
      if (changed) Object.assign(cur, p, { categoryId });
      return { id: cur.id, change: changed ? "updated" : "unchanged", previousPrice };
    },
    async upsertModifierGroup(g) {
      const cur = db.groups.get(g.slug);
      if (!cur) { db.groups.set(g.slug, { id: next("grp"), ...g }); return { id: db.groups.get(g.slug).id, change: "created" }; }
      const changed = ["name", "minSelected", "maxSelected", "isRequired", "sortOrder"].some((k) => cur[k] !== g[k]);
      if (changed) Object.assign(cur, g);
      return { id: cur.id, change: changed ? "updated" : "unchanged" };
    },
    async upsertModifier(m, groupId) {
      const key = `${groupId}/${m.slug}`;
      const cur = db.modifiers.get(key);
      if (!cur) { db.modifiers.set(key, { id: next("mod"), ...m, groupId }); return { id: db.modifiers.get(key).id, change: "created" }; }
      const changed = ["name", "priceAdjustment", "sortOrder"].some((k) => cur[k] !== m[k]);
      if (changed) Object.assign(cur, m);
      return { id: cur.id, change: changed ? "updated" : "unchanged" };
    },
    async linkProductModifierGroup(productId, groupId, sortOrder) {
      const key = `${productId}/${groupId}`;
      if (db.links.has(key)) return { change: "unchanged" };
      db.links.add(key);
      return { change: "created" };
    },
    async audit(entry) { db.audit.push(entry); },
  };
}

const plan = () => ({
  categories: [{ slug: "gld-meals", name: "MY MEALS", sortOrder: 0 }],
  products: [
    { sku: "GLD-001-0001", itemNum: "001-0001", name: "Doner", basePrice: 7.5, vatCategory: "FOOD_BEV", categorySlug: "gld-meals", sortOrder: 0 },
    { sku: "GLD-001-0002", itemNum: "001-0002", name: "Box", basePrice: 9, vatCategory: "FOOD_BEV", categorySlug: "gld-meals", sortOrder: 1 },
  ],
  modifierGroups: [{ slug: "gld-sauce", name: "Sauces", minSelected: 1, maxSelected: 1, isRequired: true, sortOrder: 0 }],
  modifiers: [{ groupSlug: "gld-sauce", slug: "888-0001", name: "Garlic", priceAdjustment: 0, sortOrder: 1 }],
  productModifierGroups: [{ sku: "GLD-001-0001", groupSlug: "gld-sauce", sortOrder: 0 }],
  stationHints: [],
  issues: [],
});

test("import/apply: first run creates everything and counts it", async () => {
  const store = memoryStore();
  const r = await applyImportPlan(plan(), store, { source: "test" });
  assert.deepEqual(r.categories, { created: 1, updated: 0, unchanged: 0 });
  assert.deepEqual(r.products, { created: 2, updated: 0, unchanged: 0 });
  assert.deepEqual(r.modifierGroups, { created: 1, updated: 0, unchanged: 0 });
  assert.deepEqual(r.modifiers, { created: 1, updated: 0, unchanged: 0 });
  assert.deepEqual(r.links, { created: 1, updated: 0, unchanged: 0 });
});

test("import/apply: re-running the same plan changes nothing (idempotent)", async () => {
  const store = memoryStore();
  await applyImportPlan(plan(), store, { source: "test" });
  const auditBefore = store.db.audit.length;
  const r = await applyImportPlan(plan(), store, { source: "test" });
  for (const k of ["categories", "products", "modifierGroups", "modifiers", "links"]) {
    assert.equal(r[k].created + r[k].updated, 0, k);
  }
  assert.equal(store.db.products.size, 2);
  assert.equal(store.db.audit.filter((a) => a.action === "PRICE_CHANGED_BY_IMPORT").length, 0);
  assert.equal(store.db.audit.length, auditBefore + 1, "only the run summary is logged");
});

test("import/apply: a price change updates the product and writes a price audit entry", async () => {
  const store = memoryStore();
  await applyImportPlan(plan(), store, { source: "test" });
  const changed = plan();
  changed.products[0].basePrice = 7.9;
  const r = await applyImportPlan(changed, store, { source: "test" });
  assert.deepEqual(r.products, { created: 0, updated: 1, unchanged: 1 });
  const audit = store.db.audit.find((a) => a.action === "PRICE_CHANGED_BY_IMPORT");
  assert.deepEqual(audit.details, { sku: "GLD-001-0001", from: 7.5, to: 7.9, source: "test" });
});

test("import/apply: products missing from a later plan are never deleted", async () => {
  const store = memoryStore();
  await applyImportPlan(plan(), store, { source: "test" });
  const smaller = plan();
  smaller.products = smaller.products.slice(0, 1);
  await applyImportPlan(smaller, store, { source: "test" });
  assert.equal(store.db.products.size, 2);
});

test("import/apply: refuses a plan that still has blocking issues", async () => {
  const blocked = { ...plan(), issues: [{ code: "VAT_UNMAPPED", blocking: true, itemNum: "x", message: "m" }] };
  await assert.rejects(() => applyImportPlan(blocked, memoryStore(), { source: "test" }), /blocking/i);
});

test("import/apply: a run summary is written to the audit log", async () => {
  const store = memoryStore();
  await applyImportPlan(plan(), store, { source: "snap-2026-09-24" });
  const summary = store.db.audit.find((a) => a.action === "CATALOG_IMPORT_APPLIED");
  assert.equal(summary.details.source, "snap-2026-09-24");
  assert.equal(summary.details.products.created, 2);
});

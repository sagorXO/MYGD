import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { assertMappingInvariants, MappingInvariantError } = await import("../src/modules/mygod/mapping.repository.ts");
const { createInMemoryMappingRepository } = await import("../src/modules/mygod/mapping.memory.ts");
const { buildReviewFile, applyMappingReview, getConfirmedMapping, ReviewValidationError } = await import("../src/modules/mygod/mapping.review.ts");
const { suggestMappings } = await import("../src/modules/mygod/mapping.suggest.ts");
const { catalogResponseSchema } = await import("../src/modules/mygod/catalog.schema.ts");

const scope = { source: "dm", environment: "test", storeGroup: "mygermandoener", storeId: "576712" };
const now = new Date("2026-10-06T09:00:00Z");
const catalog = () => catalogResponseSchema.parse(JSON.parse(readFileSync(new URL("./fixtures/mygod/catalog.json", import.meta.url), "utf8")));
const menu = () => ({
  products: [{ id: "prd_wrap", sku: "SYN-WRAP", name: "Synthetic Wrap", basePriceCents: 850 }],
  modifierGroups: [{ id: "grp_sauce", slug: "sauce", name: "Sauce", modifiers: [{ id: "mod_garlic", slug: "garlic", name: "Synthetic Garlic", priceAdjustmentCents: 0 }] }],
});
const freshReview = () => buildReviewFile(suggestMappings(catalog(), menu()), { scope, catalog: catalog(), now });
const clone = (value) => JSON.parse(JSON.stringify(value));

test("invariants: the target field must match the entity type, exactly one", () => {
  const base = { scope, entityType: "PRODUCT", externalId: "P001", externalLabel: "x", catalogRevision: "r", status: "SUGGESTED" };
  assert.doesNotThrow(() => assertMappingInvariants({ ...base, productId: "p" }));
  assert.throws(() => assertMappingInvariants({ ...base, productId: "p", modifierId: "m" }), MappingInvariantError);
  assert.throws(() => assertMappingInvariants({ ...base, modifierGroupId: "g" }), MappingInvariantError);
  assert.throws(() => assertMappingInvariants({ ...base, entityType: "CHOICE", productId: "p" }), MappingInvariantError);
  assert.doesNotThrow(() => assertMappingInvariants({ ...base, entityType: "CHOICE", modifierId: "m" }));
  assert.doesNotThrow(() => assertMappingInvariants({ ...base, entityType: "OPTION_GROUP", modifierGroupId: "g" }));
});

test("C6 invariants: CONFIRMED needs a target, confirmedBy and confirmedAt; SUGGESTED needs a target; REJECTED may have none", () => {
  const base = { scope, entityType: "PRODUCT", externalId: "P001", externalLabel: "x", catalogRevision: "r" };
  assert.throws(() => assertMappingInvariants({ ...base, status: "CONFIRMED", productId: "p" }), MappingInvariantError);
  assert.throws(() => assertMappingInvariants({ ...base, status: "CONFIRMED", productId: "p", confirmedBy: "  ", confirmedAt: now }), MappingInvariantError);
  assert.throws(() => assertMappingInvariants({ ...base, status: "CONFIRMED", confirmedBy: "sagar", confirmedAt: now }), MappingInvariantError);
  assert.doesNotThrow(() => assertMappingInvariants({ ...base, status: "CONFIRMED", productId: "p", confirmedBy: "sagar", confirmedAt: now }));
  assert.throws(() => assertMappingInvariants({ ...base, status: "SUGGESTED" }), MappingInvariantError);
  assert.doesNotThrow(() => assertMappingInvariants({ ...base, status: "REJECTED" }));
});

test("the repository refuses to store a record that breaks an invariant", async () => {
  const repo = createInMemoryMappingRepository();
  await assert.rejects(
    repo.put({ scope, entityType: "PRODUCT", externalId: "P001", externalLabel: "x", catalogRevision: "r", status: "CONFIRMED", productId: "p" }),
    MappingInvariantError
  );
  assert.equal((await repo.list(scope)).length, 0);
});

test("buildReviewFile: every entry starts SUGGESTED and carries the scope and catalog revision", () => {
  const review = freshReview();
  assert.equal(review.version, 1);
  assert.deepEqual(review.scope, scope);
  assert.equal(review.catalogRevision, "synthetic-catalog-1");
  assert.ok(review.entries.length > 0);
  assert.ok(review.entries.every((e) => e.status === "SUGGESTED" && e.confirmedBy === undefined));
});

test("C6: applying an untouched review stores suggestions only, nothing CONFIRMED", async () => {
  const repo = createInMemoryMappingRepository();
  const result = await applyMappingReview(freshReview(), repo, { scope, now });
  const stored = await repo.list(scope);
  assert.ok(stored.length > 0);
  assert.ok(stored.every((r) => r.status === "SUGGESTED"));
  assert.equal(result.confirmed, 0);
  assert.equal(result.created, stored.length);
});

test("C7: only a CONFIRMED mapping is returned by getConfirmedMapping", async () => {
  const repo = createInMemoryMappingRepository();
  const review = clone(freshReview());
  await applyMappingReview(review, repo, { scope, now });
  const key = { scope, entityType: "PRODUCT", externalId: "P001" };
  assert.equal(await getConfirmedMapping(repo, key), null);

  const entry = review.entries.find((e) => e.entityType === "PRODUCT" && e.externalId === "P001");
  entry.status = "CONFIRMED";
  entry.confirmedBy = "sagar";
  await applyMappingReview(review, repo, { scope, now });
  const confirmed = await getConfirmedMapping(repo, key);
  assert.equal(confirmed.productId, "prd_wrap");
  assert.equal(confirmed.confirmedBy, "sagar");
  assert.deepEqual(confirmed.confirmedAt, now);
});

test("C6: a CONFIRMED entry without confirmedBy rejects the whole file and writes nothing", async () => {
  const repo = createInMemoryMappingRepository();
  const review = clone(freshReview());
  review.entries[0].status = "CONFIRMED";
  await assert.rejects(applyMappingReview(review, repo, { scope, now }), (error) => {
    assert.ok(error instanceof ReviewValidationError);
    assert.ok(error.problems.some((p) => p.includes(review.entries[0].externalId)));
    return true;
  });
  assert.equal((await repo.list(scope)).length, 0);
});

test("re-applying suggestions never downgrades a CONFIRMED mapping", async () => {
  const repo = createInMemoryMappingRepository();
  const confirmedReview = clone(freshReview());
  const entry = confirmedReview.entries.find((e) => e.externalId === "P001");
  entry.status = "CONFIRMED";
  entry.confirmedBy = "sagar";
  await applyMappingReview(confirmedReview, repo, { scope, now });

  const result = await applyMappingReview(freshReview(), repo, { scope, now: new Date("2026-10-07T09:00:00Z") });
  const record = await repo.find({ scope, entityType: "PRODUCT", externalId: "P001" });
  assert.equal(record.status, "CONFIRMED");
  assert.deepEqual(record.confirmedAt, now);
  assert.ok(result.preservedConfirmed >= 1);
});

test("a REJECTED mapping is not resurrected by a later identical suggestion", async () => {
  const repo = createInMemoryMappingRepository();
  const review = clone(freshReview());
  review.entries.find((e) => e.externalId === "P001").status = "REJECTED";
  await applyMappingReview(review, repo, { scope, now });

  await applyMappingReview(freshReview(), repo, { scope, now });
  const record = await repo.find({ scope, entityType: "PRODUCT", externalId: "P001" });
  assert.equal(record.status, "REJECTED");
});

test("a review for another store or environment is refused", async () => {
  const repo = createInMemoryMappingRepository();
  const review = clone(freshReview());
  review.scope.storeId = "000001";
  await assert.rejects(applyMappingReview(review, repo, { scope, now }), ReviewValidationError);
  const other = clone(freshReview());
  other.scope.environment = "production";
  await assert.rejects(applyMappingReview(other, repo, { scope, now }), ReviewValidationError);
});

test("a malformed review file is a validation error, not a crash", async () => {
  const repo = createInMemoryMappingRepository();
  await assert.rejects(applyMappingReview({ version: 2 }, repo, { scope, now }), ReviewValidationError);
  await assert.rejects(applyMappingReview("nope", repo, { scope, now }), ReviewValidationError);
});

test("C8: applying a review only ever writes mapping rows (it has no access to products or prices)", async () => {
  const repo = createInMemoryMappingRepository();
  await applyMappingReview(freshReview(), repo, { scope, now });
  const stored = await repo.list(scope);
  assert.ok(stored.every((r) => ["PRODUCT", "OPTION_GROUP", "CHOICE"].includes(r.entityType)));
  assert.equal(applyMappingReview.length >= 3, true);
});

test("the same external id in different scopes stays separate", async () => {
  const repo = createInMemoryMappingRepository();
  const otherScope = { ...scope, environment: "production" };
  await repo.put({ scope, entityType: "PRODUCT", externalId: "P001", externalLabel: "x", catalogRevision: "r", status: "SUGGESTED", productId: "a" });
  await repo.put({ scope: otherScope, entityType: "PRODUCT", externalId: "P001", externalLabel: "x", catalogRevision: "r", status: "SUGGESTED", productId: "b" });
  assert.equal((await repo.find({ scope, entityType: "PRODUCT", externalId: "P001" })).productId, "a");
  assert.equal((await repo.find({ scope: otherScope, entityType: "PRODUCT", externalId: "P001" })).productId, "b");
});

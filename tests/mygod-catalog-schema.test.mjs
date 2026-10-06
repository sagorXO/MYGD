import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { catalogResponseSchema } = await import("../src/modules/mygod/catalog.schema.ts");

const fixture = () => JSON.parse(readFileSync(new URL("./fixtures/mygod/catalog.json", import.meta.url), "utf8"));

test("the synthetic catalog fixture validates", () => {
  const result = catalogResponseSchema.safeParse(fixture());
  assert.equal(result.success, true, result.success ? "" : JSON.stringify(result.error.issues));
});

test("null price and null availability stay null (unknown, never 0 or available)", () => {
  const parsed = catalogResponseSchema.parse(fixture());
  const doener = parsed.catalog.products.find((p) => p.id === "P002");
  assert.equal(doener.available, null);
  const choice = doener.options[0].choices[0];
  assert.equal(choice.price, null);
  assert.equal(choice.available, null);
});

test("full composite ids are preserved unchanged", () => {
  const parsed = catalogResponseSchema.parse(fixture());
  const ids = parsed.catalog.products.flatMap((p) => p.options.flatMap((o) => o.choices.map((c) => c.option_id_choice_id)));
  assert.deepEqual(ids, ["P001_O01_C01", "P001_O02_C02", "P002_O01_C01"]);
});

test("a text option with no choices and null limits is valid", () => {
  const parsed = catalogResponseSchema.parse(fixture());
  const text = parsed.catalog.products[1].options[1];
  assert.equal(text.type, "text");
  assert.deepEqual(text.choices, []);
  assert.equal(text.min_selected, null);
});

test("unknown extra fields are rejected (the contract is additionalProperties:false)", () => {
  const withTopLevel = { ...fixture(), surprise: 1 };
  assert.equal(catalogResponseSchema.safeParse(withTopLevel).success, false);
  const withNested = fixture();
  withNested.catalog.products[0].extra = true;
  assert.equal(catalogResponseSchema.safeParse(withNested).success, false);
});

test("missing required fields, wrong version and a null product price are rejected", () => {
  const noRevision = fixture();
  delete noRevision.catalog_revision;
  assert.equal(catalogResponseSchema.safeParse(noRevision).success, false);

  assert.equal(catalogResponseSchema.safeParse({ ...fixture(), schema_version: "dm.sagar.v2" }).success, false);
  assert.equal(catalogResponseSchema.safeParse({ ...fixture(), success: false }).success, false);

  const nullPrice = fixture();
  nullPrice.catalog.products[0].price = null;
  assert.equal(catalogResponseSchema.safeParse(nullPrice).success, false);

  const negative = fixture();
  negative.catalog.products[0].price = -1;
  assert.equal(catalogResponseSchema.safeParse(negative).success, false);
});

test("a complete empty catalog is a valid result, distinct from a failure", () => {
  const empty = fixture();
  empty.catalog = { products: [], categories: [] };
  assert.equal(catalogResponseSchema.safeParse(empty).success, true);
});

test("rejects an unknown environment and a non-EUR currency", () => {
  assert.equal(catalogResponseSchema.safeParse({ ...fixture(), environment: "staging" }).success, false);
  assert.equal(catalogResponseSchema.safeParse({ ...fixture(), currency: "USD" }).success, false);
});

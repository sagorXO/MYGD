import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { saveCatalogSnapshot, loadLatestCatalogSnapshot } = await import("../src/modules/mygod/snapshot.ts");
const { catalogResponseSchema } = await import("../src/modules/mygod/catalog.schema.ts");

const fixture = () => catalogResponseSchema.parse(JSON.parse(readFileSync(new URL("./fixtures/mygod/catalog.json", import.meta.url), "utf8")));
const scratch = () => join(mkdtempSync(join(tmpdir(), "mygod-snap-")), "snapshots");
const mode = (path) => statSync(path).mode & 0o777;

test("C4: saves a timestamped file with owner-only permissions in an owner-only directory", () => {
  const dir = scratch();
  try {
    const path = saveCatalogSnapshot(dir, fixture(), { now: new Date("2026-10-06T08:15:30Z") });
    assert.equal(mode(dir), 0o700);
    assert.equal(mode(path), 0o600);
    const name = readdirSync(dir)[0];
    assert.match(name, /^catalog-synthetic-catalog-1-20261006T081530Z\.json$/);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("C4: the revision is sanitised so it cannot escape the snapshot directory", () => {
  const dir = scratch();
  try {
    const evil = { ...fixture(), catalog_revision: "../../etc/passwd rev" };
    const path = saveCatalogSnapshot(dir, evil, { now: new Date("2026-10-06T08:15:30Z") });
    assert.equal(join(path, ".."), dir);
    assert.deepEqual(readdirSync(dir).length, 1);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("loads the newest snapshot and re-validates it", () => {
  const dir = scratch();
  try {
    saveCatalogSnapshot(dir, { ...fixture(), catalog_revision: "rev-old" }, { now: new Date("2026-10-05T08:00:00Z") });
    saveCatalogSnapshot(dir, { ...fixture(), catalog_revision: "rev-new" }, { now: new Date("2026-10-06T08:00:00Z") });
    const loaded = loadLatestCatalogSnapshot(dir);
    assert.equal(loaded.catalog.catalog_revision, "rev-new");
    assert.match(loaded.path, /rev-new/);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("an empty or missing snapshot directory is a clear error, not an empty catalog", () => {
  const dir = scratch();
  assert.throws(() => loadLatestCatalogSnapshot(dir), /No catalog snapshot/);
  rmSync(join(dir, ".."), { recursive: true, force: true });
});

test("a corrupted snapshot is rejected instead of being half-used", () => {
  const dir = scratch();
  try {
    const path = saveCatalogSnapshot(dir, fixture(), { now: new Date("2026-10-06T08:15:30Z") });
    writeFileSync(path, JSON.stringify({ success: true }));
    assert.throws(() => loadLatestCatalogSnapshot(dir), /invalid/i);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

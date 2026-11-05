import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync("data/checklists/mygd-station-checklists.v1.json", "utf8"));
const inv = JSON.parse(readFileSync("data/checklists/inventory-snapshot.v1.json", "utf8"));
const all = d.checklists.flatMap((g) => g.items.map((i) => ({ ...i, mode: g.mode, station: g.station, phase: g.phase, group: g.group })));

test("all of Oliver's tasks are present", () => assert.equal(all.length, 358));
test("task split matches the approved design", () => {
  const n = (m) => all.filter((i) => i.mode === m).length;
  assert.deepEqual([n("TICK"), n("CHECK_IN"), n("REFERENCE_PER_ORDER"), n("COUNT")], [219, 105, 22, 12]);
});
test("critical tasks are tick tasks only", () => {
  const c = all.filter((i) => i.critical);
  assert.equal(c.length, 30);
  assert.ok(c.every((i) => i.mode === "TICK"));
});
test("temperature tasks have a target", () => {
  const t = all.filter((i) => i.kind === "TEMPERATURE");
  assert.equal(t.length, 2);
  assert.ok(t.every((i) => ["CHILLED", "HOT_HOLDING", "FROZEN"].includes(i.haccpTarget)));
});
test("a section is unique within a station and phase", () => {
  const keys = d.checklists.map((g) => `${g.station}|${g.phase}|${g.group}`);
  assert.equal(new Set(keys).size, keys.length);
});
test("all 83 stock lines are present and unique within a category", () => {
  assert.equal(inv.items.length, 83);
  const keys = inv.items.map((r) => `${r.category}|${r.product}`);
  assert.equal(new Set(keys).size, 83);
});

// Sagar, 19 Nov 2026: "don't require the shift leader to sign off as the shift leader will be checking everything".
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { render } from "./helpers/render.mjs";

const { ShiftLeaderView } = await import("../src/modules/checklists/components/ShiftLeaderView.tsx");
const { ItemChips, StationChip } = await import("../src/modules/checklists/components/StatusChips.tsx");

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

const entry = (o = {}) => ({ status: "COMPLETED", temperature: null, isCompliant: null, correctiveAction: null, note: null, recordedByName: "Ana", recordedAt: "2026-11-19T08:00:00Z", ...o });
const item = (id, label, o = {}) => ({ id, label, kind: "CHECK", haccpTarget: null, needsReview: null, mode: "TICK", entry: null, ...o });
const board = {
  loaded: true,
  shiftDate: "2026-11-19",
  timeZone: "Asia/Nicosia",
  openingTime: "11:30",
  closingTime: "22:00",
  minutesToOpening: 60,
  runs: [],
  quietPeriod: {},
  stationGuide: {},
  operator: { id: "u2", name: "Sam", role: "STORE_MANAGER" },
  sections: [
    {
      id: "s1", station: "MEAT_HOT", stationName: "Meat / Hot Station", phase: "OPENING", title: "Hot holding", mode: "TICK", lastCheckIn: null,
      items: [
        item("a", "Check hot holding temperature", { kind: "TEMPERATURE", haccpTarget: "HOT_HOLDING", entry: entry({ temperature: 55, isCompliant: false, correctiveAction: "Reheated to 75 °C" }) }),
        item("b", "Prepare clean GN containers", { entry: entry() }),
        item("c", "Prepare knives and tongs", { entry: entry({ status: "ISSUE_BLOCKED", note: "Tongs missing" }) }),
      ],
    },
  ],
};
const noop = () => {};
const dashboard = () => render(ShiftLeaderView, { board, phase: "OPENING", stock: [], onPhase: noop, onOpenStation: noop, onOpenStock: noop, onResolve: noop, onOpeningTime: noop });

test("the verify route and its client call are gone", () => {
  assert.equal(existsSync("src/app/api/checklists/items/[itemId]/verify"), false);
  assert.doesNotMatch(readFileSync("src/modules/checklists/components/checklistApi.ts", "utf8"), /verify/i);
  assert.doesNotMatch(readFileSync("src/modules/checklists/checklists.service.ts", "utf8"), /verifyItem|verifyEntry/);
});

test("no checklist screen mentions sign-off, verifying or critical tasks", () => {
  for (const f of walk("src/modules/checklists/components")) {
    const src = readFileSync(f, "utf8");
    assert.doesNotMatch(src, /sign-?off|Awaiting|>Verify<|Verified by|critOpen|isCritical|critical open/i, f);
  }
});

test("the Shift Leader dashboard keeps progress, issues, out-of-range readings with the action taken, stock and opening time", () => {
  const html = dashboard();
  for (const text of ["Tasks done", "Issues", "Tongs missing", "Out-of-range readings", "Check hot holding temperature", "Reheated to 75 °C", "Stock", "Opening time"]) {
    assert.ok(html.includes(text), text);
  }
  assert.doesNotMatch(html, /sign-?off|Verify|Critical/i);
});

test("a ticked task shows no sign-off badge and a finished station reads Completed", () => {
  assert.equal(render(ItemChips, { item: item("b", "Done task", { entry: entry() }) }), "");
  assert.match(render(StationChip, { status: "COMPLETED" }), /Completed/);
  assert.match(render(StationChip, { status: "VERIFIED" }), /Completed/);
});

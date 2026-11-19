import test from "node:test";
import assert from "node:assert/strict";

const R = await import("../src/modules/checklists/rules.ts");
const NOW = new Date("2026-11-05T08:52:00Z"); // 10:52 in Nicosia
const ANA = { id: "u1", name: "Ana", role: "STORE_STAFF" };
const SAM = { id: "u2", name: "Sam", role: "STORE_MANAGER" };
const task = (o = {}) => ({ kind: "CHECK", haccpTarget: null, mode: "TICK", label: "Task", ...o });
const tempTask = (o = {}) => task({ kind: "TEMPERATURE", haccpTarget: "CHILLED", ...o });
const next = (item, current, input, operator = ANA) => R.nextEntry({ item, current, input, operator, now: NOW });

// --- ticking -----------------------------------------------------------------
test("ticking records who and when", () => {
  const e = next(task(), null, { action: "DONE" });
  assert.equal(e.status, "COMPLETED");
  assert.equal(e.recordedById, "u1");
  assert.equal(e.recordedByName, "Ana");
  assert.equal(e.recordedAt.getTime(), NOW.getTime());
});

test("only tick-mode tasks can be ticked", () => {
  for (const mode of ["CHECK_IN", "REFERENCE_PER_ORDER", "COUNT"]) {
    assert.throws(() => next(task({ mode }), null, { action: "DONE" }), R.ChecklistRuleError);
  }
});

test("undoing clears the tick and the reading", () => {
  const e = next(tempTask(), { status: "COMPLETED", temperature: 3, isCompliant: true, recordedById: "u1" }, { action: "UNDO" });
  assert.equal(e.status, "NOT_STARTED");
  assert.equal(e.temperature, null);
  assert.equal(e.recordedById, null);
});

test("a task signed off under the old flow is just done, and staff can change it", () => {
  const old = { status: "VERIFIED", verifiedById: "u2", verifiedByName: "Sam", verifiedAt: NOW };
  assert.equal(R.isDone("VERIFIED"), true);
  assert.equal(next(task(), old, { action: "UNDO" }).status, "NOT_STARTED");
  const e = next(task(), old, { action: "DONE" });
  assert.equal(e.status, "COMPLETED");
  assert.equal(e.verifiedById, null);
});

// --- temperatures -------------------------------------------------------------
test("a temperature task cannot be ticked without a reading", () => {
  assert.throws(() => next(tempTask(), null, { action: "DONE" }), /reading/i);
});

test("an in-range reading is saved as compliant", () => {
  const e = next(tempTask(), null, { action: "DONE", temperature: 4.2 });
  assert.equal(e.temperature, 4.2);
  assert.equal(e.isCompliant, true);
  assert.equal(e.correctiveAction, null);
});

test("an out-of-range reading needs a corrective action", () => {
  assert.throws(() => next(tempTask(), null, { action: "DONE", temperature: 9 }), /what you did/i);
  assert.throws(() => next(tempTask(), null, { action: "DONE", temperature: 9, correctiveAction: "   " }), /what you did/i);
  const e = next(tempTask(), null, { action: "DONE", temperature: 9, correctiveAction: "Moved stock, called engineer" });
  assert.equal(e.isCompliant, false);
  assert.equal(e.correctiveAction, "Moved stock, called engineer");
});

test("a temperature task without a target cannot be saved", () => {
  assert.throws(() => next(tempTask({ haccpTarget: null }), null, { action: "DONE", temperature: 4 }), R.ChecklistRuleError);
});

// --- issues and notes ---------------------------------------------------------
test("an issue blocks the task and keeps the note", () => {
  const e = next(task(), null, { action: "ISSUE", note: "Out of red cabbage" });
  assert.equal(e.status, "ISSUE_BLOCKED");
  assert.equal(e.note, "Out of red cabbage");
  assert.equal(e.recordedByName, "Ana");
});

test("clearing an issue reopens the task", () => {
  const e = next(task(), { status: "ISSUE_BLOCKED", note: "x" }, { action: "CLEAR_ISSUE" });
  assert.equal(e.status, "NOT_STARTED");
  assert.equal(e.note, null);
});

test("a note does not change the status", () => {
  const e = next(task(), { status: "COMPLETED", recordedById: "u1", recordedByName: "Ana", recordedAt: NOW }, { action: "NOTE", note: "Low on gloves" }, SAM);
  assert.equal(e.status, "COMPLETED");
  assert.equal(e.note, "Low on gloves");
  assert.equal(e.recordedByName, "Ana");
});

test("a note on an untouched task leaves it not started", () => {
  assert.equal(next(task(), null, { action: "NOTE", note: "hi" }).status, "NOT_STARTED");
});

// --- no sign-off ----------------------------------------------------------------
test("there is no Shift Leader sign-off step: a ticked task is done", () => {
  assert.equal(R.verifyEntry, undefined);
  assert.equal(next(task(), null, { action: "DONE" }, ANA).status, "COMPLETED");
  assert.equal(R.isDone("COMPLETED"), true);
});

// --- finishing and progress -----------------------------------------------------
const items = () => [
  { id: "a", label: "Alpha", mode: "TICK", entry: { status: "COMPLETED" } },
  { id: "b", label: "Beta", mode: "TICK", entry: null },
  { id: "c", label: "Gamma", mode: "TICK", entry: { status: "ISSUE_BLOCKED" } },
  { id: "d", label: "Delta", mode: "CHECK_IN", entry: null },
  { id: "e", label: "Eps", mode: "REFERENCE_PER_ORDER", entry: null },
];

test("finishing is refused and lists every open tick task", () => {
  assert.deepEqual(R.missingTasks(items()).map((i) => i.label), ["Beta", "Gamma"]);
  assert.equal(R.canFinish(items()), false);
});

test("finishing is allowed once all tick tasks are done", () => {
  const done = items().map((i) => (i.mode === "TICK" ? { ...i, entry: { status: i.id === "a" ? "VERIFIED" : "COMPLETED" } } : i));
  assert.equal(R.canFinish(done), true);
});

test("a phase with no tick tasks cannot be finished", () => {
  assert.equal(R.canFinish([{ id: "d", label: "D", mode: "CHECK_IN", entry: null }]), false);
});

test("progress counts tick tasks and issues", () => {
  assert.deepEqual(R.progress(items()), { total: 3, done: 1, issues: 1 });
});

test("station status: not started, in progress, completed or issue (never waiting for sign-off)", () => {
  assert.equal(R.stationStatus({ total: 3, done: 0, issues: 0 }), "NOT_STARTED");
  assert.equal(R.stationStatus({ total: 3, done: 1, issues: 0 }), "IN_PROGRESS");
  assert.equal(R.stationStatus({ total: 3, done: 3, issues: 0 }), "COMPLETED");
  assert.equal(R.stationStatus({ total: 3, done: 3, issues: 1 }), "ISSUE_BLOCKED");
});

// --- opening time and shift date ---------------------------------------------------
test("the deadline follows the opening time setting", () => {
  assert.equal(R.minutesToOpening("11:30", NOW, "Asia/Nicosia"), 38);
  assert.equal(R.minutesToOpening("12:00", NOW, "Asia/Nicosia"), 68);
  assert.equal(R.minutesToOpening("10:00", NOW, "Asia/Nicosia"), -52);
});

test("the shift date follows the store's local day, not UTC", () => {
  assert.equal(R.shiftDateString(new Date("2026-11-06T03:00:00Z"), "Asia/Nicosia"), "2026-11-06"); // 05:00 local
  assert.equal(R.shiftDateString(new Date("2026-11-05T21:30:00Z"), "Asia/Nicosia"), "2026-11-05"); // 23:30 local
});

// --- stock ---------------------------------------------------------------------
test("stock status uses the LOW level once one is set", () => {
  assert.equal(R.stockStatus({ count: 0, lowAt: 3, chosen: null }), "OUT");
  assert.equal(R.stockStatus({ count: 3, lowAt: 3, chosen: null }), "LOW");
  assert.equal(R.stockStatus({ count: 4, lowAt: 3, chosen: "LOW" }), "OK");
});

test("without a LOW level staff choose the status", () => {
  assert.equal(R.stockStatus({ count: 5, lowAt: null, chosen: "LOW" }), "LOW");
  assert.equal(R.stockStatus({ count: 5, lowAt: null, chosen: null }), null);
  assert.equal(R.stockStatus({ count: 0, lowAt: null, chosen: null }), "OUT");
  assert.equal(R.stockStatus({ count: null, lowAt: null, chosen: "OUT" }), "OUT");
});

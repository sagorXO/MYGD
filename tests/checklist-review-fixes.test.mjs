// Behaviour pinned down by the independent review of the shift checklists.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const R = await import("../src/modules/checklists/rules.ts");
const { planItemSync } = await import("../src/modules/checklists/item-sync.ts");
const O = await import("../src/lib/auth/operator.ts");
const { createPinLimiter } = await import("../src/lib/auth/rate-limit.ts");

const NOW = new Date("2026-11-05T08:52:00Z");
const ANA = { id: "u1", name: "Ana", role: "STORE_STAFF" };
const SAM = { id: "u2", name: "Sam", role: "STORE_MANAGER" };
const task = (o = {}) => ({ kind: "CHECK", isCritical: true, haccpTarget: null, mode: "TICK", ...o });
const verified = { status: "VERIFIED", recordedById: "u1", verifiedById: "u2", verifiedByName: "Sam", verifiedAt: NOW };
const next = (current, input, operator) => R.nextEntry({ item: task(), current, input, operator, now: NOW });
const statusOf = (fn) => {
  try {
    fn();
    return null;
  } catch (e) {
    return e.status;
  }
};

// --- entries ------------------------------------------------------------------
test("staff cannot undo or overwrite a Shift Leader's sign-off", () => {
  for (const input of [{ action: "UNDO" }, { action: "DONE" }, { action: "ISSUE" }]) {
    assert.equal(statusOf(() => next(verified, input, ANA)), 403, input.action);
  }
});

test("a Shift Leader can undo a sign-off, and staff can still add a note to it", () => {
  assert.equal(next(verified, { action: "UNDO" }, SAM).status, "NOT_STARTED");
  const noted = next(verified, { action: "NOTE", note: "Checked again" }, ANA);
  assert.equal(noted.status, "VERIFIED");
  assert.equal(noted.verifiedById, "u2");
});

test("clearing an issue only works on a task that has one, so it can't wipe a finished task", () => {
  assert.equal(statusOf(() => next({ status: "COMPLETED", recordedById: "u1" }, { action: "CLEAR_ISSUE" }, ANA)), 409);
  assert.equal(statusOf(() => next(verified, { action: "CLEAR_ISSUE" }, SAM)), 409);
  assert.equal(next({ status: "ISSUE_BLOCKED", note: "Broken" }, { action: "CLEAR_ISSUE" }, ANA).status, "NOT_STARTED");
});

test("the change record keeps the previous reading, action and people", () => {
  const before = { status: "COMPLETED", temperature: 3, correctiveAction: null, note: "n", recordedByName: "Ana", verifiedByName: null };
  assert.deepEqual(R.entrySnapshot(before), { status: "COMPLETED", temperature: 3, correctiveAction: null, note: "n", recordedByName: "Ana", verifiedByName: null });
  assert.equal(R.entrySnapshot(null), null);
});

// --- the shift day ------------------------------------------------------------
test("closing that runs past midnight stays on the same shift day", () => {
  assert.equal(R.shiftDateString(new Date("2026-11-05T22:30:00Z"), "Asia/Nicosia"), "2026-11-05"); // 00:30 local
  assert.equal(R.shiftDateString(new Date("2026-11-06T01:59:00Z"), "Asia/Nicosia"), "2026-11-05"); // 03:59 local
  assert.equal(R.shiftDateString(new Date("2026-11-06T02:00:00Z"), "Asia/Nicosia"), "2026-11-06"); // 04:00 local
});

test("the shift day is right in summer time and on both clock-change days", () => {
  assert.equal(R.shiftDateString(new Date("2026-07-01T20:30:00Z"), "Asia/Nicosia"), "2026-07-01"); // 23:30 summer
  assert.equal(R.shiftDateString(new Date("2026-07-02T01:30:00Z"), "Asia/Nicosia"), "2026-07-02"); // 04:30 summer
  assert.equal(R.shiftDateString(new Date("2026-03-29T09:00:00Z"), "Asia/Nicosia"), "2026-03-29"); // clocks forward
  assert.equal(R.shiftDateString(new Date("2026-10-25T09:00:00Z"), "Asia/Nicosia"), "2026-10-25"); // clocks back
});

// --- reloading the task file keeps history under the right task ----------------
const item = (id, label, position, isActive = true) => ({ id, label, position, isActive });
const row = (label, position) => ({ label, position });

test("an unchanged file moves and creates nothing", () => {
  const plan = planItemSync([item("a", "A", 1), item("b", "B", 2)], [row("A", 1), row("B", 2)]);
  assert.deepEqual(plan.moveAside, []);
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.retire, []);
  assert.deepEqual(plan.update, [{ id: "a", label: "A", position: 1 }, { id: "b", label: "B", position: 2 }]);
});

test("a task added in the middle keeps every other task's identity", () => {
  const plan = planItemSync([item("a", "A", 1), item("b", "B", 2)], [row("A", 1), row("New", 2), row("B", 3)]);
  assert.deepEqual(plan.create, [{ label: "New", position: 2 }]);
  assert.deepEqual(plan.update.find((u) => u.id === "b"), { id: "b", label: "B", position: 3 });
  assert.deepEqual(plan.moveAside.map((m) => m.id), ["b"]);
});

test("reworded and removed tasks retire, so past records keep their old text", () => {
  const plan = planItemSync([item("a", "Old words", 1), item("b", "B", 2)], [row("New words", 1), row("B", 2)]);
  assert.deepEqual(plan.retire, ["a"]);
  assert.deepEqual(plan.create, [{ label: "New words", position: 1 }]);
  assert.ok(plan.moveAside.some((m) => m.id === "a"));
});

test("a task that comes back reuses its old record", () => {
  const plan = planItemSync([item("a", "A", -1, false), item("b", "B", 1)], [row("B", 1), row("A", 2)]);
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.update.find((u) => u.id === "a"), { id: "a", label: "A", position: 2 });
});

test("swapped tasks and old retired rows never collide on a position", () => {
  const existing = [item("a", "A", 1), item("b", "B", 2), item("old", "Gone", 3, false), item("older", "Gone 2", -4, false)];
  const plan = planItemSync(existing, [row("B", 1), row("A", 2), row("C", 3)]);
  const aside = plan.moveAside.map((m) => m.position);
  assert.equal(new Set(aside).size, aside.length);
  assert.ok(aside.every((p) => p < -4), "temporary positions must be below every existing one");
  assert.ok(plan.moveAside.some((m) => m.id === "old"), "a retired row sitting on a wanted position must move");
  assert.ok(!plan.moveAside.some((m) => m.id === "older"));
  assert.deepEqual(plan.retire, []);
});

// --- who is at the tablet -------------------------------------------------------
test("a PIN lapses after a few idle minutes on the shared tablet", async () => {
  assert.ok(O.OPERATOR_MAX_AGE_SECONDS <= 5 * 60);
  const secret = "x".repeat(40);
  const token = await O.createOperatorToken({ sub: "u1", usr: "ana", role: "STORE_STAFF" }, secret, NOW);
  const idle = new Date(NOW.getTime() + (O.OPERATOR_MAX_AGE_SECONDS + 1) * 1000);
  assert.equal(await O.verifyOperatorToken(token, secret, idle), null);
  assert.equal(await O.refreshOperatorToken(token, secret, idle), null, "a lapsed PIN can't be revived");
});

test("each action restarts the idle time for the same person", async () => {
  const secret = "x".repeat(40);
  const token = await O.createOperatorToken({ sub: "u1", usr: "ana", role: "STORE_STAFF" }, secret, NOW);
  const later = new Date(NOW.getTime() + (O.OPERATOR_MAX_AGE_SECONDS - 10) * 1000);
  const fresh = await O.refreshOperatorToken(token, secret, later);
  const afterOriginal = new Date(NOW.getTime() + (O.OPERATOR_MAX_AGE_SECONDS + 60) * 1000);
  assert.equal(await O.verifyOperatorToken(token, secret, afterOriginal), null);
  assert.deepEqual(await O.verifyOperatorToken(fresh, secret, afterOriginal), { id: "u1", name: "ana", role: "STORE_STAFF" });
});

test("only real actions count as activity, not screen refreshes", () => {
  assert.equal(O.isOperatorActivity("/api/checklists/items/x/entry", "PUT"), true);
  assert.equal(O.isOperatorActivity("/api/checklists/stock", "PUT"), true);
  assert.equal(O.isOperatorActivity("/api/haccp/readings", "POST"), true);
  assert.equal(O.isOperatorActivity("/api/checklists/board", "GET"), false);
  assert.equal(O.isOperatorActivity("/api/checklists/stock", "GET"), false);
  assert.equal(O.isOperatorActivity("/api/checklists/operator", "DELETE"), false, "signing out must not sign back in");
  assert.equal(O.isOperatorActivity("/api/checklistsx/stock", "PUT"), false);
});

test("repeated wrong PINs lock for longer and longer", () => {
  const limiter = createPinLimiter({ shortLimit: 5, shortWindowMs: 300_000, longLimit: 20, longWindowMs: 3_600_000 });
  const start = 1_000_000;
  for (let i = 0; i < 5; i += 1) limiter.recordFailure("t", start + i);
  assert.equal(limiter.isBlocked("t", start + 10).blocked, true);
  assert.equal(limiter.isBlocked("t", start + 300_100).blocked, false, "a few typos clear after the short wait");
  let now = start + 300_100;
  for (let round = 0; round < 3; round += 1) {
    for (let i = 0; i < 5; i += 1) limiter.recordFailure("t", now + i);
    now += 300_100;
  }
  const state = limiter.isBlocked("t", now);
  assert.equal(state.blocked, true);
  assert.ok(state.retryAfterSec > 300, "guessing earns the long lock");
  assert.equal(state.long, true);
  assert.equal(limiter.isBlocked("other", now).blocked, false);
});

// --- old code paths -------------------------------------------------------------
const source = (path) => readFileSync(path, "utf8");

test("the staff hub reports failures on screen and has no loose types", () => {
  const hub = source("src/modules/haccp/components/StaffHaccpHub.tsx");
  assert.doesNotMatch(hub, /\balert\(/);
  assert.doesNotMatch(hub, /\bany\b/);
  assert.doesNotMatch(hub, /catch \(err\) \{\s*console\.error\(err\);\s*\}/);
});

test("the old checklist log records the PIN holder, not a name from the request", () => {
  const route = source("src/app/api/checklists/log/route.ts");
  assert.match(route, /requireOperator/);
  assert.match(route, /completedBy: auth\.operator\.name/);
  assert.doesNotMatch(route, /const \{[^}]*completedBy[^}]*\} = body/);
});

test("the task loader matches tasks by their text and checks temperature targets", () => {
  const loader = source("scripts/load-checklists.ts");
  assert.match(loader, /planItemSync/);
  assert.doesNotMatch(loader, /sectionId_position/);
  assert.match(loader, /z\.enum\(\["CHILLED", "FROZEN", "HOT_HOLDING"\]\)/);
});

test("stock saves take a lock, so two quick saves can't erase a count", () => {
  assert.match(source("src/modules/checklists/checklists.service.ts"), /"StockItem" WHERE id = \$\{item\.id\} FOR UPDATE/);
});

test("a checklist temperature breach alerts managers like any other reading", () => {
  const service = source("src/modules/checklists/checklists.service.ts");
  assert.match(service, /eventBroker\.publish\("admin"/);
  assert.match(service, /breach \? "CRITICAL" : "INFO"/);
});

import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

const loadLogin = () => import("../src/lib/auth/login.ts");
const loadLimiter = () => import("../src/lib/auth/rate-limit.ts");
const loadStaffPin = () => import("../src/lib/auth/staff-pin.ts");

const NOW = new Date("2026-10-03T10:00:00Z");
const hash = (pin) => bcrypt.hashSync(pin, 4); // low cost: test speed only

/** In-memory AdminUser store implementing the login repository interface. */
function makeRepo(users) {
  const rows = new Map(users.map((u) => [u.username, { failedAttempts: 0, lockedUntil: null, isActive: true, ...u }]));
  return {
    rows,
    async findUserByUsername(username) {
      const r = rows.get(username);
      return r ? { ...r } : null;
    },
    async recordFailedAttempt(id, failedAttempts, lockedUntil) {
      for (const r of rows.values()) if (r.id === id) Object.assign(r, { failedAttempts, lockedUntil });
    },
    async recordSuccess(id) {
      for (const r of rows.values()) if (r.id === id) Object.assign(r, { failedAttempts: 0, lockedUntil: null });
    },
  };
}

const deps = (repo, now = NOW) => ({ repo, comparePin: (pin, h) => bcrypt.compare(pin, h), now: () => now });

const anna = { id: "u1", username: "anna", role: "STORE_STAFF", pinHash: hash("4821") };
const ben = { id: "u2", username: "ben", role: "STORE_MANAGER", pinHash: hash("7390") };

test("auth/login: correct username + PIN signs in and returns the user's role", async () => {
  const { authenticate } = await loadLogin();
  const repo = makeRepo([anna]);
  const res = await authenticate({ username: "anna", pin: "4821" }, deps(repo));
  assert.equal(res.ok, true);
  assert.equal(res.user.id, "u1");
  assert.equal(res.user.role, "STORE_STAFF");
  assert.equal(res.user.pinHash, undefined, "never leak the hash");
});

test("auth/login: wrong PIN fails generically and counts against THAT user only", async () => {
  const { authenticate } = await loadLogin();
  const repo = makeRepo([anna, ben]);
  const res = await authenticate({ username: "ben", pin: "0000" }, deps(repo));
  assert.deepEqual({ ok: res.ok, reason: res.reason }, { ok: false, reason: "INVALID_CREDENTIALS" });
  assert.equal(repo.rows.get("ben").failedAttempts, 1);
  assert.equal(repo.rows.get("anna").failedAttempts, 0, "the old bug locked the first user instead");
});

test("auth/login: 5 failures lock the user for 5 minutes, even against the correct PIN", async () => {
  const { authenticate, MAX_FAILED_ATTEMPTS, LOCKOUT_MS } = await loadLogin();
  assert.equal(MAX_FAILED_ATTEMPTS, 5);
  assert.equal(LOCKOUT_MS, 5 * 60 * 1000);
  const repo = makeRepo([anna]);
  for (let i = 0; i < 5; i++) await authenticate({ username: "anna", pin: "1111" }, deps(repo));
  assert.ok(repo.rows.get("anna").lockedUntil instanceof Date);
  const locked = await authenticate({ username: "anna", pin: "4821" }, deps(repo, new Date(NOW.getTime() + 60_000)));
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, "LOCKED");
  assert.ok(locked.retryAfterSec > 0 && locked.retryAfterSec <= 300);
});

test("auth/login: after the lock expires the counter restarts and the correct PIN works", async () => {
  const { authenticate } = await loadLogin();
  const repo = makeRepo([anna]);
  for (let i = 0; i < 5; i++) await authenticate({ username: "anna", pin: "1111" }, deps(repo));
  const later = new Date(NOW.getTime() + 6 * 60 * 1000);
  const oneMoreWrong = await authenticate({ username: "anna", pin: "1111" }, deps(repo, later));
  assert.equal(oneMoreWrong.reason, "INVALID_CREDENTIALS", "not immediately re-locked");
  assert.equal(repo.rows.get("anna").failedAttempts, 1);
  const ok = await authenticate({ username: "anna", pin: "4821" }, deps(repo, later));
  assert.equal(ok.ok, true);
  assert.equal(repo.rows.get("anna").failedAttempts, 0);
});

test("auth/login: unknown and deactivated users get the same generic error", async () => {
  const { authenticate } = await loadLogin();
  const repo = makeRepo([{ ...anna, isActive: false }]);
  const unknown = await authenticate({ username: "nobody", pin: "4821" }, deps(repo));
  const inactive = await authenticate({ username: "anna", pin: "4821" }, deps(repo));
  assert.equal(unknown.reason, "INVALID_CREDENTIALS");
  assert.equal(inactive.reason, "INVALID_CREDENTIALS");
});

test("auth/login: malformed input is rejected before any lookup", async () => {
  const { authenticate } = await loadLogin();
  const repo = makeRepo([anna]);
  for (const input of [{}, { username: "anna" }, { username: "anna", pin: "12" }, { username: "anna", pin: "12a4" },
    { username: "", pin: "4821" }, { username: "anna", pin: 4821 }, { username: "x".repeat(65), pin: "4821" }]) {
    const res = await authenticate(input, deps(repo));
    assert.equal(res.reason, "INVALID_INPUT", JSON.stringify(input));
  }
  assert.equal(repo.rows.get("anna").failedAttempts, 0);
});

test("auth/rate-limit: blocks a key after N failures in the window, with retry-after", async () => {
  const { createFailureLimiter } = await loadLimiter();
  const rl = createFailureLimiter({ limit: 5, windowMs: 60_000 });
  const t0 = NOW.getTime();
  for (let i = 0; i < 5; i++) {
    assert.equal(rl.isBlocked("10.0.0.1", t0 + i).blocked, false);
    rl.recordFailure("10.0.0.1", t0 + i);
  }
  const blocked = rl.isBlocked("10.0.0.1", t0 + 10);
  assert.equal(blocked.blocked, true);
  assert.ok(blocked.retryAfterSec >= 1 && blocked.retryAfterSec <= 60);
  assert.equal(rl.isBlocked("10.0.0.2", t0 + 10).blocked, false, "keys are independent");
  assert.equal(rl.isBlocked("10.0.0.1", t0 + 60_001).blocked, false, "window resets");
});

test("auth/rate-limit: successful attempts are never counted (shift-change logins on one LAN)", async () => {
  const { createFailureLimiter } = await loadLimiter();
  const rl = createFailureLimiter({ limit: 5, windowMs: 60_000 });
  const t0 = NOW.getTime();
  for (let i = 0; i < 50; i++) assert.equal(rl.isBlocked("local", t0 + i).blocked, false);
});

test("auth/staff-pin: timeclock PIN matches the one active user with that hashed PIN", async () => {
  const { verifyStaffPin } = await loadStaffPin();
  const users = [anna, ben, { id: "u3", username: "old", role: "STORE_STAFF", pinHash: hash("5555"), isActive: false }];
  const match = await verifyStaffPin("7390", users.map((u) => ({ isActive: true, ...u })), (p, h) => bcrypt.compare(p, h));
  assert.equal(match.ok, true);
  assert.equal(match.user.username, "ben");
  assert.equal(match.user.pinHash, undefined);
});

test("auth/staff-pin: wrong, malformed, inactive and duplicate PINs are refused", async () => {
  const { verifyStaffPin } = await loadStaffPin();
  const cmp = (p, h) => bcrypt.compare(p, h);
  const users = [{ ...anna, isActive: true }, { ...ben, isActive: true }];
  assert.equal((await verifyStaffPin("0000", users, cmp)).reason, "NO_MATCH");
  for (const bad of [null, undefined, 4821, "48", "48a1", "123456789"]) {
    assert.equal((await verifyStaffPin(bad, users, cmp)).reason, "INVALID_INPUT", String(bad));
  }
  assert.equal((await verifyStaffPin("5555", [{ id: "u3", username: "old", role: "STORE_STAFF", pinHash: hash("5555"), isActive: false }], cmp)).reason, "NO_MATCH");
  const dup = [{ ...anna, isActive: true }, { id: "u9", username: "twin", role: "STORE_STAFF", pinHash: hash("4821"), isActive: true }];
  assert.equal((await verifyStaffPin("4821", dup, cmp)).reason, "AMBIGUOUS");
});

import test from "node:test";
import assert from "node:assert/strict";

const { createOperatorToken, verifyOperatorToken, OPERATOR_MAX_AGE_SECONDS } = await import("../src/lib/auth/operator.ts");
const { createSessionToken } = await import("../src/lib/auth/session.ts");
const { requiredRole } = await import("../src/lib/auth/policy.ts");

const SECRET = "x".repeat(40);
const USER = { sub: "u1", usr: "ana", role: "STORE_STAFF" };
const NOW = new Date("2026-11-05T08:00:00Z");

test("an operator token identifies the person who entered their PIN", async () => {
  const t = await createOperatorToken(USER, SECRET, NOW);
  const o = await verifyOperatorToken(t, SECRET, NOW);
  assert.deepEqual({ id: o.id, name: o.name, role: o.role }, { id: "u1", name: "ana", role: "STORE_STAFF" });
});

test("an operator token expires so a name can't linger on a shared tablet", async () => {
  const t = await createOperatorToken(USER, SECRET, NOW);
  const later = new Date(NOW.getTime() + (OPERATOR_MAX_AGE_SECONDS + 1) * 1000);
  assert.equal(await verifyOperatorToken(t, SECRET, later), null);
});

test("a login session cannot be used as an operator, and forged tokens fail", async () => {
  const session = await createSessionToken(USER, SECRET, NOW);
  assert.equal(await verifyOperatorToken(session, SECRET, NOW), null);
  assert.equal(await verifyOperatorToken("v1.nope.nope", SECRET, NOW), null);
  assert.equal(await verifyOperatorToken(undefined, SECRET, NOW), null);
});

test("checklists are behind a staff login", () => {
  for (const [p, m] of [["/staff/checklists", "GET"], ["/api/checklists/board", "GET"], ["/api/checklists/operator", "POST"], ["/api/haccp/readings", "POST"]]) {
    assert.equal(requiredRole(p, m), "STORE_STAFF", p);
  }
});

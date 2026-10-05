import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

const SECRET = "c".repeat(48);
process.env.SESSION_SECRET = SECRET;

const { requireRole } = await import("../src/lib/auth/guard.ts");
const { createSessionToken, SESSION_COOKIE } = await import("../src/lib/auth/session.ts");

const req = (cookie) =>
  new NextRequest("http://store.local/api/admin/menu", cookie ? { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } } : {});

test("auth/guard: no session -> 401", async () => {
  const res = await requireRole(req(), "STORE_MANAGER");
  assert.equal(res.ok, false);
  assert.equal(res.response.status, 401);
});

test("auth/guard: staff session on a manager route -> 403", async () => {
  const token = await createSessionToken({ sub: "u1", usr: "anna", role: "STORE_STAFF" }, SECRET);
  const res = await requireRole(req(token), "STORE_MANAGER");
  assert.equal(res.ok, false);
  assert.equal(res.response.status, 403);
});

test("auth/guard: manager and owner sessions pass a manager route", async () => {
  for (const role of ["STORE_MANAGER", "SYSTEM_ADMIN"]) {
    const token = await createSessionToken({ sub: "u2", usr: "ben", role }, SECRET);
    const res = await requireRole(req(token), "STORE_MANAGER");
    assert.equal(res.ok, true, role);
    assert.equal(res.session.role, role);
  }
});

test("auth/guard: a forged cookie is treated as no session", async () => {
  const res = await requireRole(req("v1.eyJzdWIiOiJ4In0.AAAA"), "STORE_STAFF");
  assert.equal(res.response.status, 401);
});

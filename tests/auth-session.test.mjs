import test from "node:test";
import assert from "node:assert/strict";

const load = () => import("../src/lib/auth/session.ts");

const SECRET = "a".repeat(32) + "-test-secret-not-for-production";
const NOW = new Date("2026-10-03T10:00:00Z");
const USER = { sub: "usr_1", usr: "staff_emba", role: "STORE_STAFF" };

test("auth/session: a signed token round-trips to the same identity", async () => {
  const { createSessionToken, verifySessionToken } = await load();
  const token = await createSessionToken(USER, SECRET, NOW);
  const session = await verifySessionToken(token, SECRET, NOW);
  assert.equal(session?.sub, "usr_1");
  assert.equal(session?.usr, "staff_emba");
  assert.equal(session?.role, "STORE_STAFF");
});

test("auth/session: a tampered payload is rejected", async () => {
  const { createSessionToken, verifySessionToken } = await load();
  const token = await createSessionToken(USER, SECRET, NOW);
  const [v, , sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ ...USER, role: "SYSTEM_ADMIN", iat: 0, exp: 9999999999 })).toString("base64url");
  assert.equal(await verifySessionToken(`${v}.${forged}.${sig}`, SECRET, NOW), null);
});

test("auth/session: a token signed with another secret is rejected", async () => {
  const { createSessionToken, verifySessionToken } = await load();
  const token = await createSessionToken(USER, SECRET, NOW);
  assert.equal(await verifySessionToken(token, "b".repeat(40), NOW), null);
});

test("auth/session: an expired token is rejected", async () => {
  const { createSessionToken, verifySessionToken, SESSION_TTL_SECONDS } = await load();
  const token = await createSessionToken(USER, SECRET, NOW);
  const later = new Date(NOW.getTime() + (SESSION_TTL_SECONDS + 1) * 1000);
  assert.equal(await verifySessionToken(token, SECRET, later), null);
});

test("auth/session: malformed or missing tokens are rejected, never thrown", async () => {
  const { verifySessionToken } = await load();
  for (const bad of [undefined, null, "", "abc", "v1.x", "v1.x.y.z", "v2.e30.c2ln", 42]) {
    assert.equal(await verifySessionToken(bad, SECRET, NOW), null, String(bad));
  }
});

test("auth/session: a token with an unknown role is rejected", async () => {
  const { createSessionToken, verifySessionToken } = await load();
  const token = await createSessionToken({ ...USER, role: "SUPERUSER" }, SECRET, NOW).catch(() => null);
  if (token) assert.equal(await verifySessionToken(token, SECRET, NOW), null);
});

test("auth/session: the secret must be set, long enough and not the template placeholder", async () => {
  const { readSessionSecret } = await load();
  assert.throws(() => readSessionSecret(undefined));
  assert.throws(() => readSessionSecret(""));
  assert.throws(() => readSessionSecret("short"));
  assert.throws(() => readSessionSecret("change_me_to_a_secure_random_string_in_production"));
  assert.equal(readSessionSecret(SECRET), SECRET);
});

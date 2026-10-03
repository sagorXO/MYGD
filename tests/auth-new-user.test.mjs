import test from "node:test";
import assert from "node:assert/strict";

const load = () => import("../src/lib/auth/new-user.ts");

test("auth/new-user: accepts a valid username, role and PIN", async () => {
  const { parseNewUser } = await load();
  const r = parseNewUser({ username: "rico", role: "SYSTEM_ADMIN", pin: "582913" });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { username: "rico", role: "SYSTEM_ADMIN", pin: "582913" });
});

test("auth/new-user: rejects bad usernames, roles and PINs with a reason", async () => {
  const { parseNewUser } = await load();
  const bad = [
    { username: "", role: "STORE_STAFF", pin: "582913" },
    { username: "Rico Owner", role: "STORE_STAFF", pin: "582913" },
    { username: "rico", role: "OWNER", pin: "582913" },
    { username: "rico", role: "STORE_STAFF", pin: "12" },
    { username: "rico", role: "STORE_STAFF", pin: "12ab" },
  ];
  for (const input of bad) {
    const r = parseNewUser(input);
    assert.equal(r.ok, false, JSON.stringify(input));
    assert.ok(r.error.length > 0);
  }
});

test("auth/new-user: refuses trivially guessable PINs", async () => {
  const { parseNewUser } = await load();
  for (const pin of ["0000", "1111", "1234", "9999", "4321", "123456", "000000"]) {
    assert.equal(parseNewUser({ username: "rico", role: "STORE_STAFF", pin }).ok, false, pin);
  }
});

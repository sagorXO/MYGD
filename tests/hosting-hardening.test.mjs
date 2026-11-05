import test from "node:test";
import assert from "node:assert/strict";

const { hiddenInProduction } = await import("../src/lib/auth/policy.ts");
const { clientIp } = await import("../src/lib/auth/client-ip.ts");
const { createConnectionGate } = await import("../src/lib/connection-gate.ts");
const { toPublicTicket } = await import("../src/lib/kds-formatter.ts");
const { parseJsonArray } = await import("../src/lib/safe-json.ts");

const PROD = { NODE_ENV: "production" };

test("paused POS routes and dev pages are hidden in production", () => {
  for (const p of ["/pos", "/order", "/api/orders", "/api/pricing", "/api/terminal/print", "/dev/ui", "/dev/preview/home", "/pos/"]) {
    assert.equal(hiddenInProduction(p, PROD), true, p);
  }
  for (const p of ["/", "/kds", "/display", "/staff", "/admin", "/api/kds", "/ordering", "/position", "/signage/ads"]) {
    assert.equal(hiddenInProduction(p, PROD), false, p);
  }
});

test("POS_ENABLED=true brings the POS back but never the dev pages", () => {
  const env = { NODE_ENV: "production", POS_ENABLED: "true" };
  assert.equal(hiddenInProduction("/pos", env), false);
  assert.equal(hiddenInProduction("/api/orders", env), false);
  assert.equal(hiddenInProduction("/dev/ui", env), true);
});

test("nothing is hidden in development", () => {
  assert.equal(hiddenInProduction("/pos", { NODE_ENV: "development" }), false);
  assert.equal(hiddenInProduction("/dev/ui", { NODE_ENV: "development" }), false);
});

test("clientIp takes the address our proxy added, not one the client typed", () => {
  const h = (v) => new Headers(v);
  assert.equal(clientIp(h({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 203.0.113.9" })), "203.0.113.9");
  assert.equal(clientIp(h({ "x-forwarded-for": "203.0.113.9" })), "203.0.113.9");
  assert.equal(clientIp(h({})), "unknown");
  assert.equal(clientIp(h({ "x-forwarded-for": " , " })), "unknown");
});

test("the connection gate caps per client and in total, and frees slots", () => {
  const gate = createConnectionGate({ total: 3, perKey: 2 });
  const a1 = gate.acquire("a");
  const a2 = gate.acquire("a");
  assert.ok(a1 && a2);
  assert.equal(gate.acquire("a"), null, "per-client cap");
  const b1 = gate.acquire("b");
  assert.ok(b1);
  assert.equal(gate.acquire("c"), null, "total cap");
  a1();
  a1(); // releasing twice must not free two slots
  assert.ok(gate.acquire("c"));
  assert.equal(gate.acquire("d"), null);
});

test("the public ticket has what the customer screen needs and no customer text", () => {
  const full = {
    id: "t1", orderNumber: "EMBA-1", orderType: "TAKE_AWAY", station: "GRILL", status: "NEW", createdAt: "2026-11-02T10:00:00Z",
    elapsedSeconds: 30, itemsSummary: "2x Doner", customerNote: "call Anna 99123456", claimedBy: "ben", items: [{ notes: "allergy" }],
  };
  const pub = toPublicTicket(full);
  assert.deepEqual(Object.keys(pub).sort(), ["createdAt", "elapsedSeconds", "id", "itemsSummary", "orderNumber", "station", "status"]);
  assert.ok(!JSON.stringify(pub).includes("Anna"));
});

test("parseJsonArray survives bad stored JSON", () => {
  assert.deepEqual(parseJsonArray('[{"a":1}]'), [{ a: 1 }]);
  assert.deepEqual(parseJsonArray("not json"), []);
  assert.deepEqual(parseJsonArray('{"a":1}'), []);
  assert.deepEqual(parseJsonArray(null), []);
});

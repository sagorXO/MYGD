import test from "node:test";
import assert from "node:assert/strict";

const { clientIp } = await import("../src/lib/auth/client-ip.ts");
const { createConnectionGate } = await import("../src/lib/connection-gate.ts");

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

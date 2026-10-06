import test from "node:test";
import assert from "node:assert/strict";

const c = await import("../src/features/order/cart.ts");
const doener = { productId: "ord-1", name: "Hamburg Doener", priceCents: 690 };

test("adding the same product twice increments quantity", () => {
  let l = c.addLine([], doener);
  l = c.addLine(l, doener);
  assert.equal(l.length, 1);
  assert.equal(l[0].qty, 2);
});

test("menu upgrade is a separate line priced +€3", () => {
  let l = c.addLine([], doener);
  l = c.addLine(l, { ...doener, asMenu: true });
  assert.equal(l.length, 2);
  assert.equal(l[1].unitCents, 990);
  assert.equal(l[1].name, "Hamburg Doener Menu");
  assert.equal(c.productQty(l, "ord-1"), 2);
});

test("setQty to zero removes the line", () => {
  const l = c.setQty(c.addLine([], doener), "ord-1", 0);
  assert.equal(l.length, 0);
});

test("totals extract 9% VAT from gross prices", () => {
  const l = c.setQty(c.addLine([], doener), "ord-1", 2);
  const t = c.totals(l);
  assert.equal(t.count, 2);
  assert.equal(t.totalCents, 1380);
  assert.equal(t.netCents + t.vatCents, t.totalCents);
  assert.equal(t.vatCents, 114);
});

test("vehicle is required only for drive-through", () => {
  assert.ok(c.vehicleError("DRIVE_THROUGH", " ab "));
  assert.equal(c.vehicleError("DRIVE_THROUGH", "Red Yaris"), null);
  assert.equal(c.vehicleError("COUNTER_PICKUP", ""), null);
});

test("pickup estimate grows with the queue", () => {
  assert.equal(c.estimatedPickupMins(0), 4);
  assert.equal(c.estimatedPickupMins(4), 9);
});

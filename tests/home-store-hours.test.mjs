import test from "node:test";
import assert from "node:assert/strict";

const { storeStatus, minutesInCyprus } = await import("../src/features/home/storeHours.ts");
const store = { opens: "11:00", closes: "22:00" };

// Cyprus is UTC+3 in summer (EEST) and UTC+2 in winter (EET).
test("minutesInCyprus uses Cyprus time, not the visitor's", () => {
  assert.equal(minutesInCyprus(new Date("2026-07-01T09:00:00Z")), 12 * 60);
  assert.equal(minutesInCyprus(new Date("2026-01-15T09:00:00Z")), 11 * 60);
});

test("open during the window", () => {
  assert.deepEqual(storeStatus(store, new Date("2026-07-01T09:00:00Z")), { open: true, label: "Open now · until 22:00" });
});

test("closed before opening and after closing", () => {
  assert.deepEqual(storeStatus(store, new Date("2026-07-01T05:00:00Z")), { open: false, label: "Closed · opens 11:00" });
  assert.deepEqual(storeStatus(store, new Date("2026-07-01T20:00:00Z")), { open: false, label: "Closed · opens tomorrow 11:00" });
});

test("opening minute is open, closing minute is closed", () => {
  assert.equal(storeStatus(store, new Date("2026-07-01T08:00:00Z")).open, true);
  assert.equal(storeStatus(store, new Date("2026-07-01T19:00:00Z")).open, false);
});

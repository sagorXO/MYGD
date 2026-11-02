import test from "node:test";
import assert from "node:assert/strict";

const { zonedDayStart, zonedDateString, nextDateString, lastDayToEndsAt, endsAtToLastDay } = await import("../src/modules/signage/ads/zoned.ts");

const TZ = "Asia/Nicosia";

test("zonedDayStart is local midnight in the playlist zone, whatever the computer's zone", () => {
  assert.equal(zonedDayStart("2026-10-24", TZ).toISOString(), "2026-10-23T21:00:00.000Z"); // summer, UTC+3
  assert.equal(zonedDayStart("2026-10-26", TZ).toISOString(), "2026-10-25T22:00:00.000Z"); // winter, UTC+2
  assert.equal(zonedDayStart("2026-10-25", TZ).toISOString(), "2026-10-24T21:00:00.000Z"); // clocks change at 04:00, midnight is still UTC+3
});

test("zonedDateString reads the day in the playlist zone", () => {
  assert.equal(zonedDateString(new Date("2026-10-30T22:30:00Z"), TZ), "2026-10-31");
  assert.equal(zonedDateString(new Date("2026-10-30T21:30:00Z"), TZ), "2026-10-30");
});

test("nextDateString rolls over months and years", () => {
  assert.equal(nextDateString("2026-10-31"), "2026-11-01");
  assert.equal(nextDateString("2026-12-31"), "2027-01-01");
});

test("the last day shown to the manager round-trips through the exclusive end", () => {
  const end = lastDayToEndsAt("2026-10-31", TZ);
  assert.equal(end.toISOString(), "2026-10-31T22:00:00.000Z"); // 1 Nov 00:00 in Cyprus
  assert.equal(endsAtToLastDay(end, TZ), "2026-10-31");
});

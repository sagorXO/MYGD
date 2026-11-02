import test from "node:test";
import assert from "node:assert/strict";

const { itemStatus, screenOnline, SCREEN_ONLINE_WINDOW_MS } = await import("../src/modules/signage/ads/status.ts");

const TZ = "Asia/Nicosia";
const NOW = new Date("2026-10-30T10:00:00Z"); // Friday 12:00 in Cyprus

function item(o = {}) {
  return { id: "a", position: 1, mediaType: "IMAGE", durationSeconds: 8, mediaDurationMs: null, startsAt: null, endsAt: null,
    daysOfWeek: [], startMinute: null, endMinute: null, isActive: true, ...o };
}

test("itemStatus explains why an item is or is not on screen", () => {
  assert.equal(itemStatus(item(), NOW, TZ), "SHOWING");
  assert.equal(itemStatus(item({ isActive: false }), NOW, TZ), "OFF");
  assert.equal(itemStatus(item({ endsAt: new Date("2026-10-28T00:00:00Z") }), NOW, TZ), "EXPIRED");
  assert.equal(itemStatus(item({ startsAt: new Date("2026-11-01T00:00:00Z") }), NOW, TZ), "SCHEDULED");
  assert.equal(itemStatus(item({ startMinute: 21 * 60, endMinute: 2 * 60 }), NOW, TZ), "NOT_NOW");
  assert.equal(itemStatus(item({ daysOfWeek: [6, 7] }), NOW, TZ), "NOT_NOW");
});

test("switched off wins over every other reason", () => {
  assert.equal(itemStatus(item({ isActive: false, endsAt: new Date("2026-10-28T00:00:00Z") }), NOW, TZ), "OFF");
});

test("screenOnline uses the heartbeat window", () => {
  assert.equal(screenOnline(null, NOW), false);
  assert.equal(screenOnline(new Date(NOW.getTime() - 1000), NOW), true);
  assert.equal(screenOnline(new Date(NOW.getTime() - SCREEN_ONLINE_WINDOW_MS - 1), NOW), false);
});

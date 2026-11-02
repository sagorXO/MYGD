import test from "node:test";
import assert from "node:assert/strict";

const {
  isItemActive,
  activeItems,
  itemDurationMs,
  nextItem,
  validatePlaylist,
  IMAGE_MIN_SECONDS,
  IMAGE_MAX_SECONDS,
} = await import("../src/modules/signage/ads/playlist.ts");

const TZ = "Asia/Nicosia";

function item(overrides = {}) {
  return {
    id: "a",
    position: 1,
    mediaType: "IMAGE",
    durationSeconds: 8,
    mediaDurationMs: null,
    startsAt: null,
    endsAt: null,
    daysOfWeek: [],
    startMinute: null,
    endMinute: null,
    isActive: true,
    ...overrides,
  };
}

// --- ordering -------------------------------------------------------------

test("activeItems returns active items in position order", () => {
  const list = [item({ id: "c", position: 3 }), item({ id: "a", position: 1 }), item({ id: "b", position: 2 })];
  assert.deepEqual(activeItems(list, new Date("2026-10-30T10:00:00Z"), TZ).map((i) => i.id), ["a", "b", "c"]);
});

test("activeItems drops items switched off", () => {
  const list = [item({ id: "a" }), item({ id: "b", position: 2, isActive: false })];
  assert.deepEqual(activeItems(list, new Date("2026-10-30T10:00:00Z"), TZ).map((i) => i.id), ["a"]);
});

test("activeItems does not mutate its input", () => {
  const list = [item({ id: "b", position: 2 }), item({ id: "a", position: 1 })];
  activeItems(list, new Date("2026-10-30T10:00:00Z"), TZ);
  assert.deepEqual(list.map((i) => i.id), ["b", "a"]);
});

test("nextItem wraps around to the first item", () => {
  const list = [item({ id: "a" }), item({ id: "b", position: 2 })];
  assert.equal(nextItem(list, "a").id, "b");
  assert.equal(nextItem(list, "b").id, "a");
});

test("nextItem starts at the first item when the current one is gone", () => {
  const list = [item({ id: "a" }), item({ id: "b", position: 2 })];
  assert.equal(nextItem(list, "removed").id, "a");
  assert.equal(nextItem(list, null).id, "a");
});

test("nextItem returns null for an empty list", () => {
  assert.equal(nextItem([], "a"), null);
});

// --- date range -----------------------------------------------------------

test("startsAt is inclusive and endsAt is exclusive", () => {
  const it = item({ startsAt: new Date("2026-11-01T00:00:00Z"), endsAt: new Date("2026-11-15T00:00:00Z") });
  assert.equal(isItemActive(it, new Date("2026-10-31T23:59:59Z"), TZ), false);
  assert.equal(isItemActive(it, new Date("2026-11-01T00:00:00Z"), TZ), true);
  assert.equal(isItemActive(it, new Date("2026-11-14T23:59:59Z"), TZ), true);
  assert.equal(isItemActive(it, new Date("2026-11-15T00:00:00Z"), TZ), false);
});

// --- weekdays (1 = Monday … 7 = Sunday, Cyprus time) ----------------------

test("empty daysOfWeek means every day", () => {
  assert.equal(isItemActive(item(), new Date("2026-11-01T10:00:00Z"), TZ), true); // Sunday
});

test("weekday is taken in Cyprus time, not UTC", () => {
  const fridayOnly = item({ daysOfWeek: [5] });
  // 2026-10-30 22:30Z is Friday 22:30 UTC but already Saturday 00:30 in Cyprus (UTC+2 after 25 Oct).
  assert.equal(isItemActive(fridayOnly, new Date("2026-10-30T22:30:00Z"), TZ), false);
  assert.equal(isItemActive(fridayOnly, new Date("2026-10-30T20:00:00Z"), TZ), true);
});

// --- time window ----------------------------------------------------------

test("time window 11:00–15:00 follows Cyprus summer and winter time", () => {
  const lunch = item({ startMinute: 11 * 60, endMinute: 15 * 60 });
  // Summer (UTC+3), 24 Oct 2026
  assert.equal(isItemActive(lunch, new Date("2026-10-24T07:30:00Z"), TZ), false); // 10:30
  assert.equal(isItemActive(lunch, new Date("2026-10-24T08:30:00Z"), TZ), true); // 11:30
  // Winter (UTC+2), 26 Oct 2026, the day after the clocks change
  assert.equal(isItemActive(lunch, new Date("2026-10-26T08:30:00Z"), TZ), false); // 10:30
  assert.equal(isItemActive(lunch, new Date("2026-10-26T09:30:00Z"), TZ), true); // 11:30
  assert.equal(isItemActive(lunch, new Date("2026-10-26T13:00:00Z"), TZ), false); // 15:00, end is exclusive
});

test("a window crossing midnight belongs to the day it started", () => {
  // Friday 21:00 to 02:00
  const lateFriday = item({ daysOfWeek: [5], startMinute: 21 * 60, endMinute: 2 * 60 });
  assert.equal(isItemActive(lateFriday, new Date("2026-10-30T19:30:00Z"), TZ), true); // Fri 21:30
  assert.equal(isItemActive(lateFriday, new Date("2026-10-30T23:30:00Z"), TZ), true); // Sat 01:30
  assert.equal(isItemActive(lateFriday, new Date("2026-10-31T00:30:00Z"), TZ), false); // Sat 02:30
  assert.equal(isItemActive(lateFriday, new Date("2026-10-31T19:30:00Z"), TZ), false); // Sat 21:30
  assert.equal(isItemActive(lateFriday, new Date("2026-10-29T23:30:00Z"), TZ), false); // Fri 01:30 (Thursday's night)
});

// --- duration -------------------------------------------------------------

test("an image shows for its durationSeconds", () => {
  assert.equal(itemDurationMs(item({ durationSeconds: 8 })), 8000);
});

test("a video plays for its own length unless a duration is set", () => {
  assert.equal(itemDurationMs(item({ mediaType: "VIDEO", durationSeconds: null, mediaDurationMs: 15250 })), 15250);
  assert.equal(itemDurationMs(item({ mediaType: "VIDEO", durationSeconds: 10, mediaDurationMs: 15250 })), 10000);
});

test("itemDurationMs throws for an image without a duration", () => {
  assert.throws(() => itemDurationMs(item({ durationSeconds: null })), /duration/i);
});

test("itemDurationMs throws for a video with no known length and no duration", () => {
  assert.throws(() => itemDurationMs(item({ mediaType: "VIDEO", durationSeconds: null, mediaDurationMs: null })), /duration/i);
});

// --- validation -----------------------------------------------------------

test("validatePlaylist accepts a correct playlist", () => {
  assert.deepEqual(validatePlaylist([item(), item({ id: "b", position: 2 })]), []);
});

test("validatePlaylist rejects duplicate positions", () => {
  const errors = validatePlaylist([item(), item({ id: "b", position: 1 })]);
  assert.ok(errors.some((e) => e.code === "DUPLICATE_POSITION"));
});

test("validatePlaylist rejects image durations outside the allowed range", () => {
  const tooShort = validatePlaylist([item({ durationSeconds: IMAGE_MIN_SECONDS - 1 })]);
  const tooLong = validatePlaylist([item({ durationSeconds: IMAGE_MAX_SECONDS + 1 })]);
  const missing = validatePlaylist([item({ durationSeconds: null })]);
  assert.ok(tooShort.some((e) => e.code === "DURATION_OUT_OF_RANGE"));
  assert.ok(tooLong.some((e) => e.code === "DURATION_OUT_OF_RANGE"));
  assert.ok(missing.some((e) => e.code === "DURATION_REQUIRED"));
});

test("validatePlaylist rejects half-set or zero-length time windows", () => {
  assert.ok(validatePlaylist([item({ startMinute: 600, endMinute: null })]).some((e) => e.code === "INVALID_TIME_WINDOW"));
  assert.ok(validatePlaylist([item({ startMinute: 600, endMinute: 600 })]).some((e) => e.code === "INVALID_TIME_WINDOW"));
  assert.ok(validatePlaylist([item({ startMinute: -1, endMinute: 600 })]).some((e) => e.code === "INVALID_TIME_WINDOW"));
  assert.ok(validatePlaylist([item({ startMinute: 600, endMinute: 1440 })]).some((e) => e.code === "INVALID_TIME_WINDOW"));
});

test("validatePlaylist rejects an end date not after the start date", () => {
  const d = new Date("2026-11-01T00:00:00Z");
  assert.ok(validatePlaylist([item({ startsAt: d, endsAt: d })]).some((e) => e.code === "INVALID_DATE_RANGE"));
});

test("validatePlaylist rejects weekdays outside 1–7", () => {
  assert.ok(validatePlaylist([item({ daysOfWeek: [0] })]).some((e) => e.code === "INVALID_WEEKDAY"));
  assert.ok(validatePlaylist([item({ daysOfWeek: [8] })]).some((e) => e.code === "INVALID_WEEKDAY"));
});

// --- media that will not load (must never become a hot loop) -----------------

const { afterPlaybackFailure } = await import("../src/modules/signage/ads/playlist.ts");

test("a failed item is skipped until every item in the list has failed in a row", () => {
  assert.equal(afterPlaybackFailure(1, 3), "SKIP");
  assert.equal(afterPlaybackFailure(2, 3), "SKIP");
  assert.equal(afterPlaybackFailure(3, 3), "REST");
});

test("a single failing item, or an empty list, rests at once", () => {
  assert.equal(afterPlaybackFailure(1, 1), "REST");
  assert.equal(afterPlaybackFailure(1, 0), "REST");
});

import test from "node:test";
import assert from "node:assert/strict";

const { toScreenFeed } = await import("../src/modules/signage/ads/feed.ts");
const { parseClock, formatClock, ItemInputSchema, ScreenNumberSchema, ReorderSchema, DisplayAssignSchema } = await import(
  "../src/modules/signage/ads/ads.schema.ts"
);

const NOW = new Date("2026-10-30T10:00:00Z");
const SHA = "b".repeat(64);

function media(o = {}) {
  return { id: "m1", mediaType: "IMAGE", storageKey: `${SHA}.jpg`, durationMs: null, ...o };
}
function row(o = {}) {
  return {
    id: "i1", position: 1, durationSeconds: 8, startsAt: null, endsAt: null, daysOfWeek: [],
    startMinute: null, endMinute: null, isActive: true, media: media(), ...o,
  };
}
function display(o = {}) {
  return {
    screenNumber: 1,
    orientation: "PORTRAIT",
    playlist: { id: "p1", name: "Main playlist", timeZone: "Asia/Nicosia", isActive: true, updatedAt: NOW, items: [row()] },
    ...o,
  };
}

// --- feed ----------------------------------------------------------------

test("a screen with no record or no playlist is UNASSIGNED with no items", () => {
  assert.deepEqual(toScreenFeed(3, null, NOW), { screenNumber: 3, orientation: "PORTRAIT", status: "UNASSIGNED", playlist: null, items: [], generatedAt: NOW.toISOString() });
  assert.equal(toScreenFeed(1, display({ playlist: null }), NOW).status, "UNASSIGNED");
});

test("a paused playlist sends no items", () => {
  const feed = toScreenFeed(1, display({ playlist: { ...display().playlist, isActive: false } }), NOW);
  assert.equal(feed.status, "PAUSED");
  assert.deepEqual(feed.items, []);
});

test("items carry the media URL and the schedule so the screen can decide offline", () => {
  const feed = toScreenFeed(1, display(), NOW);
  assert.equal(feed.status, "READY");
  assert.deepEqual(feed.playlist, { id: "p1", name: "Main playlist", timeZone: "Asia/Nicosia", updatedAt: NOW.toISOString() });
  assert.deepEqual(feed.items[0], {
    id: "i1", position: 1, mediaType: "IMAGE", mediaUrl: `/api/signage/media/${SHA}.jpg`,
    durationSeconds: 8, mediaDurationMs: null, startsAt: null, endsAt: null, daysOfWeek: [],
    startMinute: null, endMinute: null, isActive: true,
  });
});

test("switched-off and already-expired items are left out; future ones stay", () => {
  const items = [
    row({ id: "off", position: 1, isActive: false }),
    row({ id: "old", position: 2, endsAt: new Date("2026-10-28T00:00:00Z") }),
    row({ id: "soon", position: 3, startsAt: new Date("2026-11-01T00:00:00Z") }),
  ];
  const feed = toScreenFeed(1, display({ playlist: { ...display().playlist, items } }), NOW);
  assert.deepEqual(feed.items.map((i) => i.id), ["soon"]);
});

test("feed items are sorted by position", () => {
  const items = [row({ id: "b", position: 2 }), row({ id: "a", position: 1 })];
  const feed = toScreenFeed(1, display({ playlist: { ...display().playlist, items } }), NOW);
  assert.deepEqual(feed.items.map((i) => i.id), ["a", "b"]);
});

// --- schemas -------------------------------------------------------------

test("parseClock and formatClock convert HH:MM and minutes", () => {
  assert.equal(parseClock("00:00"), 0);
  assert.equal(parseClock("11:00"), 660);
  assert.equal(parseClock("23:59"), 1439);
  assert.equal(parseClock("24:00"), null);
  assert.equal(parseClock("7:5"), null);
  assert.equal(formatClock(660), "11:00");
  assert.equal(formatClock(75), "01:15");
});

test("ScreenNumberSchema accepts the 4 portrait and 2 landscape screens only", () => {
  assert.equal(ScreenNumberSchema.parse("2"), 2);
  assert.equal(ScreenNumberSchema.parse("6"), 6);
  assert.throws(() => ScreenNumberSchema.parse("0"));
  assert.throws(() => ScreenNumberSchema.parse("7"));
  assert.throws(() => ScreenNumberSchema.parse("1.5"));
});

test("ItemInputSchema maps a time window to minutes and defaults the rest", () => {
  const parsed = ItemInputSchema.parse({ mediaId: "m1", durationSeconds: 8, window: { from: "11:00", to: "15:00" } });
  assert.equal(parsed.startMinute, 660);
  assert.equal(parsed.endMinute, 900);
  assert.deepEqual(parsed.daysOfWeek, []);
  assert.equal(parsed.isActive, true);
  assert.equal(parsed.startsAt, null);
});

test("ItemInputSchema rejects bad clocks, weekdays and dates", () => {
  assert.throws(() => ItemInputSchema.parse({ mediaId: "m1", durationSeconds: 8, window: { from: "25:00", to: "15:00" } }));
  assert.throws(() => ItemInputSchema.parse({ mediaId: "m1", durationSeconds: 8, daysOfWeek: [0] }));
  assert.throws(() => ItemInputSchema.parse({ mediaId: "m1", durationSeconds: 8, startsAt: "yesterday" }));
  assert.throws(() => ItemInputSchema.parse({ mediaId: "m1", durationSeconds: 8, daysOfWeek: [1, 1] }));
});

test("ReorderSchema needs distinct item ids", () => {
  assert.ok(ReorderSchema.parse({ playlistId: "p1", itemIds: ["a", "b"] }));
  assert.throws(() => ReorderSchema.parse({ playlistId: "p1", itemIds: ["a", "a"] }));
  assert.throws(() => ReorderSchema.parse({ playlistId: "p1", itemIds: [] }));
});

// --- what the screen plays now (runs in the browser from the cached feed) ----

const { playableItems } = await import("../src/modules/signage/ads/feed.ts");
const { ScreenFeedSchema } = await import("../src/modules/signage/ads/ads.schema.ts");

test("playableItems is empty for an unassigned or paused screen", () => {
  assert.deepEqual(playableItems(toScreenFeed(2, null, NOW), NOW), []);
});

test("playableItems applies the schedule in the playlist's time zone", () => {
  const lunch = row({ id: "lunch", position: 1, startMinute: 11 * 60, endMinute: 15 * 60 });
  const always = row({ id: "always", position: 2 });
  const feed = toScreenFeed(1, display({ playlist: { ...display().playlist, items: [lunch, always] } }), NOW);
  // 10:00Z on 30 Oct = 12:00 in Cyprus (UTC+2)
  assert.deepEqual(playableItems(feed, NOW).map((i) => i.id), ["lunch", "always"]);
  // 07:00Z = 09:00 in Cyprus
  assert.deepEqual(playableItems(feed, new Date("2026-10-30T07:00:00Z")).map((i) => i.id), ["always"]);
});

test("playableItems keeps the media URL the player needs", () => {
  const feed = toScreenFeed(1, display(), NOW);
  assert.equal(playableItems(feed, NOW)[0].mediaUrl, `/api/signage/media/${SHA}.jpg`);
});

test("ScreenFeedSchema accepts a real feed and rejects a foreign media URL", () => {
  const feed = toScreenFeed(1, display(), NOW);
  assert.ok(ScreenFeedSchema.safeParse(feed).success);
  const bad = { ...feed, items: [{ ...feed.items[0], mediaUrl: "https://evil.example/x.jpg" }] };
  assert.equal(ScreenFeedSchema.safeParse(bad).success, false);
});

// --- orientation: portrait menu boards and landscape drinks TVs -----------------

const { defaultOrientation, defaultScreenName } = await import("../src/modules/signage/ads/ads.schema.ts");

test("screens 1-4 default to portrait and 5-6 to landscape", () => {
  assert.equal(defaultOrientation(1), "PORTRAIT");
  assert.equal(defaultOrientation(4), "PORTRAIT");
  assert.equal(defaultOrientation(5), "LANDSCAPE");
  assert.equal(defaultOrientation(6), "LANDSCAPE");
  assert.equal(defaultScreenName(4), "Portrait 4");
  assert.equal(defaultScreenName(5), "Landscape 1");
  assert.equal(defaultScreenName(6), "Landscape 2");
});

test("the feed uses the screen's saved orientation, or the default when it has no record", () => {
  assert.equal(toScreenFeed(5, null, NOW).orientation, "LANDSCAPE");
  assert.equal(toScreenFeed(1, display({ orientation: "LANDSCAPE" }), NOW).orientation, "LANDSCAPE");
  assert.equal(toScreenFeed(1, display({ orientation: "LANDSCAPE", playlist: null }), NOW).orientation, "LANDSCAPE");
  assert.ok(ScreenFeedSchema.safeParse(toScreenFeed(6, null, NOW)).success);
});

test("DisplayAssignSchema accepts an orientation and rejects anything else", () => {
  assert.equal(DisplayAssignSchema.parse({ playlistId: null, orientation: "LANDSCAPE" }).orientation, "LANDSCAPE");
  assert.equal(DisplayAssignSchema.parse({ playlistId: null }).orientation, undefined);
  assert.throws(() => DisplayAssignSchema.parse({ playlistId: null, orientation: "SIDEWAYS" }));
});

import test from "node:test";
import assert from "node:assert/strict";

const S = await import("../src/modules/checklists/checklists.schema.ts");

test("entry actions are validated", () => {
  assert.equal(S.EntryInputSchema.parse({ action: "DONE", temperature: 4.2 }).temperature, 4.2);
  assert.equal(S.EntryInputSchema.parse({ action: "ISSUE", note: "  broken " }).note, "broken");
  for (const bad of [{ action: "NOPE" }, { action: "DONE", temperature: "hot" }, { action: "DONE", temperature: 999 }, { action: "NOTE" }, { action: "NOTE", note: "x".repeat(501) }]) {
    assert.equal(S.EntryInputSchema.safeParse(bad).success, false, JSON.stringify(bad));
  }
});

test("opening time must be a real clock time", () => {
  assert.equal(S.OpeningTimeSchema.safeParse({ openingTime: "11:30" }).success, true);
  for (const t of ["24:00", "9:30", "11:60", "noon", ""]) assert.equal(S.OpeningTimeSchema.safeParse({ openingTime: t }).success, false, t);
});

test("finish needs a real station and phase", () => {
  assert.equal(S.FinishSchema.safeParse({ station: "MEAT_HOT", phase: "OPENING" }).success, true);
  assert.equal(S.FinishSchema.safeParse({ station: "BAR", phase: "OPENING" }).success, true); // stations are data: a new one needs no code change
  assert.equal(S.FinishSchema.safeParse({ station: "not a station!", phase: "OPENING" }).success, false);
  assert.equal(S.FinishSchema.safeParse({ station: "MEAT_HOT", phase: "LUNCH" }).success, false);
});

test("stock counts are not negative and need something to save", () => {
  assert.equal(S.StockCountSchema.safeParse({ stockItemId: "x", count: 4.5 }).success, true);
  assert.equal(S.StockCountSchema.safeParse({ stockItemId: "x", status: "LOW" }).success, true);
  assert.equal(S.StockCountSchema.safeParse({ stockItemId: "x", count: -1 }).success, false);
  assert.equal(S.StockCountSchema.safeParse({ stockItemId: "x" }).success, false);
  assert.equal(S.StockCountSchema.safeParse({ stockItemId: "x", status: "MAYBE" }).success, false);
});

test("a HACCP reading needs equipment, a target and a number", () => {
  assert.equal(S.HaccpReadingSchema.safeParse({ equipmentName: "Fridge 1", targetType: "CHILLED", temperature: 3 }).success, true);
  assert.equal(S.HaccpReadingSchema.safeParse({ equipmentName: "", targetType: "CHILLED", temperature: 3 }).success, false);
  assert.equal(S.HaccpReadingSchema.safeParse({ equipmentName: "F", targetType: "WARM", temperature: 3 }).success, false);
});

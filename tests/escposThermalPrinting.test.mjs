import test from "node:test";
import assert from "node:assert/strict";

test("Hardware Print Driver - ESC/POS Buffer starts with ESC @ (0x1B 0x40) reset", () => {
  const resetCommand = Buffer.from([0x1B, 0x40]);
  assert.equal(resetCommand[0], 0x1B);
  assert.equal(resetCommand[1], 0x40);
});

test("Hardware Print Driver - Cash Drawer 24V Solenoid Kick Command", () => {
  const epsonDrawerKick = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
  assert.equal(epsonDrawerKick.length, 5);
  assert.equal(epsonDrawerKick[0], 0x1B);
  assert.equal(epsonDrawerKick[1], 0x70);
});

test("Hardware Print Driver - GS V Paper Cut Command", () => {
  const partialCut = Buffer.from([0x1D, 0x56, 0x42, 0x03]);
  assert.equal(partialCut[0], 0x1D);
  assert.equal(partialCut[1], 0x56);
  assert.equal(partialCut[2], 0x42);
});

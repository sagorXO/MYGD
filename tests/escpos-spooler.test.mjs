import test from "node:test";
import assert from "node:assert";
import { buildIndoorChit, buildGrillChit } from "../src/modules/printer/escpos-encoder.js";
import { TcpPrintSpooler } from "../src/modules/printer/tcp-spooler.js";

test("ESC/POS Binary Buffer & Station Routing", () => {
  const spooler = new TcpPrintSpooler();

  // Test Station Classification
  const donerItem = {
    name: "The Classic Berlin Döner",
    quantity: 1,
    meatWeightGrams: 150,
    spiceLevel: 3,
    stationTarget: "BOTH",
  };
  assert.strictEqual(spooler.classifyItemStation(donerItem), "BOTH");

  const friesItem = {
    name: "Crispy Berlin Fries",
    quantity: 2,
    stationTarget: "INDOOR",
  };
  assert.strictEqual(spooler.classifyItemStation(friesItem), "INDOOR");

  // Test Buffer Generation
  const payload = {
    orderNumber: "EMBA-20260924-001",
    dailySequence: 1,
    orderType: "DINE_IN",
    locationSlug: "EMBA",
    createdAt: new Date().toISOString(),
    customerNote: "Extra napkins please",
    items: [donerItem, friesItem],
  };

  const indoorBuf = buildIndoorChit(payload, [donerItem, friesItem]);
  assert.ok(Buffer.isBuffer(indoorBuf));
  assert.ok(indoorBuf.length > 50);

  // Check ESC/POS Init opcode (0x1B, 0x40)
  assert.strictEqual(indoorBuf[0], 0x1b);
  assert.strictEqual(indoorBuf[1], 0x40);

  // Check Feed and Cut opcode at the end (0x1D, 0x56, 0x42, 0x00)
  const len = indoorBuf.length;
  assert.strictEqual(indoorBuf[len - 4], 0x1d);
  assert.strictEqual(indoorBuf[len - 3], 0x56);
  assert.strictEqual(indoorBuf[len - 2], 0x42);
  assert.strictEqual(indoorBuf[len - 1], 0x00);

  const grillBuf = buildGrillChit(payload, [donerItem]);
  assert.ok(Buffer.isBuffer(grillBuf));
  assert.ok(grillBuf.includes(Buffer.from("STATION 2: CHARCOAL ROTISSERIE GRILL")));
  assert.ok(grillBuf.includes(Buffer.from("150g (Standard)")));
});

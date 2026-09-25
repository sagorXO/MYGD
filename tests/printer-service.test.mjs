// Test suite for Thermal Printer Service (printer.service.ts)
// Validates dual-station line item splitting, ESC/POS buffer generation, and timeout handling

import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyItemStation,
  splitOrderForStations,
  generateIndoorChitBuffer,
  generateGrillChitBuffer,
  sendRawTcpPrint,
} from "../src/lib/printer.service.ts";

test("Station Routing - Correctly classifies sides and drinks to INDOOR", () => {
  assert.equal(classifyItemStation({ name: "Crispy Berlin Fries" }), "INDOOR");
  assert.equal(classifyItemStation({ name: "German Pilsner Beer" }), "INDOOR");
  assert.equal(classifyItemStation({ name: "Ayran" }), "INDOOR");
  assert.equal(classifyItemStation({ name: "Currywurst" }), "INDOOR");
});

test("Station Routing - Correctly classifies Döner sandwiches, wraps, and boxes to BOTH", () => {
  assert.equal(classifyItemStation({ name: "Original German Döner (150g)" }), "BOTH");
  assert.equal(classifyItemStation({ name: "Standard Dürüm Wrap" }), "BOTH");
  assert.equal(classifyItemStation({ name: "Döner Box with Fries" }), "BOTH");
  assert.equal(classifyItemStation({ name: "Custom Sandwich", meatWeightGrams: 150 }), "BOTH");
  assert.equal(classifyItemStation({ name: "Falafel Pocket", spiceLevel: 3 }), "BOTH");
});

test("Order Splitting - Splits composite order across Indoor and Grill stations", () => {
  const sampleOrder = {
    orderNumber: "EMBA-20260919-1200-001",
    dailySequence: 1,
    orderType: "DINE_IN",
    createdAt: new Date().toISOString(),
    items: [
      {
        name: "Original German Döner (150g)",
        quantity: 2,
        meatWeightGrams: 150,
        spiceLevel: 4,
        breadType: "Fladenbrot",
        sauces: ["Garlic Herb", "Scharf"],
        stationTarget: "BOTH",
      },
      {
        name: "Crispy Berlin Fries",
        quantity: 1,
        stationTarget: "INDOOR",
      },
      {
        name: "German Pilsner Beer",
        quantity: 2,
        stationTarget: "INDOOR",
      },
    ],
  };

  const { indoorItems, grillItems } = splitOrderForStations(sampleOrder);

  // Grill gets the döner item for meat carving & spice
  assert.equal(grillItems.length, 1);
  assert.equal(grillItems[0].name, "Original German Döner (150g)");
  assert.equal(grillItems[0].stationTarget, "GRILL");

  // Indoor gets all 3 items (döner for bread/sauce assembly + fries + beer)
  assert.equal(indoorItems.length, 3);
  assert.equal(indoorItems[0].stationTarget, "INDOOR");
  assert.equal(indoorItems[1].name, "Crispy Berlin Fries");
  assert.equal(indoorItems[2].name, "German Pilsner Beer");
});

test("ESC/POS Chit Generation - Produces valid binary buffers with ESC @ init and cut commands", () => {
  const sampleOrder = {
    orderNumber: "EMBA-20260919-1200-002",
    dailySequence: 2,
    orderType: "TAKE_AWAY",
    createdAt: new Date().toISOString(),
    customerNote: "Extra napkins please",
    items: [
      {
        name: "Standard Dürüm Wrap",
        quantity: 1,
        meatWeightGrams: 150,
        spiceLevel: 5,
        breadType: "Lavash",
        sauces: ["Kräuter"],
        stationTarget: "BOTH",
      },
    ],
  };

  const indoorBuf = generateIndoorChitBuffer(sampleOrder, sampleOrder.items);
  const grillBuf = generateGrillChitBuffer(sampleOrder, sampleOrder.items);

  assert.ok(indoorBuf.length > 50, "Indoor buffer should contain formatted receipt bytes");
  assert.ok(grillBuf.length > 50, "Grill buffer should contain formatted receipt bytes");

  // Verify ESC @ (0x1B 0x40) init header
  assert.equal(indoorBuf[0], 0x1b);
  assert.equal(indoorBuf[1], 0x40);
  assert.equal(grillBuf[0], 0x1b);
  assert.equal(grillBuf[1], 0x40);

  // Verify GS V (0x1D 0x56) cut command at tail
  assert.ok(indoorBuf.includes(Buffer.from([0x1d, 0x56])));
  assert.ok(grillBuf.includes(Buffer.from([0x1d, 0x56])));
});

test("TCP Client Resiliency - Safe timeout when printer IP is offline without crashing Node", async () => {
  const dummyBuffer = Buffer.from("TEST PRINT");
  
  // Connect to non-routable test IP with 150ms timeout
  const result = await sendRawTcpPrint(
    dummyBuffer,
    { host: "192.0.2.1", port: 9100, timeoutMs: 150 },
    "INDOOR"
  );

  assert.equal(result.success, false);
  assert.equal(result.station, "INDOOR");
  assert.ok(result.error);
  assert.ok(
    result.error.includes("timeout") || result.error.includes("connection"),
    "Should report timeout or connection failure cleanly"
  );
});

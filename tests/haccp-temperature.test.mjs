import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { evaluateTemperature, HACCP_LIMITS, limitText } = await import("../src/modules/haccp/temperature.ts");
const { HACCPService } = await import("../src/modules/haccp/haccp.service.ts");

const cases = [
  ["CHILLED", 0, true], ["CHILLED", 5, true], ["CHILLED", 5.01, false], ["CHILLED", -0.1, false],
  ["HOT_HOLDING", 63, true], ["HOT_HOLDING", 62.99, false],
  ["FROZEN", -18, true], ["FROZEN", -17.9, false],
];
for (const [target, value, ok] of cases) {
  test(`${target} ${value} °C is ${ok ? "in range" : "out of range"}`, () => {
    assert.equal(evaluateTemperature(target, value).isCompliant, ok);
    assert.equal(HACCPService.validateTemperature(target, value).isCompliant, ok);
  });
}

test("the danger zone is above 5 and below 63 °C", () => {
  assert.equal(evaluateTemperature("CHILLED", 20).inDangerZone, true);
  assert.equal(evaluateTemperature("HOT_HOLDING", 62).inDangerZone, true);
  assert.equal(evaluateTemperature("CHILLED", 4).inDangerZone, false);
  assert.equal(evaluateTemperature("HOT_HOLDING", 70).inDangerZone, false);
});

test("limits read plainly", () => {
  assert.equal(limitText("CHILLED"), "0 to 5 °C");
  assert.equal(limitText("HOT_HOLDING"), "63 °C or above");
  assert.equal(limitText("FROZEN"), "-18 °C or below");
});

test("the task data's unconfirmed limits are the ones the app enforces", () => {
  const d = JSON.parse(readFileSync("data/checklists/mygd-station-checklists.v1.json", "utf8"));
  assert.deepEqual(d.temperatureLimits.CHILLED, HACCP_LIMITS.CHILLED);
  assert.deepEqual(d.temperatureLimits.HOT_HOLDING, HACCP_LIMITS.HOT_HOLDING);
  assert.deepEqual(d.temperatureLimits.FROZEN, HACCP_LIMITS.FROZEN);
});

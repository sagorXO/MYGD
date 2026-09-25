import test from "node:test";
import assert from "node:assert";
import { calculateKitchenWaitTime } from "../src/modules/cx-wait/wait-estimator.engine.js";

test("Algorithmic Dynamic Kitchen Prep-Time Estimator", () => {
  // Scenario 1: Low load (1 ticket, 1 grill item, 2 cooks)
  const lowLoad = calculateKitchenWaitTime({
    activeTicketsCount: 1,
    charcoalGrillCount: 1,
    activeLineCooks: 2,
  });
  // Base 3.0 + 1.2 + 2.0 - 3.0 = 3.2m -> clamped to 3 mins
  assert.strictEqual(lowLoad.speedCategory, "FAST");
  assert.strictEqual(lowLoad.estimatedWaitMinutesMin, 2);
  assert.strictEqual(lowLoad.estimatedWaitMinutesMax, 5);

  // Scenario 2: Moderate rush (6 tickets, 4 grill items, 2 cooks)
  const moderateLoad = calculateKitchenWaitTime({
    activeTicketsCount: 6,
    charcoalGrillCount: 4,
    activeLineCooks: 2,
  });
  // Base 3.0 + 7.2 + 8.0 - 3.0 = 15.2m -> clamped to 15m
  assert.strictEqual(moderateLoad.speedCategory, "EXTREME");
  assert.ok(moderateLoad.estimatedWaitMinutesMax > 12);

  // Scenario 3: High rush with 4 cooks relief (8 tickets, 6 grill items, 4 cooks)
  const rushWithRelief = calculateKitchenWaitTime({
    activeTicketsCount: 8,
    charcoalGrillCount: 6,
    activeLineCooks: 4,
  });
  // Base 3.0 + 9.6 + 12.0 - 6.0 = 18.6m -> clamped to 19m
  assert.ok(rushWithRelief.estimatedWaitMinutesMax <= 25);
  assert.ok(rushWithRelief.estimatedWaitMinutesMin >= 3);
});

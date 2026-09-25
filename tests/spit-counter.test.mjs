import test from "node:test";
import assert from "node:assert";
import { spitTrackerService } from "../src/modules/inventory/spit-tracker.service.js";

test("Rotisserie Spit Mount & Carve Balance Countdown", () => {
  // Mount 25kg spit
  const spit = spitTrackerService.mountNewSpit("EMBA", 25.0, "BEEF_VEAL", "1234");
  assert.strictEqual(spit.initialWeightKg, 25.0);
  assert.strictEqual(spit.remainingWeightKg, 25.0);
  assert.strictEqual(spit.carvedGrams, 0);

  // Carve 10x Standard Döner (10 * 150g = 1500g)
  const after10 = spitTrackerService.recordMeatCarve("EMBA", 1500);
  assert.strictEqual(after10.carvedGrams, 1500);
  assert.strictEqual(after10.remainingWeightKg, 23.5);

  // Carve another 21kg (21000g) -> remaining 2.5kg (Triggers low spit warning <= 3.0kg)
  const afterRush = spitTrackerService.recordMeatCarve("EMBA", 21000);
  assert.strictEqual(afterRush.remainingWeightKg, 2.5);
  assert.strictEqual(afterRush.status, "ACTIVE");
});

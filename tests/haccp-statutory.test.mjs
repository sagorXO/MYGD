import test from "node:test";
import assert from "node:assert";
import { HACCPService } from "../src/modules/haccp/haccp.service.js";

test("EU Regulation (EC) 852/2004 HACCP Temperature Compliance", () => {
  // 1. Chilled Storage (0°C – 5°C)
  const chilledOk = HACCPService.validateTemperature("CHILLED", 3.2);
  assert.strictEqual(chilledOk.isCompliant, true);
  assert.strictEqual(chilledOk.inDangerZone, false);
  assert.strictEqual(chilledOk.correctiveActionRequired, false);

  const chilledDanger = HACCPService.validateTemperature("CHILLED", 7.8);
  assert.strictEqual(chilledDanger.isCompliant, false);
  assert.strictEqual(chilledDanger.inDangerZone, true);
  assert.strictEqual(chilledDanger.correctiveActionRequired, true);

  // 2. Frozen Storage (≤ -18°C)
  const frozenOk = HACCPService.validateTemperature("FROZEN", -20.5);
  assert.strictEqual(frozenOk.isCompliant, true);
  assert.strictEqual(frozenOk.correctiveActionRequired, false);

  const frozenBreach = HACCPService.validateTemperature("FROZEN", -12.0);
  assert.strictEqual(frozenBreach.isCompliant, false);
  assert.strictEqual(frozenBreach.correctiveActionRequired, true);

  // 3. Hot-Holding Rotisserie Spit (≥ 63°C)
  const spitOk = HACCPService.validateTemperature("HOT_HOLDING", 68.5);
  assert.strictEqual(spitOk.isCompliant, true);
  assert.strictEqual(spitOk.correctiveActionRequired, false);

  const spitDanger = HACCPService.validateTemperature("HOT_HOLDING", 54.0); // In Danger Zone!
  assert.strictEqual(spitDanger.isCompliant, false);
  assert.strictEqual(spitDanger.inDangerZone, true);
  assert.strictEqual(spitDanger.correctiveActionRequired, true);
});

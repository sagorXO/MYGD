import test from "node:test";
import assert from "node:assert/strict";

test("WU-4: HACCP Validator - Chilled Storage 0°C to 5°C (EU Regulation EC 852/2004)", async () => {
  const { validateHACCPTemperature } = await import("../src/lib/haccp-validator.js").catch(async () => {
    return await import("../src/lib/haccp-validator.ts");
  });

  // Compliant chilled temp (Walk-in fridge / cold wells)
  const compliant = validateHACCPTemperature("CHILLED", 3.2);
  assert.equal(compliant.isCompliant, true);
  assert.equal(compliant.isDangerZone, false);

  // Danger zone violation (> 5.0°C)
  const violation = validateHACCPTemperature("CHILLED", 7.8);
  assert.equal(violation.isCompliant, false);
  assert.equal(violation.isDangerZone, true);
  assert.ok(violation.actionRequired.includes("Immediate corrective action required"));
});

test("WU-4: HACCP Validator - Frozen Storage -18°C to -22°C", async () => {
  const { validateHACCPTemperature } = await import("../src/lib/haccp-validator.js").catch(async () => {
    return await import("../src/lib/haccp-validator.ts");
  });

  const compliant = validateHACCPTemperature("FROZEN", -20.5);
  assert.equal(compliant.isCompliant, true);
  assert.equal(compliant.isDangerZone, false);

  const warmFreezer = validateHACCPTemperature("FROZEN", -12.0);
  assert.equal(warmFreezer.isCompliant, false);
  assert.ok(warmFreezer.actionRequired.includes("Freezer temperature too high"));
});

test("WU-4: HACCP Validator - Hot-Holding Rotisserie Spit Meat ≥ 63°C", async () => {
  const { validateHACCPTemperature } = await import("../src/lib/haccp-validator.js").catch(async () => {
    return await import("../src/lib/haccp-validator.ts");
  });

  const compliant = validateHACCPTemperature("HOT_HOLDING", 68.5);
  assert.equal(compliant.isCompliant, true);
  assert.equal(compliant.isDangerZone, false);

  // Danger zone violation (< 63.0°C)
  const coldSpit = validateHACCPTemperature("HOT_HOLDING", 54.0);
  assert.equal(coldSpit.isCompliant, false);
  assert.equal(coldSpit.isDangerZone, true);
  assert.ok(coldSpit.actionRequired.includes("Spit meat below 63°C"));
});

test("WU-4: HACCP Validator - Exact Boundary Condition Tests (0.0°C, 5.0°C, 63.0°C, -18.0°C)", async () => {
  const { validateHACCPTemperature } = await import("../src/lib/haccp-validator.js").catch(async () => {
    return await import("../src/lib/haccp-validator.ts");
  });

  // Exactly 0.0°C (compliant chilled lower bound)
  const chilledLower = validateHACCPTemperature("CHILLED", 0.0);
  assert.equal(chilledLower.isCompliant, true, "0.0°C must be compliant");

  // Exactly 5.0°C (compliant chilled upper bound)
  const chilledUpper = validateHACCPTemperature("CHILLED", 5.0);
  assert.equal(chilledUpper.isCompliant, true, "5.0°C must be compliant");

  // Exactly 5.01°C (violation chilled upper bound)
  const chilledUpperViolation = validateHACCPTemperature("CHILLED", 5.01);
  assert.equal(chilledUpperViolation.isCompliant, false);
  assert.equal(chilledUpperViolation.isDangerZone, true);

  // Exactly 63.0°C (compliant hot-holding lower bound)
  const hotHoldingLower = validateHACCPTemperature("HOT_HOLDING", 63.0);
  assert.equal(hotHoldingLower.isCompliant, true, "63.0°C must be compliant");

  // Exactly 62.99°C (violation hot-holding lower bound)
  const hotHoldingViolation = validateHACCPTemperature("HOT_HOLDING", 62.99);
  assert.equal(hotHoldingViolation.isCompliant, false);
  assert.equal(hotHoldingViolation.isDangerZone, true);

  // Exactly -18.0°C (compliant deep freeze upper bound)
  const freezerUpper = validateHACCPTemperature("FROZEN", -18.0);
  assert.equal(freezerUpper.isCompliant, true, "-18.0°C must be compliant");

  // Exactly -17.9°C (violation deep freeze upper bound)
  const freezerViolation = validateHACCPTemperature("FROZEN", -17.9);
  assert.equal(freezerViolation.isCompliant, false);
});

test("WU-4: HACCP Validator - Non-Numeric, NaN, Null and Malformed Input Protection", async () => {
  const { validateHACCPTemperature } = await import("../src/lib/haccp-validator.js").catch(async () => {
    return await import("../src/lib/haccp-validator.ts");
  });

  // NaN input
  const nanResult = validateHACCPTemperature("CHILLED", Number.NaN);
  assert.equal(nanResult.isCompliant, false);
  assert.equal(nanResult.isDangerZone, true);
  assert.ok(nanResult.actionRequired.includes("Invalid temperature reading"));

  // Non-numeric types
  const nullResult = validateHACCPTemperature("CHILLED", null);
  assert.equal(nullResult.isCompliant, false);

  const undefinedResult = validateHACCPTemperature("HOT_HOLDING", undefined);
  assert.equal(undefinedResult.isCompliant, false);

  const stringResult = validateHACCPTemperature("FROZEN", "cold");
  assert.equal(stringResult.isCompliant, false);
});

test("WU-4: Checklist Template - Parse JSON Tasks and Format Log Payload", async () => {
  const { parseChecklistTasks, createChecklistLogPayload } = await import("../src/lib/haccp-validator.js").catch(async () => {
    return await import("../src/lib/haccp-validator.ts");
  });

  const tasksJson = JSON.stringify([
    { id: "t1", title: "Unlock store", isTempCheck: false },
    { id: "t2", title: "Walk-in Raw Meat Fridge Temp", isTempCheck: true, tempType: "CHILLED", target: "0-5°C" },
  ]);

  const tasks = parseChecklistTasks(tasksJson);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[1].tempType, "CHILLED");

  const completedTasks = [
    { id: "t1", completed: true },
    { id: "t2", completed: true, loggedTemp: 3.5 },
  ];

  const logPayload = createChecklistLogPayload("EMBA", "OPENING", "Alex Mueller", completedTasks);
  assert.equal(logPayload.locationSlug, "EMBA");
  assert.equal(logPayload.shiftType, "OPENING");
  assert.equal(logPayload.completedBy, "Alex Mueller");
  assert.equal(logPayload.isCompliant, true);
});

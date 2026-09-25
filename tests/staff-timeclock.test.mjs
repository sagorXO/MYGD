import test from "node:test";
import assert from "node:assert/strict";

// Helper to load timeclock engine module (supports both .js and .ts via tsx loader)
async function getTimeclockEngine() {
  return await import("../src/lib/timeclock-engine.js").catch(async () => {
    return await import("../src/lib/timeclock-engine.ts");
  });
}

// Reusable Mock Staff Roster for In-Store Wall Station Tablet
const mockStaffRoster = [
  {
    id: "stf-001",
    name: "Christos K.",
    pin: "1111",
    role: "CASHIER",
    locationSlug: "EMBA",
    isActive: true,
    hourlyRateEUR: 9.5,
  },
  {
    id: "stf-002",
    name: "Marco S.",
    pin: "1234",
    role: "MANAGER",
    locationSlug: "EMBA",
    isActive: true,
    hourlyRateEUR: 14.0,
  },
  {
    id: "stf-003",
    name: "Alex Mueller",
    pin: "0000",
    role: "SLICER",
    locationSlug: "EMBA",
    isActive: true,
    hourlyRateEUR: 11.0,
  },
  {
    id: "stf-004",
    name: "Rico & Oli",
    pin: "9999",
    role: "HQ OWNER",
    locationSlug: "HQ",
    isActive: true,
    hourlyRateEUR: 0.0,
  },
  {
    id: "stf-005",
    name: "Elena Vassiliou",
    pin: "2222",
    role: "ASSEMBLER",
    locationSlug: "EMBA",
    isActive: true,
    hourlyRateEUR: 9.5,
  },
  {
    id: "stf-006",
    name: "Dimitris P.",
    pin: "3333",
    role: "GRILL_MASTER",
    locationSlug: "EMBA",
    isActive: false, // Deactivated account
    hourlyRateEUR: 10.5,
  },
];

// Reusable Mock Product & Recipe Steps for M8 SOP Build Sheets
const mockClassicDonerProduct = {
  id: "prod-doner-01",
  name: "Original German Döner (150g)",
  sku: "MYGD-DON-01",
  meatWeight: "150g Sliced Rotisserie Meat",
  breadType: "Crispy Turkish Fladenbrot",
  sauceSequence: "Bottom: Knoblauch (Garlic) ➔ Top: Kräuter (Herb) + Optional Scharf (Chili)",
  imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
};

const mockRecipeStepsUnordered = [
  {
    stepNumber: 4,
    instruction: "Weigh exactly 150g hot rotisserie shaved meat on scale (internal meat temp > 75°C).",
    instructionDE: "Genau 150g heißes Fleisch auf Waage abwiegen (> 75°C).",
    targetSec: 30,
    qualityCheck: "Zero meat clumps, steam rising, strictly 150g ± 5g.",
    imageUrl: "https://images.unsplash.com/photo-meat-slice.jpg",
  },
  {
    stepNumber: 1,
    instruction: "Toast quarter Fladenbrot in contact grill for 45s until crispy exterior with soft core.",
    instructionDE: "Fladenbrot 45s im Kontaktgrill toasten.",
    targetSec: 45,
    qualityCheck: "Golden grill marks, bread warmth > 60°C.",
    imageUrl: "https://images.unsplash.com/photo-bread-toast.jpg",
  },
  {
    stepNumber: 5,
    instruction: "Add 3 fresh tomato half-slices, cucumber ribbons, and chopped parsley.",
    instructionDE: "3 Tomatenscheiben, Gurken und frische Petersilie einlegen.",
    targetSec: 15,
    qualityCheck: "Vibrant color distribution edge-to-edge.",
    imageUrl: "https://images.unsplash.com/photo-salad-layer.jpg",
  },
  {
    stepNumber: 2,
    instruction: "Spread 20g homemade Knoblauch garlic sauce across bottom inner bread pouch.",
    instructionDE: "20g Knoblauchsauce auf dem Brotinnenboden verstreichen.",
    targetSec: 15,
    qualityCheck: "Even edge-to-edge coat, no bare bread corners.",
    imageUrl: "https://images.unsplash.com/photo-sauce-base.jpg",
  },
  {
    stepNumber: 6,
    instruction: "Drizzle Kräuter herb sauce and chili flakes according to customer spice preference.",
    instructionDE: "Kräutersauce und Scharf-Gewürz nach Kundenwunsch dosieren.",
    targetSec: 10,
    qualityCheck: "Uniform sauce drizzle along top crest.",
    imageUrl: "https://images.unsplash.com/photo-sauce-top.jpg",
  },
  {
    stepNumber: 3,
    instruction: "Layer 40g fresh shredded red cabbage and crisp iceberg lettuce base.",
    instructionDE: "40g Rotkohl und Eisbergsalat gleichmäßig verteilen.",
    targetSec: 15,
    qualityCheck: "Crisp texture, cabbage drained of excess moisture.",
    imageUrl: "https://images.unsplash.com/photo-cabbage.jpg",
  },
  {
    stepNumber: 7,
    instruction: "Slide completed Döner into branded MYGD greaseproof triangle paper sleeve.",
    instructionDE: "Döner in MYGD Papiertasche stecken.",
    targetSec: 10,
    qualityCheck: "Upright presentation, clean sleeve exterior with no sauce smudges.",
    imageUrl: "https://images.unsplash.com/photo-final-wrap.jpg",
  },
];

// =========================================================================
// SUITE 1: MODULE M7 — PIN AUTHENTICATION & ROLE RESOLUTION
// =========================================================================

test("M7 PIN Auth - Resolves valid staff roles by 4-digit PIN (Cashier, Manager, Slicer, HQ Owner)", async () => {
  const { authenticateStaffPIN } = await getTimeclockEngine();

  // 1. Christos K. -> CASHIER ("1111")
  const cashierAuth = authenticateStaffPIN("1111", mockStaffRoster);
  assert.equal(cashierAuth.isValid, true, "PIN 1111 must authenticate successfully");
  assert.equal(cashierAuth.error, null);
  assert.ok(cashierAuth.staff);
  assert.equal(cashierAuth.staff.name, "Christos K.");
  assert.equal(cashierAuth.staff.role, "CASHIER");
  assert.equal(cashierAuth.staff.locationSlug, "EMBA");

  // 2. Marco S. -> MANAGER ("1234")
  const managerAuth = authenticateStaffPIN("1234", mockStaffRoster);
  assert.equal(managerAuth.isValid, true, "PIN 1234 must authenticate successfully");
  assert.ok(managerAuth.staff);
  assert.equal(managerAuth.staff.name, "Marco S.");
  assert.equal(managerAuth.staff.role, "MANAGER");

  // 3. Alex Mueller -> SLICER ("0000")
  const slicerAuth = authenticateStaffPIN("0000", mockStaffRoster);
  assert.equal(slicerAuth.isValid, true, "PIN 0000 must authenticate successfully");
  assert.ok(slicerAuth.staff);
  assert.equal(slicerAuth.staff.name, "Alex Mueller");
  assert.equal(slicerAuth.staff.role, "SLICER");

  // 4. Rico & Oli -> HQ OWNER ("9999")
  const ownerAuth = authenticateStaffPIN("9999", mockStaffRoster);
  assert.equal(ownerAuth.isValid, true, "PIN 9999 must authenticate successfully");
  assert.ok(ownerAuth.staff);
  assert.equal(ownerAuth.staff.name, "Rico & Oli");
  assert.equal(ownerAuth.staff.role, "HQ OWNER");
});

test("M7 PIN Auth - Rejects invalid PIN lengths (< 4 digits and > 4 digits)", async () => {
  const { authenticateStaffPIN } = await getTimeclockEngine();

  // Short PINs (< 4 digits)
  const shortPins = ["", "1", "12", "123"];
  for (const pin of shortPins) {
    const result = authenticateStaffPIN(pin, mockStaffRoster);
    assert.equal(result.isValid, false, `PIN '${pin}' must be rejected for invalid length`);
    assert.equal(result.staff, null);
    assert.ok(result.error && result.error.includes("4"), "Error message should mention 4 digits requirement");
  }

  // Long PINs (> 4 digits)
  const longPins = ["12345", "11111", "000000"];
  for (const pin of longPins) {
    const result = authenticateStaffPIN(pin, mockStaffRoster);
    assert.equal(result.isValid, false, `PIN '${pin}' must be rejected for exceeding 4 digits`);
    assert.equal(result.staff, null);
    assert.ok(result.error);
  }
});

test("M7 PIN Auth - Rejects non-numeric, alphanumeric, and malformed PINs", async () => {
  const { authenticateStaffPIN } = await getTimeclockEngine();

  const malformedPins = ["abcd", "12a4", "12 4", "12-4", "12.4", "!@#$", "00O0", " 111 "];
  for (const pin of malformedPins) {
    const result = authenticateStaffPIN(pin, mockStaffRoster);
    assert.equal(result.isValid, false, `Malformed PIN '${pin}' must be rejected`);
    assert.equal(result.staff, null);
    assert.ok(result.error);
  }
});

test("M7 PIN Auth - Rejects unregistered PINs not present in roster", async () => {
  const { authenticateStaffPIN } = await getTimeclockEngine();

  const unknownPins = ["5555", "7777", "8888", "4321"];
  for (const pin of unknownPins) {
    const result = authenticateStaffPIN(pin, mockStaffRoster);
    assert.equal(result.isValid, false, `Unregistered PIN '${pin}' must return isValid: false`);
    assert.equal(result.staff, null);
    assert.ok(result.error && result.error.includes("not found"));
  }
});

test("M7 PIN Auth - Rejects deactivated staff accounts with clear deactivation error", async () => {
  const { authenticateStaffPIN } = await getTimeclockEngine();

  // Dimitris P. has pin "3333" but isActive: false
  const deactivatedAuth = authenticateStaffPIN("3333", mockStaffRoster);
  assert.equal(deactivatedAuth.isValid, false, "Deactivated staff member must be rejected");
  assert.equal(deactivatedAuth.staff, null);
  assert.ok(
    deactivatedAuth.error && deactivatedAuth.error.toLowerCase().includes("deactivated"),
    "Error must specify that account is deactivated"
  );
});

test("M7 PIN Auth - Defensive handling against null, undefined, empty roster, or invalid types", async () => {
  const { authenticateStaffPIN } = await getTimeclockEngine();

  // Non-string PINs
  assert.equal(authenticateStaffPIN(null, mockStaffRoster).isValid, false);
  assert.equal(authenticateStaffPIN(undefined, mockStaffRoster).isValid, false);
  assert.equal(authenticateStaffPIN(1234, mockStaffRoster).isValid, false);
  assert.equal(authenticateStaffPIN(true, mockStaffRoster).isValid, false);

  // Missing or empty roster
  assert.equal(authenticateStaffPIN("1111", null).isValid, false);
  assert.equal(authenticateStaffPIN("1111", undefined).isValid, false);
  assert.equal(authenticateStaffPIN("1111", []).isValid, false);
});

// =========================================================================
// SUITE 2: MODULE M7 — SHIFT PUNCH & DURATION CALCULATION
// =========================================================================

test("M7 Shift Duration - Computes completed shift duration in minutes and 'Xh Ym' formatted string", async () => {
  const { calculateShiftDuration } = await getTimeclockEngine();

  // 1. Shift: 08:30 to 12:45 (255 minutes -> 4h 15m)
  const shift1 = calculateShiftDuration("2026-08-24T08:30:00.000Z", "2026-08-24T12:45:00.000Z");
  assert.equal(shift1.isValid, true);
  assert.equal(shift1.minutes, 255, "08:30 to 12:45 must be exactly 255 minutes");
  assert.equal(shift1.formatted, "4h 15m", "Formatted string must be '4h 15m'");
  assert.equal(shift1.hours, 4);
  assert.equal(shift1.remainingMinutes, 15);
  assert.equal(shift1.isOngoing, false);

  // 2. Standard 8-hour shift: 08:00 to 16:00 (480 minutes -> 8h 0m)
  const shift8h = calculateShiftDuration("2026-08-24T08:00:00.000Z", "2026-08-24T16:00:00.000Z");
  assert.equal(shift8h.minutes, 480);
  assert.equal(shift8h.formatted, "8h 0m");
  assert.equal(shift8h.hours, 8);
  assert.equal(shift8h.remainingMinutes, 0);

  // 3. Short prep shift: 45 minutes (0h 45m)
  const shift45m = calculateShiftDuration("2026-08-24T10:00:00.000Z", "2026-08-24T10:45:00.000Z");
  assert.equal(shift45m.minutes, 45);
  assert.equal(shift45m.formatted, "0h 45m");
  assert.equal(shift45m.hours, 0);
  assert.equal(shift45m.remainingMinutes, 45);

  // 4. Exact zero duration
  const shift0m = calculateShiftDuration("2026-08-24T10:00:00.000Z", "2026-08-24T10:00:00.000Z");
  assert.equal(shift0m.minutes, 0);
  assert.equal(shift0m.formatted, "0h 0m");
});

test("M7 Shift Duration - Handles ongoing shifts (null/undefined clockOut) against currentTime", async () => {
  const { calculateShiftDuration } = await getTimeclockEngine();

  // ClockIn: 08:30, ClockOut: null, CurrentTime: 12:45 -> 255 minutes (4h 15m)
  const ongoingWithNull = calculateShiftDuration(
    "2026-08-24T08:30:00.000Z",
    null,
    "2026-08-24T12:45:00.000Z"
  );
  assert.equal(ongoingWithNull.isValid, true);
  assert.equal(ongoingWithNull.isOngoing, true, "isOngoing flag must be true when clockOut is null");
  assert.equal(ongoingWithNull.minutes, 255);
  assert.equal(ongoingWithNull.formatted, "4h 15m");

  // ClockIn: 09:00, ClockOut: undefined, CurrentTime: 12:45 -> 225 minutes (3h 45m)
  const ongoingWithUndefined = calculateShiftDuration(
    "2026-08-24T09:00:00.000Z",
    undefined,
    "2026-08-24T12:45:00.000Z"
  );
  assert.equal(ongoingWithUndefined.isValid, true);
  assert.equal(ongoingWithUndefined.isOngoing, true);
  assert.equal(ongoingWithUndefined.minutes, 225);
  assert.equal(ongoingWithUndefined.formatted, "3h 45m");
});

test("M7 Shift Duration - Handles overnight cross-midnight shifts and multi-day spans", async () => {
  const { calculateShiftDuration } = await getTimeclockEngine();

  // Late night shift: 22:00 to 04:30 next morning (6h 30m = 390 min)
  const overnightShift = calculateShiftDuration(
    "2026-08-24T22:00:00.000Z",
    "2026-08-25T04:30:00.000Z"
  );
  assert.equal(overnightShift.isValid, true);
  assert.equal(overnightShift.minutes, 390);
  assert.equal(overnightShift.formatted, "6h 30m");
  assert.equal(overnightShift.hours, 6);
  assert.equal(overnightShift.remainingMinutes, 30);
});

test("M7 Shift Duration - Supports Date instances, ISO strings, and UNIX numeric timestamps", async () => {
  const { calculateShiftDuration } = await getTimeclockEngine();

  const d1 = new Date("2026-08-24T08:00:00.000Z");
  const d2 = new Date("2026-08-24T16:30:00.000Z"); // 8h 30m = 510m

  // 1. Date objects
  const dateObjResult = calculateShiftDuration(d1, d2);
  assert.equal(dateObjResult.minutes, 510);
  assert.equal(dateObjResult.formatted, "8h 30m");

  // 2. UNIX numeric ms timestamps
  const tsResult = calculateShiftDuration(d1.getTime(), d2.getTime());
  assert.equal(tsResult.minutes, 510);
  assert.equal(tsResult.formatted, "8h 30m");
});

test("M7 Shift Duration - Catches negative durations, inverted clock punches, and malformed inputs", async () => {
  const { calculateShiftDuration } = await getTimeclockEngine();

  // ClockOut before ClockIn (negative elapsed time)
  const invertedResult = calculateShiftDuration(
    "2026-08-24T14:00:00.000Z",
    "2026-08-24T10:00:00.000Z"
  );
  assert.equal(invertedResult.isValid, false);
  assert.equal(invertedResult.minutes, 0);
  assert.ok(invertedResult.error && invertedResult.error.toLowerCase().includes("earlier"));

  // Malformed date strings
  const invalidIn = calculateShiftDuration("not-a-date", "2026-08-24T12:00:00.000Z");
  assert.equal(invalidIn.isValid, false);
  assert.equal(invalidIn.minutes, 0);
  assert.ok(invalidIn.error);

  // Missing / null clockIn
  const missingIn = calculateShiftDuration(null, "2026-08-24T12:00:00.000Z");
  assert.equal(missingIn.isValid, false);
  assert.equal(missingIn.minutes, 0);
});

// =========================================================================
// SUITE 3: MODULE M8 — McDONALD'S-STYLE VISUAL BUILD SHEETS
// =========================================================================

test("M8 Visual Build Sheet - Orders RecipeStep records strictly ascending by stepNumber", async () => {
  const { formatProductBuildSheet } = await getTimeclockEngine();

  // Input steps are deliberately unordered: [4, 1, 5, 2, 6, 3, 7]
  const buildSheet = formatProductBuildSheet(mockClassicDonerProduct, mockRecipeStepsUnordered);

  assert.equal(buildSheet.productId, "prod-doner-01");
  assert.equal(buildSheet.productName, "Original German Döner (150g)");
  assert.equal(buildSheet.sku, "MYGD-DON-01");
  assert.equal(buildSheet.hasDefaultSOP, false);
  assert.equal(buildSheet.steps.length, 7, "All 7 recipe steps must be present");

  // Verify strict ascending sequence: 1, 2, 3, 4, 5, 6, 7
  const stepNumbers = buildSheet.steps.map((s) => s.stepNumber);
  assert.deepEqual(stepNumbers, [1, 2, 3, 4, 5, 6, 7], "Steps must be sorted strictly ascending by stepNumber");

  // Verify step 1 content is bread toasting
  assert.equal(buildSheet.steps[0].stepNumber, 1);
  assert.ok(buildSheet.steps[0].instruction.includes("Toast quarter Fladenbrot"));
  assert.equal(buildSheet.steps[0].targetSec, 45);

  // Verify step 7 content is final sleeve wrap
  assert.equal(buildSheet.steps[6].stepNumber, 7);
  assert.ok(buildSheet.steps[6].instruction.includes("triangle paper sleeve"));
  assert.equal(buildSheet.steps[6].targetSec, 10);
});

test("M8 Visual Build Sheet - Validates and normalizes required fields across all steps", async () => {
  const { formatProductBuildSheet } = await getTimeclockEngine();

  const buildSheet = formatProductBuildSheet(mockClassicDonerProduct, mockRecipeStepsUnordered);

  for (const step of buildSheet.steps) {
    assert.equal(typeof step.stepNumber, "number", "stepNumber must be a number");
    assert.ok(step.stepNumber > 0, "stepNumber must be positive");

    assert.equal(typeof step.instruction, "string", "instruction must be a non-empty string");
    assert.ok(step.instruction.length > 0);

    assert.equal(typeof step.targetSec, "number", "targetSec must be a positive integer");
    assert.ok(step.targetSec > 0);

    assert.equal(typeof step.qualityCheck, "string", "qualityCheck must be a non-empty string");
    assert.ok(step.qualityCheck.length > 0);

    assert.ok(step.imageUrl !== undefined, "imageUrl property must exist");
  }
});

test("M8 Visual Build Sheet - Computes totalTargetSec aggregation and preserves metadata", async () => {
  const { formatProductBuildSheet } = await getTimeclockEngine();

  const buildSheet = formatProductBuildSheet(mockClassicDonerProduct, mockRecipeStepsUnordered);

  // Sum of targetSecs: 45 + 15 + 15 + 30 + 15 + 10 + 10 = 140 seconds
  assert.equal(buildSheet.totalTargetSec, 140, "Total target preparation time must equal 140 seconds");
  assert.equal(buildSheet.stepCount, 7);

  assert.equal(buildSheet.meatWeight, "150g Sliced Rotisserie Meat");
  assert.equal(buildSheet.breadType, "Crispy Turkish Fladenbrot");
  assert.ok(buildSheet.sauceSequence && buildSheet.sauceSequence.includes("Knoblauch"));
});

test("M8 Visual Build Sheet - Gracefully handles empty, null, or missing recipe steps with default SOP", async () => {
  const { formatProductBuildSheet } = await getTimeclockEngine();

  // 1. Empty array []
  const emptySheet = formatProductBuildSheet(mockClassicDonerProduct, []);
  assert.equal(emptySheet.hasDefaultSOP, true, "hasDefaultSOP must be true when steps are empty");
  assert.equal(emptySheet.stepCount, 1);
  assert.equal(emptySheet.steps.length, 1);
  assert.equal(emptySheet.steps[0].stepNumber, 1);
  assert.ok(emptySheet.steps[0].instruction.includes("Standard Assembly SOP"));
  assert.ok(emptySheet.steps[0].qualityCheck.includes(">63°C"));
  assert.equal(emptySheet.totalTargetSec, 30);

  // 2. null steps
  const nullStepsSheet = formatProductBuildSheet(mockClassicDonerProduct, null);
  assert.equal(nullStepsSheet.hasDefaultSOP, true);
  assert.equal(nullStepsSheet.steps.length, 1);

  // 3. undefined steps
  const undefStepsSheet = formatProductBuildSheet(mockClassicDonerProduct, undefined);
  assert.equal(undefStepsSheet.hasDefaultSOP, true);
  assert.equal(undefStepsSheet.steps.length, 1);
});

test("M8 Visual Build Sheet - Robust normalization for partial step records and missing product", async () => {
  const { formatProductBuildSheet } = await getTimeclockEngine();

  // Partial steps with missing qualityCheck and targetSec
  const incompleteSteps = [
    { stepNumber: 2, instruction: "Add sauce" },
    { stepNumber: 1, instruction: "Warm flatbread" },
  ];

  const partialSheet = formatProductBuildSheet(mockClassicDonerProduct, incompleteSteps);
  assert.equal(partialSheet.steps.length, 2);
  assert.equal(partialSheet.steps[0].stepNumber, 1);
  assert.equal(partialSheet.steps[0].instruction, "Warm flatbread");
  assert.equal(partialSheet.steps[0].targetSec, 30, "Missing targetSec should default to 30s");
  assert.ok(partialSheet.steps[0].qualityCheck, "Missing qualityCheck should have default inspection note");

  assert.equal(partialSheet.steps[1].stepNumber, 2);
  assert.equal(partialSheet.steps[1].instruction, "Add sauce");

  // Null product input
  const nullProductSheet = formatProductBuildSheet(null, null);
  assert.ok(nullProductSheet.productId);
  assert.ok(nullProductSheet.productName);
  assert.equal(nullProductSheet.hasDefaultSOP, true);
  assert.equal(nullProductSheet.steps.length, 1);
});

test("M7 & M8 Engine - Validates CANONICAL_STAFF_ROSTER and CANONICAL_BUILD_SHEETS exports", async () => {
  const { CANONICAL_STAFF_ROSTER, CANONICAL_BUILD_SHEETS, authenticateStaffPIN, formatProductBuildSheet } =
    await getTimeclockEngine();

  // 1. Validate CANONICAL_STAFF_ROSTER
  assert.ok(Array.isArray(CANONICAL_STAFF_ROSTER));
  assert.ok(CANONICAL_STAFF_ROSTER.length >= 6);

  // Authenticate Cashier
  const cashier = authenticateStaffPIN("1111", CANONICAL_STAFF_ROSTER);
  assert.equal(cashier.isValid, true);
  assert.equal(cashier.staff.name, "Christos K.");

  // Authenticate Manager
  const manager = authenticateStaffPIN("1234", CANONICAL_STAFF_ROSTER);
  assert.equal(manager.isValid, true);
  assert.equal(manager.staff.name, "Marco S.");

  // 2. Validate CANONICAL_BUILD_SHEETS
  assert.ok(Array.isArray(CANONICAL_BUILD_SHEETS));
  assert.ok(CANONICAL_BUILD_SHEETS.length >= 4);

  for (const sheet of CANONICAL_BUILD_SHEETS) {
    assert.ok(sheet.product.sku);
    assert.ok(sheet.product.name);
    assert.ok(Array.isArray(sheet.steps));
    assert.ok(sheet.steps.length > 0);

    const formatted = formatProductBuildSheet(
      {
        id: "prod-test",
        name: sheet.product.name,
        sku: sheet.product.sku,
        meatWeight: sheet.product.meatWeight,
        breadType: sheet.product.breadType,
        sauceSequence: sheet.product.sauceSequence,
        imageUrl: sheet.product.imageUrl,
      },
      sheet.steps
    );

    assert.equal(formatted.steps.length, sheet.steps.length);
    assert.ok(formatted.totalTargetSec > 0);
  }
});


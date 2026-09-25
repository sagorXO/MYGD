// MY GERMAN DÖNER — Module M7 Staff Timeclock & Module M8 Visual SOP Build Sheets Engine
// Production-grade shift duration math, 4-digit PIN authentication, and visual recipe step sequencing.

export type StaffRole =
  | "CASHIER"
  | "SLICER"
  | "ASSEMBLER"
  | "GRILL_MASTER"
  | "MANAGER"
  | "HQ OWNER"
  | "HQ_OWNER"
  | string;

export interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: StaffRole;
  locationSlug?: string;
  isActive?: boolean;
  hourlyRateEUR?: number;
}

export const CANONICAL_STAFF_ROSTER: StaffMember[] = [
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

export interface CanonicalBuildSheetData {
  product: {
    name: string;
    sku: string;
    description?: string;
    basePrice: number;
    meatWeight?: string;
    breadType?: string;
    sauceSequence?: string;
    imageUrl: string;
    sortOrder: number;
  };
  steps: Array<{
    stepNumber: number;
    instruction: string;
    instructionDE?: string;
    targetSec: number;
    qualityCheck: string;
    imageUrl?: string;
  }>;
}

export const CANONICAL_BUILD_SHEETS: CanonicalBuildSheetData[] = [
  {
    product: {
      name: "Original German Döner (150g)",
      sku: "MYGD-CL-DONER",
      description: "Original toasted triangle flatbread, sliced rotisserie meat, fresh crisp salad & trio homemade sauces.",
      basePrice: 7.5,
      meatWeight: "150g Sliced Rotisserie Meat",
      breadType: "Crispy Turkish Fladenbrot",
      sauceSequence: "Bottom: Knoblauch (Garlic) ➔ Top: Kräuter (Herb) + Optional Scharf (Chili)",
      imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
      sortOrder: 1,
    },
    steps: [
      {
        stepNumber: 1,
        instruction: "Toast quarter Fladenbrot in contact grill for 45s until crispy exterior with soft core.",
        instructionDE: "Fladenbrot 45s im Kontaktgrill toasten.",
        targetSec: 45,
        qualityCheck: "Golden grill marks, bread warmth > 60°C.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
      {
        stepNumber: 2,
        instruction: "Spread 20g homemade Knoblauch garlic sauce across bottom inner bread pouch.",
        instructionDE: "20g Knoblauchsauce auf dem Brotinnenboden verstreichen.",
        targetSec: 15,
        qualityCheck: "Even edge-to-edge coat, no bare bread corners.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
      {
        stepNumber: 3,
        instruction: "Layer 40g fresh shredded red cabbage and crisp iceberg lettuce base.",
        instructionDE: "40g Rotkohl und Eisbergsalat gleichmäßig verteilen.",
        targetSec: 15,
        qualityCheck: "Crisp texture, cabbage drained of excess moisture.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
      {
        stepNumber: 4,
        instruction: "Weigh exactly 150g hot rotisserie shaved meat on scale (internal meat temp > 75°C).",
        instructionDE: "Genau 150g heißes Fleisch auf Waage abwiegen (> 75°C).",
        targetSec: 30,
        qualityCheck: "Zero meat clumps, steam rising, strictly 150g ± 5g.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
      {
        stepNumber: 5,
        instruction: "Add 3 fresh tomato half-slices, cucumber ribbons, and chopped parsley.",
        instructionDE: "3 Tomatenscheiben, Gurken und frische Petersilie einlegen.",
        targetSec: 15,
        qualityCheck: "Vibrant color distribution edge-to-edge.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
      {
        stepNumber: 6,
        instruction: "Drizzle Kräuter herb sauce and chili flakes according to customer spice preference.",
        instructionDE: "Kräutersauce und Scharf-Gewürz nach Kundenwunsch dosieren.",
        targetSec: 10,
        qualityCheck: "Uniform sauce drizzle along top crest.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
      {
        stepNumber: 7,
        instruction: "Slide completed Döner into branded MYGD greaseproof triangle paper sleeve.",
        instructionDE: "Döner in MYGD Papiertasche stecken.",
        targetSec: 10,
        qualityCheck: "Upright presentation, clean sleeve exterior with no sauce smudges.",
        imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800",
      },
    ],
  },
  {
    product: {
      name: "Standard Dürüm Wrap (150g)",
      sku: "MYGD-WRP-01",
      description: "Warm thin lavash flatbread, 150g shaved rotisserie meat, crisp salad and signature sauces rolled tight.",
      basePrice: 8.0,
      meatWeight: "150g Sliced Rotisserie Meat",
      breadType: "Warm Thin Lavash Flatbread",
      sauceSequence: "Even stripe of Kräuter & Knoblauch down center line",
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85",
      sortOrder: 2,
    },
    steps: [
      {
        stepNumber: 1,
        instruction: "Warm lavash flatbread on flat grill for 15s to make pliable.",
        instructionDE: "Lavash-Brot 15s auf dem Kontaktgrill erwärmen.",
        targetSec: 15,
        qualityCheck: "Warm and flexible, zero tearing.",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      },
      {
        stepNumber: 2,
        instruction: "Spread sauces evenly down the center 1/3 of the flatbread.",
        instructionDE: "Saucen gleichmäßig auf dem mittleren Drittel verteilen.",
        targetSec: 10,
        qualityCheck: "Uniform sauce stripe, clean borders.",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      },
      {
        stepNumber: 3,
        instruction: "Add 150g freshly carved rotisserie meat in an even cylinder line.",
        instructionDE: "150g frisch geschnittenes Fleisch mittig auflegen.",
        targetSec: 25,
        qualityCheck: "Meat temperature > 75°C, exact 150g portion.",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      },
      {
        stepNumber: 4,
        instruction: "Top with shredded cabbage, tomatoes, onions, and fresh mint/parsley.",
        instructionDE: "Mit Kraut, Tomaten, Zwiebeln und Kräutern belegen.",
        targetSec: 15,
        qualityCheck: "Fresh crisp salad, evenly proportioned.",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      },
      {
        stepNumber: 5,
        instruction: "Tightly tuck bottom flap, roll tightly into a cylindrical wrap, and toast exterior 20s.",
        instructionDE: "Boden einschlagen, fest rollen und 20s anknuspern.",
        targetSec: 20,
        qualityCheck: "Tight structural roll, light grill marks.",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      },
      {
        stepNumber: 6,
        instruction: "Wrap bottom half in branded aluminum foil sleeve.",
        instructionDE: "Untere Hälfte in MYGD Alufolie wickeln.",
        targetSec: 10,
        qualityCheck: "Clean exterior presentation, no sauce leakage.",
        imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800",
      },
    ],
  },
  {
    product: {
      name: "Berlin Döner Box with Fries",
      sku: "MYGD-BOX-CRISP",
      description: "Crispy skin-on fries topped with juicy rotisserie meat, garlic herb sauce, and pickled red cabbage.",
      basePrice: 8.5,
      meatWeight: "150g Sliced Meat",
      breadType: "No Bread (Base: 150g Berlin Fries)",
      sauceSequence: "Double drizzle over fries + top meat layer",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 3,
    },
    steps: [
      {
        stepNumber: 1,
        instruction: "Drop fresh Berlin fries into branded Döner Box (fill 50% height).",
        instructionDE: "Frische Berliner Pommes bis zur Hälfte in die Box füllen.",
        targetSec: 15,
        qualityCheck: "Golden crispy fries, properly drained of oil.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      },
      {
        stepNumber: 2,
        instruction: "Season fries with signature paprika-salt blend.",
        instructionDE: "Pommes mit Paprika-Gewürzsalz bestreuen.",
        targetSec: 5,
        qualityCheck: "Even seasoning distribution.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      },
      {
        stepNumber: 3,
        instruction: "Drizzle 1 stroke of Garlic or Cocktail sauce over the fries.",
        instructionDE: "1 Portion Knoblauch- oder Cocktailsauce auf die Pommes geben.",
        targetSec: 10,
        qualityCheck: "Even sauce coat over fry layer.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      },
      {
        stepNumber: 4,
        instruction: "Top with 150g hot rotisserie meat weighed on scale.",
        instructionDE: "150g heißes Fleisch auf die Pommes schichten.",
        targetSec: 25,
        qualityCheck: "Meat temp > 75°C, exact 150g portion.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      },
      {
        stepNumber: 5,
        instruction: "Add side scoop of mixed red cabbage and tomato salad.",
        instructionDE: "Seitlich Rotkraut- und Tomatensalat anrichten.",
        targetSec: 10,
        qualityCheck: "Vibrant visual appeal and crisp texture.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      },
      {
        stepNumber: 6,
        instruction: "Drizzle top sauce and serve with wooden fork.",
        instructionDE: "Mit Obersauce garnieren und Holzgabel beilegen.",
        targetSec: 10,
        qualityCheck: "Clean box rim, no drips, fork inserted upright.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      },
    ],
  },
  {
    product: {
      name: "Truffle Parmesan Loaded Fries",
      sku: "MYGD-FR-TRUFFLE",
      description: "Golden crispy fries drizzled with black truffle mayo, shaved aged parmesan & fresh parsley.",
      basePrice: 4.9,
      meatWeight: "No Meat (Vegetarian Loaded Side)",
      breadType: "No Bread (Base: 250g Berlin Fries)",
      sauceSequence: "Black Truffle Mayo zigzag drizzle",
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85",
      sortOrder: 4,
    },
    steps: [
      {
        stepNumber: 1,
        instruction: "Fry 250g skin-on fries at 175°C for 3m30s until golden crispy.",
        instructionDE: "250g Pommes bei 175°C 3:30 Min. frittieren.",
        targetSec: 210,
        qualityCheck: "Golden color, internal temperature > 85°C.",
        imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
      },
      {
        stepNumber: 2,
        instruction: "Toss in stainless steel bowl with sea salt and cracked black pepper.",
        instructionDE: "In Edelstahlschüssel mit Meersalz und Pfeffer schwenken.",
        targetSec: 10,
        qualityCheck: "Even seasoning distribution.",
        imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
      },
      {
        stepNumber: 3,
        instruction: "Transfer fries to open branded side box.",
        instructionDE: "Pommes in MYGD Snack-Box füllen.",
        targetSec: 5,
        qualityCheck: "Centered pile, zero spilling.",
        imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
      },
      {
        stepNumber: 4,
        instruction: "Drizzle 30g black truffle mayonnaise in consistent zigzag motion.",
        instructionDE: "30g Trüffelmayo im Zickzack-Muster auftragen.",
        targetSec: 10,
        qualityCheck: "Even drizzle coverage from end to end.",
        imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
      },
      {
        stepNumber: 5,
        instruction: "Garnish with 15g shaved aged parmesan and fresh chopped parsley.",
        instructionDE: "Mit 15g gehobeltem Parmesan und Petersilie bestreuen.",
        targetSec: 10,
        qualityCheck: "Gourmet visual finish, vibrant green accents.",
        imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800",
      },
    ],
  },
];

export interface PINAuthResult {
  isValid: boolean;
  staff: StaffMember | null;
  error?: string | null;
}

export interface ShiftDurationResult {
  minutes: number;
  formatted: string; // e.g. "4h 15m", "0h 45m"
  hours: number;
  remainingMinutes: number;
  isOngoing: boolean;
  isValid: boolean;
  error?: string | null;
}

export interface RecipeStepInput {
  id?: string;
  stepNumber: number;
  instruction?: string;
  instructionDE?: string | null;
  targetSec?: number;
  qualityCheck?: string | null;
  imageUrl?: string | null;
}

export interface ProductInput {
  id: string;
  name: string;
  sku?: string;
  meatWeight?: string;
  breadType?: string;
  sauceSequence?: string;
  imageUrl?: string | null;
}

export interface FormattedRecipeStep {
  stepNumber: number;
  instruction: string;
  instructionDE?: string;
  targetSec: number;
  qualityCheck: string;
  imageUrl: string | null;
}

export interface ProductBuildSheetResult {
  productId: string;
  productName: string;
  sku: string;
  meatWeight?: string;
  breadType?: string;
  sauceSequence?: string;
  imageUrl: string | null;
  steps: FormattedRecipeStep[];
  totalTargetSec: number;
  stepCount: number;
  hasDefaultSOP: boolean;
}

/**
 * Module M7: Authenticate Staff 4-Digit PIN & Resolve Role
 *
 * Enforces strict 4-digit numeric format, checks active roster,
 * and returns the authenticated staff member with assigned role.
 */
export function authenticateStaffPIN(
  pin: unknown,
  staffRoster?: StaffMember[] | null
): PINAuthResult {
  if (typeof pin !== "string") {
    return {
      isValid: false,
      staff: null,
      error: "Invalid PIN format: PIN must be a 4-digit string.",
    };
  }

  const trimmedPin = pin.trim();

  // Validate exactly 4 numeric digits
  if (trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
    return {
      isValid: false,
      staff: null,
      error: "Invalid PIN format: must be exactly 4 numeric digits (0-9).",
    };
  }

  if (!staffRoster || !Array.isArray(staffRoster) || staffRoster.length === 0) {
    return {
      isValid: false,
      staff: null,
      error: "Staff roster is empty or unavailable.",
    };
  }

  const staffMember = staffRoster.find(
    (member) => member && typeof member === "object" && member.pin === trimmedPin
  );

  if (!staffMember) {
    return {
      isValid: false,
      staff: null,
      error: "Unrecognized PIN: staff member not found in active roster.",
    };
  }

  if (staffMember.isActive === false) {
    return {
      isValid: false,
      staff: null,
      error: "Staff member account is deactivated.",
    };
  }

  return {
    isValid: true,
    staff: staffMember,
    error: null,
  };
}

/**
 * Parse an arbitrary input value into millisecond timestamp
 */
function parseTimestamp(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    const time = val.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    const time = d.getTime();
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

/**
 * Module M7: Shift Punch & Duration Calculation
 *
 * Computes elapsed time in minutes and formatted "Xh Ym" string.
 * Handles ongoing shifts when clockOut is omitted/null/undefined using reference currentTime.
 */
export function calculateShiftDuration(
  clockIn: unknown,
  clockOut?: unknown,
  currentTime?: unknown
): ShiftDurationResult {
  const inMs = parseTimestamp(clockIn);

  if (inMs === null) {
    return {
      minutes: 0,
      formatted: "0h 0m",
      hours: 0,
      remainingMinutes: 0,
      isOngoing: false,
      isValid: false,
      error: "Invalid clock-in timestamp.",
    };
  }

  const outMs = parseTimestamp(clockOut);
  const isOngoing = outMs === null;

  let endMs: number;
  if (isOngoing) {
    const currentMs = parseTimestamp(currentTime);
    endMs = currentMs !== null ? currentMs : Date.now();
  } else {
    endMs = outMs;
  }

  const elapsedMs = endMs - inMs;

  if (elapsedMs < 0) {
    return {
      minutes: 0,
      formatted: "0h 0m",
      hours: 0,
      remainingMinutes: 0,
      isOngoing,
      isValid: false,
      error: "Clock-out time cannot be earlier than clock-in time.",
    };
  }

  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const formatted = `${hours}h ${remainingMinutes}m`;

  return {
    minutes: totalMinutes,
    formatted,
    hours,
    remainingMinutes,
    isOngoing,
    isValid: true,
    error: null,
  };
}

/**
 * Module M8: Visual Build Sheet Step Sequencing & Normalization
 *
 * Orders RecipeStep records strictly ascending by stepNumber (1, 2, 3...).
 * Validates and normalizes required fields (instruction, targetSec, qualityCheck, imageUrl).
 * Provides graceful default SOP instructions when steps are empty or missing.
 */
export function formatProductBuildSheet(
  product?: ProductInput | null,
  recipeSteps?: RecipeStepInput[] | null
): ProductBuildSheetResult {
  const safeProduct: ProductInput = product || {
    id: "unknown-prod",
    name: "Standard MYGD Product",
    sku: "MYGD-STD-01",
  };

  const defaultStep: FormattedRecipeStep = {
    stepNumber: 1,
    instruction: "Standard Assembly SOP: Follow store portioning standards and kitchen presentation guidelines.",
    instructionDE: "Standard-Zubereitungs-SOP: Standardportionierung und Richtlinien beachten.",
    targetSec: 30,
    qualityCheck: "Verify internal food temperature (>63°C for hot meat) and visual presentation.",
    imageUrl: safeProduct.imageUrl || null,
  };

  if (!recipeSteps || !Array.isArray(recipeSteps) || recipeSteps.length === 0) {
    return {
      productId: safeProduct.id,
      productName: safeProduct.name,
      sku: safeProduct.sku || "MYGD-STD-01",
      meatWeight: safeProduct.meatWeight,
      breadType: safeProduct.breadType,
      sauceSequence: safeProduct.sauceSequence,
      imageUrl: safeProduct.imageUrl || null,
      steps: [defaultStep],
      totalTargetSec: 30,
      stepCount: 1,
      hasDefaultSOP: true,
    };
  }

  // Sort strictly ascending by stepNumber
  const sorted = [...recipeSteps].sort(
    (a, b) => (Number(a?.stepNumber) || 0) - (Number(b?.stepNumber) || 0)
  );

  const formattedSteps: FormattedRecipeStep[] = sorted.map((step, index) => {
    const stepNum =
      typeof step?.stepNumber === "number" && step.stepNumber > 0
        ? step.stepNumber
        : index + 1;

    const instruction =
      typeof step?.instruction === "string" && step.instruction.trim().length > 0
        ? step.instruction.trim()
        : `Assembly Step ${stepNum}`;

    const targetSec =
      typeof step?.targetSec === "number" && step.targetSec > 0
        ? Math.round(step.targetSec)
        : 30;

    const qualityCheck =
      typeof step?.qualityCheck === "string" && step.qualityCheck.trim().length > 0
        ? step.qualityCheck.trim()
        : "Verify visual presentation and hygiene standards.";

    const imageUrl = step?.imageUrl ?? safeProduct.imageUrl ?? null;

    return {
      stepNumber: stepNum,
      instruction,
      instructionDE: step?.instructionDE ? step.instructionDE.trim() : undefined,
      targetSec,
      qualityCheck,
      imageUrl,
    };
  });

  const totalTargetSec = formattedSteps.reduce((acc, step) => acc + step.targetSec, 0);

  return {
    productId: safeProduct.id,
    productName: safeProduct.name,
    sku: safeProduct.sku || "MYGD-STD-01",
    meatWeight: safeProduct.meatWeight,
    breadType: safeProduct.breadType,
    sauceSequence: safeProduct.sauceSequence,
    imageUrl: safeProduct.imageUrl || null,
    steps: formattedSteps,
    totalTargetSec,
    stepCount: formattedSteps.length,
    hasDefaultSOP: false,
  };
}

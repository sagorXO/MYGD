// MY GERMAN DÖNER — Module M7 Staff Timeclock & Module M8 Visual SOP Build Sheets Engine
// Shift duration math and visual recipe step sequencing.
// Staff PIN checks live in src/lib/auth/staff-pin.ts (bcrypt hashes on AdminUser); no PINs in source.
import { findMenuItem } from "./menu/mygd-menu";

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

type SheetStep = CanonicalBuildSheetData["steps"][number];

/** Product header from the single menu source, so name, SKU, price and description can never drift. */
function sheetProduct(
  sku: string,
  extra: Pick<CanonicalBuildSheetData["product"], "meatWeight" | "breadType" | "sauceSequence">,
  sortOrder: number,
): CanonicalBuildSheetData["product"] {
  const item = findMenuItem(sku);
  if (!item) throw new Error(`Build sheet references unknown menu SKU ${sku}`);
  return { name: item.name, sku, description: item.description, basePrice: item.price, imageUrl: item.imageUrl, sortOrder, ...extra };
}

const step = (stepNumber: number, instruction: string, instructionDE: string, targetSec: number, qualityCheck: string): SheetStep => ({
  stepNumber,
  instruction,
  instructionDE,
  targetSec,
  qualityCheck,
});

// Assembly steps use only the ingredients printed on the menu. Portion weights are set per recipe card
// (see the bill of materials), not repeated here.
export const CANONICAL_BUILD_SHEETS: CanonicalBuildSheetData[] = [
  {
    product: sheetProduct("MYGD-BIG-B", { meatWeight: "Beef doener portion", breadType: "Original Berlin flatbread", sauceSequence: "Cocktail sauce" }, 1),
    steps: [
      step(1, "Warm the original Berlin flatbread on the contact grill until soft inside and lightly crisp outside.", "Berliner Fladenbrot auf dem Kontaktgrill erwärmen, innen weich und außen leicht knusprig.", 45, "Golden grill marks, bread warm to the touch."),
      step(2, "Spread cocktail sauce across the inside of the flatbread.", "Cocktailsauce auf der Innenseite des Fladenbrots verstreichen.", 15, "Even coat, no bare corners."),
      step(3, "Add lettuce and red cabbage.", "Salat und Rotkohl hinzufügen.", 20, "Even layer, nothing falling out."),
      step(4, "Add the beef doener portion, carved hot from the spit.", "Rinder-Döner-Portion heiß vom Spieß schneiden und hinzufügen.", 20, "Meat steaming hot (core above 75°C)."),
      step(5, "Add tomatoes, cucumber and onions.", "Tomaten, Gurke und Zwiebeln hinzufügen.", 20, "Balanced distribution across the flatbread."),
      step(6, "Slide the Big B into a MYGD paper sleeve and hand over.", "Big B in die MYGD-Papiertasche stecken und übergeben.", 10, "Clean sleeve, no sauce smudges."),
    ],
  },
  {
    product: sheetProduct("MYGD-WRAP-BEEF", { meatWeight: "Beef doener portion", breadType: "Wrap bread", sauceSequence: "Cocktail sauce" }, 2),
    steps: [
      step(1, "Warm the wrap bread on the flat grill until pliable.", "Wrap-Brot auf der Grillplatte geschmeidig erwärmen.", 15, "Soft, bends without cracking."),
      step(2, "Spread cocktail sauce down the centre of the wrap.", "Cocktailsauce mittig auf dem Wrap verstreichen.", 15, "Even stripe, not reaching the edges."),
      step(3, "Add the beef doener portion in an even line.", "Rinder-Döner-Portion gleichmäßig auflegen.", 20, "Meat steaming hot (core above 75°C)."),
      step(4, "Top with lettuce, tomatoes, cucumber, onions and red cabbage.", "Mit Salat, Tomaten, Gurke, Zwiebeln und Rotkohl belegen.", 20, "All five salad items present."),
      step(5, "Fold in the bottom, roll tight and toast the outside briefly.", "Unteren Rand einschlagen, fest aufrollen und außen kurz anrösten.", 25, "Tight roll, seam underneath."),
      step(6, "Wrap the bottom half in a foil sleeve.", "Untere Hälfte in die Alufolie einschlagen.", 10, "Clean exterior, no leaks."),
    ],
  },
  {
    product: sheetProduct("MYGD-BOWL-BEEF", { meatWeight: "Beef doener portion", breadType: "No bread (white rice or fries base)", sauceSequence: "Sauce of the guest's choice" }, 3),
    steps: [
      step(1, "Fill the bowl with the guest's base: white rice or fries.", "Schale mit der gewählten Basis füllen: weißer Reis oder Pommes.", 25, "Base fills about half the bowl, fries hot and crisp."),
      step(2, "Add the beef doener portion on top.", "Rinder-Döner-Portion darauf geben.", 20, "Meat steaming hot (core above 75°C)."),
      step(3, "Add lettuce, tomatoes, cucumbers, red cabbage and onions.", "Salat, Tomaten, Gurken, Rotkohl und Zwiebeln hinzufügen.", 25, "Each salad item in its own section."),
      step(4, "Drizzle the sauce the guest chose.", "Die gewählte Sauce darüber geben.", 10, "Correct sauce, even drizzle."),
      step(5, "Close the lid, add a fork and hand over.", "Deckel schließen, Gabel dazu und übergeben.", 10, "Clean rim, fork included."),
    ],
  },
  {
    product: sheetProduct("MYGD-LOADED-CHEESY", { meatWeight: "No meat", breadType: "No bread (fries base)", sauceSequence: "One sauce of the guest's choice" }, 4),
    steps: [
      step(1, "Fry the fries until golden and crisp.", "Pommes goldbraun und knusprig frittieren.", 210, "Golden colour, crisp bite."),
      step(2, "Fill the fries into an open box.", "Pommes in eine offene Box füllen.", 15, "Full portion, no loose fries on the counter."),
      step(3, "Add the cheesy topping.", "Cheesy-Topping auftragen.", 15, "Topping covers the fries, hot and melted."),
      step(4, "Add the guest's one included sauce.", "Die eine inkludierte Sauce des Gastes hinzufügen.", 10, "Correct sauce."),
      step(5, "Add a fork and hand over.", "Gabel dazu und übergeben.", 10, "Clean box rim."),
    ],
  },
];

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

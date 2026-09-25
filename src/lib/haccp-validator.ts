// MY GERMAN DÖNER — Module M1 HACCP Food Safety & Checklist Engine
// EU Regulation (EC) 852/2004 Temperature Standards & Digital SOP Logger

export type HACCPTargetType = "CHILLED" | "FROZEN" | "HOT_HOLDING";

export interface HACCPValidationResult {
  isCompliant: boolean;
  isDangerZone: boolean;
  targetRange: string;
  loggedTemp: number;
  actionRequired?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  category?: string;
  isTempCheck?: boolean;
  tempType?: HACCPTargetType;
  target?: string;
}

export interface CompletedTaskRecord {
  id: string;
  completed: boolean;
  loggedTemp?: number;
  correctiveActionNote?: string;
}

/**
 * Validate logged temperature against EU HACCP Regulation (EC) 852/2004:
 * - CHILLED (Walk-in Fridges, Prep Counters): 0.0°C – 5.0°C (Danger Zone: > 5.0°C)
 * - FROZEN (Deep Freezers): -18.0°C – -22.0°C (Alert: > -15.0°C)
 * - HOT_HOLDING (Cooked Rotisserie Spit Meat): ≥ 63.0°C (Danger Zone: < 63.0°C)
 */
export function validateHACCPTemperature(
  targetType: HACCPTargetType,
  temperature: number
): HACCPValidationResult {
  if (typeof temperature !== "number" || Number.isNaN(temperature)) {
    return {
      isCompliant: false,
      isDangerZone: true,
      targetRange: targetType,
      loggedTemp: 0,
      actionRequired: "Invalid temperature reading. Numeric value required.",
    };
  }

  switch (targetType) {
    case "CHILLED": {
      const isCompliant = temperature >= 0.0 && temperature <= 5.0;
      const isDangerZone = temperature > 5.0;
      return {
        isCompliant,
        isDangerZone,
        targetRange: "0.0°C – 5.0°C (Target: 3.0°C)",
        loggedTemp: temperature,
        actionRequired: !isCompliant
          ? isDangerZone
            ? "Immediate corrective action required: Move food to backup walk-in fridge and log maintenance incident."
            : "Chilled unit below 0°C (freezing risk). Adjust thermostat."
          : undefined,
      };
    }

    case "FROZEN": {
      const isCompliant = temperature <= -18.0;
      const isDangerZone = temperature > -10.0;
      return {
        isCompliant,
        isDangerZone,
        targetRange: "-18.0°C – -22.0°C",
        loggedTemp: temperature,
        actionRequired: !isCompliant
          ? "Freezer temperature too high. Check door seal and initiate rapid defrost inspection."
          : undefined,
      };
    }

    case "HOT_HOLDING": {
      const isCompliant = temperature >= 63.0;
      const isDangerZone = temperature < 63.0;
      return {
        isCompliant,
        isDangerZone,
        targetRange: "≥ 63.0°C (Target: 65°C – 75°C)",
        loggedTemp: temperature,
        actionRequired: !isCompliant
          ? "Spit meat below 63°C danger threshold! Immediately re-roast or discard meat according to HACCP waste protocol."
          : undefined,
      };
    }

    default:
      return {
        isCompliant: true,
        isDangerZone: false,
        targetRange: "N/A",
        loggedTemp: temperature,
      };
  }
}

/**
 * Parse Checklist Tasks from JSON stored in ChecklistTemplate.tasksJson
 */
export function parseChecklistTasks(tasksJson: string): ChecklistTask[] {
  try {
    const parsed = typeof tasksJson === "string" ? JSON.parse(tasksJson) : tasksJson;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[HACCP] Failed to parse tasksJson:", err);
    return [];
  }
}

/**
 * Create structured log payload for ChecklistLog persistence
 */
export function createChecklistLogPayload(
  locationSlug: string,
  shiftType: "OPENING" | "MID_DAY" | "CLOSING" | "HACCP" | string,
  completedBy: string,
  completedTasks: CompletedTaskRecord[],
  notes?: string
) {
  let isCompliant = true;

  for (const task of completedTasks) {
    if (!task.completed) {
      isCompliant = false;
    }
  }

  return {
    locationSlug,
    shiftType,
    completedBy,
    isCompliant,
    logsJson: JSON.stringify(completedTasks),
    notes,
    completedAt: new Date().toISOString(),
  };
}

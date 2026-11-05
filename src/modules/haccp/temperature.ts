// MY GERMAN DÖNER — The one temperature rule (pure, safe in browser and server code).
// Limits follow EU Reg 852/2004 as already used by this app. Oliver's manual gives no numbers,
// so he still has to confirm them (see data/checklists).
export type HaccpTarget = "CHILLED" | "FROZEN" | "HOT_HOLDING";

export const HACCP_LIMITS: Record<HaccpTarget, { minC?: number; maxC?: number }> = {
  CHILLED: { minC: 0, maxC: 5 },
  HOT_HOLDING: { minC: 63 },
  FROZEN: { maxC: -18 },
};

const DANGER_ZONE = { aboveC: 5, belowC: 63 };

export function isHaccpTarget(value: unknown): value is HaccpTarget {
  return typeof value === "string" && Object.hasOwn(HACCP_LIMITS, value);
}

export function evaluateTemperature(target: HaccpTarget, temperature: number) {
  const { minC, maxC } = HACCP_LIMITS[target];
  const isCompliant = (minC === undefined || temperature >= minC) && (maxC === undefined || temperature <= maxC);
  const inDangerZone = temperature > DANGER_ZONE.aboveC && temperature < DANGER_ZONE.belowC;
  return { isCompliant, inDangerZone };
}

export function limitText(target: HaccpTarget): string {
  const { minC, maxC } = HACCP_LIMITS[target];
  if (minC !== undefined && maxC !== undefined) return `${minC} to ${maxC} °C`;
  return minC !== undefined ? `${minC} °C or above` : `${maxC} °C or below`;
}

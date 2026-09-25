// MY GERMAN DÖNER — In-Store Dynamic Kitchen Wait Time Estimator Engine
import { KitchenLoadDiagnostics } from "./cx-wait.schema";

export interface WaitEstimateCalculationInput {
  activeTicketsCount: number;
  charcoalGrillCount?: number;
  activeLineCooks?: number;
}

/**
 * Computes dynamic wait time based on kitchen throughput parameters:
 * Estimated = Base (3m) + (Tickets * 1.2) + (Grill * 2.0) - (Cooks * 1.5)
 */
export function calculateKitchenWaitTime(input: WaitEstimateCalculationInput): KitchenLoadDiagnostics {
  const activeTickets = Math.max(0, input.activeTicketsCount);
  const grillItems = Math.max(0, input.charcoalGrillCount ?? Math.floor(activeTickets * 0.7));
  const activeCooks = Math.max(1, input.activeLineCooks ?? 2);

  const baseMinutes = 3.0;
  const ticketWeight = activeTickets * 1.2;
  const grillWeight = grillItems * 2.0;
  const cookRelief = activeCooks * 1.5;

  const rawEstimated = baseMinutes + ticketWeight + grillWeight - cookRelief;

  // Clamp between 3 and 25 minutes
  const clampedMinutes = Math.min(25, Math.max(3, Math.round(rawEstimated)));

  const estimatedWaitMinutesMin = Math.max(2, clampedMinutes - 1);
  const estimatedWaitMinutesMax = clampedMinutes + 2;

  let speedCategory: KitchenLoadDiagnostics["speedCategory"] = "OPTIMAL";
  if (clampedMinutes <= 4) speedCategory = "FAST";
  else if (clampedMinutes <= 8) speedCategory = "OPTIMAL";
  else if (clampedMinutes <= 14) speedCategory = "RUSH";
  else speedCategory = "EXTREME";

  const turnaroundAvgMinutes = Number((3.5 + activeTickets * 0.25).toFixed(1));

  return {
    activeTicketsCount: activeTickets,
    charcoalGrillCount: grillItems,
    activeLineCooks: activeCooks,
    estimatedWaitMinutesMin,
    estimatedWaitMinutesMax,
    turnaroundAvgMinutes,
    speedCategory,
  };
}

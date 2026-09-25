import { z } from "zod";

export const QueueTicketItemSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  shortNumber: z.string(),
  status: z.enum(["NEW", "PREPARING", "READY", "COMPLETED"]),
  createdAt: z.string(),
  elapsedSeconds: z.number().default(0),
  counterNumber: z.number().default(1),
  itemsSummary: z.string().optional(),
});
export type QueueTicketItem = z.infer<typeof QueueTicketItemSchema>;

export const KitchenLoadDiagnosticsSchema = z.object({
  activeTicketsCount: z.number().nonnegative(),
  charcoalGrillCount: z.number().nonnegative(),
  activeLineCooks: z.number().positive().default(2),
  estimatedWaitMinutesMin: z.number().positive(),
  estimatedWaitMinutesMax: z.number().positive(),
  turnaroundAvgMinutes: z.number().positive(),
  speedCategory: z.enum(["FAST", "OPTIMAL", "RUSH", "EXTREME"]),
});
export type KitchenLoadDiagnostics = z.infer<typeof KitchenLoadDiagnosticsSchema>;

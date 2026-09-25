import { z } from "zod";

export const PrinterStationSchema = z.enum(["INDOOR", "GRILL", "BOTH"]);
export type PrinterStation = z.infer<typeof PrinterStationSchema>;

export const PrinterConfigSchema = z.object({
  host: z.string().ip().or(z.string().min(1)),
  port: z.number().int().min(1).max(65535).default(9100),
  timeoutMs: z.number().int().min(500).max(10000).default(3000),
});
export type PrinterConfig = z.infer<typeof PrinterConfigSchema>;

export const ThermalChitItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  meatWeightGrams: z.number().optional(),
  spiceLevel: z.number().int().min(1).max(5).optional(),
  breadType: z.string().optional(),
  additions: z.array(z.string()).default([]),
  omissions: z.array(z.string()).default([]),
  sauces: z.array(z.string()).default([]),
  notes: z.string().optional(),
  stationTarget: PrinterStationSchema.default("INDOOR"),
});
export type ThermalChitItem = z.infer<typeof ThermalChitItemSchema>;

export const ThermalChitPayloadSchema = z.object({
  orderNumber: z.string().min(1),
  dailySequence: z.number().int().positive(),
  orderType: z.enum(["DINE_IN", "TAKE_AWAY", "DELIVERY"]),
  locationSlug: z.enum(["EMBA", "LIMASSOL"]),
  createdAt: z.string().datetime().or(z.string().min(1)),
  customerNote: z.string().optional(),
  items: z.array(ThermalChitItemSchema).min(1),
});
export type ThermalChitPayload = z.infer<typeof ThermalChitPayloadSchema>;

export const PrintJobResultSchema = z.object({
  success: z.boolean(),
  station: z.enum(["INDOOR", "GRILL"]),
  bytesWritten: z.number().int().nonnegative(),
  error: z.string().optional(),
  bufferedForRetry: z.boolean().optional(),
});
export type PrintJobResult = z.infer<typeof PrintJobResultSchema>;

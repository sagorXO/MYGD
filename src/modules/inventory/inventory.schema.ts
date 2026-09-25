import { z } from "zod";

export const SpitMountLogSchema = z.object({
  id: z.string(),
  locationSlug: z.enum(["EMBA", "LIMASSOL"]).default("EMBA"),
  spitNumber: z.number().int().positive().default(1),
  meatType: z.enum(["BEEF_VEAL", "CHICKEN"]).default("BEEF_VEAL"),
  initialWeightKg: z.number().positive(),
  carvedGrams: z.number().nonnegative().default(0),
  remainingWeightKg: z.number().nonnegative(),
  mountedAt: z.string(),
  mountedByPin: z.string().optional(),
  status: z.enum(["ACTIVE", "DEPLETED", "REMOVED"]).default("ACTIVE"),
});
export type SpitMountLog = z.infer<typeof SpitMountLogSchema>;

export const RestockIntakeRequestSchema = z.object({
  locationSlug: z.enum(["EMBA", "LIMASSOL"]).default("EMBA"),
  ingredientId: z.string().min(1),
  addedUnits: z.number().positive(),
  supplierInvoiceRef: z.string().optional(),
  loggedBy: z.string().default("Staff"),
});
export type RestockIntakeRequest = z.infer<typeof RestockIntakeRequestSchema>;

export const InventoryStockAlertSchema = z.object({
  ingredientId: z.string(),
  sku: z.string(),
  name: z.string(),
  currentStock: z.number(),
  minThreshold: z.number(),
  unit: z.string(),
  severity: z.enum(["CRITICAL", "WARNING"]),
  message: z.string(),
});
export type InventoryStockAlert = z.infer<typeof InventoryStockAlertSchema>;

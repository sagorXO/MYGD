import { z } from "zod";

export const StaffRoleSchema = z.enum(["CASHIER", "GRILL_MASTER", "ASSEMBLER", "MANAGER"]);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const PinClockActionSchema = z.object({
  locationSlug: z.enum(["EMBA", "LIMASSOL"]).default("EMBA"),
  staffId: z.string().min(1),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  action: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  role: StaffRoleSchema.default("CASHIER"),
});
export type PinClockAction = z.infer<typeof PinClockActionSchema>;

export const HACCPTargetTypeSchema = z.enum(["CHILLED", "FROZEN", "HOT_HOLDING"]);
export type HACCPTargetType = z.infer<typeof HACCPTargetTypeSchema>;

export const HACCPLogRequestSchema = z.object({
  locationSlug: z.enum(["EMBA", "LIMASSOL"]).default("EMBA"),
  equipmentName: z.string().min(1),
  targetType: HACCPTargetTypeSchema,
  temperature: z.number(),
  loggedBy: z.string().min(1),
  correctiveAction: z.string().optional(),
});
export type HACCPLogRequest = z.infer<typeof HACCPLogRequestSchema>;

export const HACCPValidationResultSchema = z.object({
  isCompliant: z.boolean(),
  inDangerZone: z.boolean(),
  message: z.string(),
  correctiveActionRequired: z.boolean(),
  targetMin: z.number(),
  targetMax: z.number(),
});
export type HACCPValidationResult = z.infer<typeof HACCPValidationResultSchema>;

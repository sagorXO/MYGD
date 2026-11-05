// MY GERMAN DÖNER — Checklist API input validation.
import { z } from "zod";

const text = z.string().trim().max(500);
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
// Plausible probe range; anything outside is a typing mistake.
const Temperature = z.number().min(-60).max(300);

export const EntryInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("DONE"), temperature: Temperature.optional(), correctiveAction: text.optional() }),
  z.object({ action: z.literal("UNDO") }),
  z.object({ action: z.literal("ISSUE"), note: text.optional() }),
  z.object({ action: z.literal("CLEAR_ISSUE") }),
  z.object({ action: z.literal("NOTE"), note: text }),
]);

export const PhaseSchema = z.enum(["OPENING", "DURING_SHIFT", "CLOSING"]);

export const FinishSchema = z.object({
  station: z.string().regex(/^[A-Z][A-Z0-9_]{0,40}$/),
  phase: PhaseSchema,
});

export const OpeningTimeSchema = z.object({ openingTime: z.string().regex(CLOCK) });

export const StockCountSchema = z
  .object({
    stockItemId: z.string().min(1).max(64),
    count: z.number().min(0).max(100000).nullable().optional(),
    status: z.enum(["OK", "LOW", "OUT"]).nullable().optional(),
  })
  .refine((v) => v.count !== undefined || v.status !== undefined, { message: "Nothing to save." });

export const HaccpReadingSchema = z.object({
  equipmentName: z.string().trim().min(1).max(120),
  targetType: z.enum(["CHILLED", "FROZEN", "HOT_HOLDING"]),
  temperature: Temperature,
  correctiveAction: text.optional(),
});

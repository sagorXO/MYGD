import { z } from "zod";

export const KDSTicketStatusSchema = z.enum([
  "QUEUED",
  "NEW",
  "IN_PREPARATION",
  "PREPARING",
  "READY",
  "COMPLETED",
  "VOIDED",
]);
export type KDSTicketStatus = z.infer<typeof KDSTicketStatusSchema>;

export const KDSStationSchema = z.enum(["ALL", "GRILL", "ASSEMBLY", "FRYER"]);
export type KDSStation = z.infer<typeof KDSStationSchema>;

export const KDSTicketItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive().default(1),
  spiceLevel: z.number().int().min(1).max(5).default(1),
  meatWeightGrams: z.number().optional(),
  breadType: z.string().optional(),
  sauces: z.array(z.string()).default([]),
  additions: z.array(z.string()).default([]),
  omissions: z.array(z.string()).default([]),
  notes: z.string().optional(),
  station: z.enum(["INDOOR", "GRILL", "BOTH"]).default("BOTH"),
});
export type KDSTicketItem = z.infer<typeof KDSTicketItemSchema>;

export const KDSTicketSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  orderType: z.enum(["DINE_IN", "TAKE_AWAY", "DELIVERY"]),
  station: KDSStationSchema,
  status: KDSTicketStatusSchema,
  isRush: z.boolean().default(false),
  claimedBy: z.string().optional(),
  items: z.array(KDSTicketItemSchema),
  customerNote: z.string().optional(),
  createdAt: z.string(),
  elapsedSeconds: z.number().nonnegative().default(0),
});
export type KDSTicket = z.infer<typeof KDSTicketSchema>;

export const BumpTicketRequestSchema = z.object({
  ticketId: z.string().min(1),
  status: KDSTicketStatusSchema,
  claimedBy: z.string().default("Cook"),
});
export type BumpTicketRequest = z.infer<typeof BumpTicketRequestSchema>;

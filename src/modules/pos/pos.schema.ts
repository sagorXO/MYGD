// MY GERMAN DÖNER — POS Module Zod Schemas
import { z } from "zod";

export const POSModifierTypeSchema = z.enum(["ADDITION", "OMISSION"]);
export type POSModifierType = z.infer<typeof POSModifierTypeSchema>;

export const POSModifierSelectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: POSModifierTypeSchema,
  priceAdjustment: z.number().default(0.0),
  category: z.enum(["CHEESE", "MEAT", "SAUCE", "SALAD", "EXTRA"]).default("EXTRA"),
});
export type POSModifierSelection = z.infer<typeof POSModifierSelectionSchema>;

export const POSCartLineSchema = z.object({
  lineId: z.string(),
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  basePrice: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  spiceLevel: z.number().int().min(1).max(5).default(1),
  breadType: z.string().optional(),
  selectedAdditions: z.array(POSModifierSelectionSchema).default([]),
  selectedOmissions: z.array(z.string()).default([]),
  selectedSauces: z.array(z.string()).default([]),
  notes: z.string().optional(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
});
export type POSCartLine = z.infer<typeof POSCartLineSchema>;

export const POSOrderTenderSchema = z.object({
  locationSlug: z.enum(["EMBA", "LIMASSOL"]).default("EMBA"),
  terminalCode: z.string().default("POS-01"),
  orderType: z.enum(["DINE_IN", "TAKE_AWAY"]).default("DINE_IN"),
  paymentMethod: z.enum(["CARD", "CASH", "NFC_WALLET"]).default("CARD"),
  discountPercent: z.number().min(0).max(100).default(0),
  cashTendered: z.number().optional(),
  customerNote: z.string().optional(),
  lines: z.array(POSCartLineSchema).min(1, "Cart cannot be empty"),
});
export type POSOrderTender = z.infer<typeof POSOrderTenderSchema>;

export const Link4PayTerminalRequestSchema = z.object({
  amountEUR: z.number().positive(),
  currency: z.literal("EUR").default("EUR"),
  orderRef: z.string().min(1),
  terminalIp: z.string().optional(),
  timeoutSec: z.number().int().min(10).max(120).default(60),
});
export type Link4PayTerminalRequest = z.infer<typeof Link4PayTerminalRequestSchema>;

export const Link4PayTerminalResponseSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
  authCode: z.string().optional(),
  cardScheme: z.string().optional(), // "VISA", "MASTERCARD", "APPLE_PAY"
  maskedPan: z.string().optional(),   // "**** **** **** 1234"
  error: z.string().optional(),
});
export type Link4PayTerminalResponse = z.infer<typeof Link4PayTerminalResponseSchema>;

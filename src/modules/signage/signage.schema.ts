import { z } from "zod";

export const SignageDaypartSchema = z.enum(["AUTO", "LUNCH", "DINNER", "LATE_NIGHT", "MORNING"]);
export type SignageDaypart = z.infer<typeof SignageDaypartSchema>;

export const SignageItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  nameDE: z.string().optional(),
  description: z.string().optional(),
  priceEUR: z.number().positive(),
  largePriceEUR: z.number().optional(),
  badge: z.string().optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
  modifiers: z.array(z.string()).optional(),
  calories: z.number().optional(),
  section: z.string().optional(),
  sectionNote: z.string().optional(),
});
export type SignageItem = z.infer<typeof SignageItemSchema>;

export const SignageScreenConfigSchema = z.object({
  screenNumber: z.number().int().min(1).max(7),
  title: z.string(),
  subtitle: z.string().optional(),
  layoutType: z.enum(["PROMO_HERO", "PRICE_MATRIX", "SPLIT_COMBO", "DRINKS_SIDES"]),
  activeDaypart: SignageDaypartSchema.default("AUTO"),
  items: z.array(SignageItemSchema),
  bannerMessage: z.string().optional(),
  updatedAt: z.string(),
});
export type SignageScreenConfig = z.infer<typeof SignageScreenConfigSchema>;

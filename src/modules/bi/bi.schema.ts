import { z } from "zod";

export const StoreRevenueMetricsSchema = z.object({
  locationSlug: z.enum(["EMBA", "LIMASSOL"]),
  storeName: z.string(),
  orderCount: z.number().int().nonnegative(),
  grossRevenueEUR: z.number().nonnegative(),
  netRevenueEUR: z.number().nonnegative(),
  vatAmountEUR: z.number().nonnegative(),
  cardRevenueEUR: z.number().nonnegative(),
  cashRevenueEUR: z.number().nonnegative(),
  avgTicketEUR: z.number().nonnegative(),
  avgSpeedOfServiceMinutes: z.number().positive(),
});
export type StoreRevenueMetrics = z.infer<typeof StoreRevenueMetricsSchema>;

export const CrossStoreReportSchema = z.object({
  generatedAt: z.string(),
  totalGrossEUR: z.number().nonnegative(),
  totalNetEUR: z.number().nonnegative(),
  totalVatEUR: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  overallAvgTurnaroundMinutes: z.number().positive(),
  stores: z.array(StoreRevenueMetricsSchema),
});
export type CrossStoreReport = z.infer<typeof CrossStoreReportSchema>;

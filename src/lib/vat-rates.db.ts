// MY GERMAN DÖNER — VAT rates from the database (server only)
import { prisma } from "./prisma";
import { loadVatRates } from "./vat-rates";
import type { VatCategory } from "./tax";

/** VAT rates (basis points) in force at `at`, read from the VatRate table. Throws if one is missing. */
export function getVatRates(at: Date = new Date()): Promise<Record<VatCategory, number>> {
  return loadVatRates({ vatRate: { findMany: (query) => prisma.vatRate.findMany(query) } }, at);
}

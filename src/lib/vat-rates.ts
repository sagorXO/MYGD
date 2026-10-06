// MY GERMAN DÖNER — VAT rate lookup from the VatRate table (PRD M11.4, P.8)
//
// Pure selection logic plus a loader that takes the database client as an argument, so it can be
// tested without a database. The Prisma-backed loader is in vat-rates.db.ts.

import { rateToBp, VAT_CATEGORIES, type VatCategory } from "./tax";

export interface VatRateRow {
  category: VatCategory;
  /** A Decimal(5,4) fraction as stored: "0.0900" means 9%. */
  rate: string | number | { toString(): string };
  validFrom: Date;
  validTo: Date | null;
}

export interface VatRateQuery {
  where: {
    validFrom: { lte: Date };
    OR: [{ validTo: null }, { validTo: { gt: Date } }];
  };
  orderBy: { validFrom: "desc" };
}

export interface VatRateDb {
  vatRate: {
    findMany(query: VatRateQuery): Promise<readonly VatRateRow[]>;
  };
}

/** Rates in effect at `at` for every category. Throws when a category has none (no defaults). */
export function selectEffectiveRates(rows: readonly VatRateRow[], at: Date): Record<VatCategory, number> {
  const moment = at.getTime();
  const result = {} as Record<VatCategory, number>;

  for (const category of VAT_CATEGORIES) {
    const current = rows
      .filter((row) => row.category === category)
      .filter((row) => row.validFrom.getTime() <= moment)
      .filter((row) => row.validTo === null || row.validTo.getTime() > moment)
      .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];

    if (!current) {
      throw new Error(`No VAT rate in effect for category ${category} at ${at.toISOString()}`);
    }
    result[category] = rateToBp(current.rate.toString());
  }
  return result;
}

export async function loadVatRates(db: VatRateDb, at: Date = new Date()): Promise<Record<VatCategory, number>> {
  const rows = await db.vatRate.findMany({
    where: { validFrom: { lte: at }, OR: [{ validTo: null }, { validTo: { gt: at } }] },
    orderBy: { validFrom: "desc" },
  });
  return selectEffectiveRates(rows, at);
}

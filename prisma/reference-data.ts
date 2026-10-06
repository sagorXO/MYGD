// MY GERMAN DÖNER — Production reference data (PRD P.8)
//
// This file is the ONLY place VAT rates are written out. At runtime the application reads them from
// the VatRate table (src/lib/vat-rates.db.ts); changing a rate means adding a new row with a new
// validFrom, never editing code.

import type { VatCategory } from "@prisma/client";

export interface VatRateSeed {
  category: VatCategory;
  /** Decimal(5,4) fraction: "0.0900" is 9%. */
  rate: string;
  validFrom: Date;
  note: string;
}

/** Contract Revision 3.1, effective 2026-08-24. Accountant to confirm [OPEN Q-VAT-1]; a 5% rate is not seeded [OPEN Q-VAT-4]. */
const MSA_REV_3_1_EFFECTIVE = new Date("2026-08-24T00:00:00.000Z");

export const VAT_RATE_SEED: readonly VatRateSeed[] = [
  { category: "FOOD_BEV", rate: "0.0900", validFrom: MSA_REV_3_1_EFFECTIVE, note: "MSA §3.4: food, dine-in, takeaway and non-alcoholic drinks" },
  { category: "ALCOHOL", rate: "0.1900", validFrom: MSA_REV_3_1_EFFECTIVE, note: "MSA §3.4: alcoholic drinks" },
  { category: "ZERO", rate: "0.0000", validFrom: MSA_REV_3_1_EFFECTIVE, note: "Zero-rated items" },
];

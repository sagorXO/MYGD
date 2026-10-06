// MY GERMAN DÖNER — VAT arithmetic (pure; rates are injected, never hard-coded)
//
// [ADR] Context: VAT rates were typed into code in six places (a 19% default, a /1.19 divisor,
//   a per-location rate column) and contradicted the signed contract (9% food, 19% alcohol).
// Decision: rates live in the VatRate table (M11.4), are loaded by category and date
//   (src/lib/vat-rates.ts) and passed into these pure functions as basis points (900 = 9%).
//   A missing rate throws; there is no default rate. Prices are VAT-inclusive (gross); VAT is
//   extracted per line, rounded half up to the cent (rounding policy per Q-VAT-3).
// Consequence: a rate change is a data change with history; mixed-rate orders are exact;
//   tests inject their own synthetic rates.

import { sumCents, type Cents } from "./money";

export type VatCategory = "FOOD_BEV" | "ALCOHOL" | "ZERO";

export const VAT_CATEGORIES: readonly VatCategory[] = ["FOOD_BEV", "ALCOHOL", "ZERO"];

/** VAT rates in basis points (1/100 of a percent): 900 means 9.00%. */
export type VatRatesBp = Readonly<Partial<Record<VatCategory, number>>>;

export interface GrossSplit {
  netCents: Cents;
  vatCents: Cents;
}

export interface TaxableLine {
  grossCents: Cents;
  category: VatCategory;
}

export interface CategoryTax {
  rateBp: number | null;
  grossCents: Cents;
  netCents: Cents;
  vatCents: Cents;
}

export interface OrderTax {
  grossCents: Cents;
  netCents: Cents;
  vatCents: Cents;
  byCategory: Record<VatCategory, CategoryTax>;
}

const RATE_DECIMALS = 4;
const BASIS_POINTS = 10 ** RATE_DECIMALS;

/** Reads a VAT rate as stored in the database (a fraction with up to 4 decimals) as basis points. */
export function rateToBp(value: string | number): number {
  const text = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) throw new TypeError(`Not a VAT rate: "${value}"`);
  if (text.startsWith("-")) throw new RangeError(`VAT rate cannot be negative: "${value}"`);
  const [whole, fraction = ""] = text.split(".");
  if (/[^0]/.test(fraction.slice(RATE_DECIMALS))) {
    throw new RangeError(`VAT rate has more than ${RATE_DECIMALS} decimal places: "${value}"`);
  }
  const bp = Number(whole) * BASIS_POINTS + Number(fraction.slice(0, RATE_DECIMALS).padEnd(RATE_DECIMALS, "0"));
  if (bp > BASIS_POINTS) throw new RangeError(`VAT rate cannot exceed 100%: "${value}"`);
  return bp;
}

/** Writes basis points back as the Decimal(5,4) string the database stores ("0.0900"). */
export function bpToRate(bp: number): string {
  if (!Number.isInteger(bp) || bp < 0) throw new RangeError(`rate must be a non-negative integer in basis points, got ${bp}`);
  if (bp > BASIS_POINTS) throw new RangeError(`VAT rate cannot exceed 100%, got ${bp} basis points`);
  return `${Math.trunc(bp / BASIS_POINTS)}.${String(bp % BASIS_POINTS).padStart(RATE_DECIMALS, "0")}`;
}

/** The configured rate for a category. Throws when none is configured: there is no default. */
export function rateOf(rates: VatRatesBp, category: VatCategory): number {
  const rate = rates[category];
  if (rate === undefined) throw new Error(`No VAT rate configured for category ${category}`);
  return rate;
}

/**
 * Splits a VAT-inclusive amount into net and VAT.
 * net = gross / (1 + rate), rounded half up (symmetric for negative amounts); vat = gross - net.
 */
export function splitGross(grossCents: Cents, rateBp: number): GrossSplit {
  if (!Number.isInteger(grossCents)) throw new TypeError(`gross must be an integer number of cents, got ${grossCents}`);
  if (!Number.isInteger(rateBp) || rateBp < 0) throw new RangeError(`rate must be a non-negative integer in basis points, got ${rateBp}`);
  const sign = grossCents < 0 ? -1 : 1;
  const gross = Math.abs(grossCents);
  const divisor = BASIS_POINTS + rateBp;
  const net = Math.floor((gross * BASIS_POINTS * 2 + divisor) / (2 * divisor));
  const vat = gross - net;
  return { netCents: sign * net === 0 ? 0 : sign * net, vatCents: sign * vat === 0 ? 0 : sign * vat };
}

/** Order-level breakdown: VAT is extracted per line, then summed per category and overall. */
export function calculateOrderTax(lines: readonly TaxableLine[], rates: VatRatesBp): OrderTax {
  const byCategory = Object.fromEntries(
    VAT_CATEGORIES.map((category) => [
      category,
      { rateBp: rates[category] ?? null, grossCents: 0, netCents: 0, vatCents: 0 } satisfies CategoryTax,
    ]),
  ) as Record<VatCategory, CategoryTax>;

  for (const line of lines) {
    const split = splitGross(line.grossCents, rateOf(rates, line.category));
    const bucket = byCategory[line.category];
    bucket.grossCents += line.grossCents;
    bucket.netCents += split.netCents;
    bucket.vatCents += split.vatCents;
  }

  const buckets = VAT_CATEGORIES.map((category) => byCategory[category]);
  return {
    grossCents: sumCents(buckets.map((bucket) => bucket.grossCents)),
    netCents: sumCents(buckets.map((bucket) => bucket.netCents)),
    vatCents: sumCents(buckets.map((bucket) => bucket.vatCents)),
    byCategory,
  };
}

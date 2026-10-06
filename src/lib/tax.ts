// MY GERMAN DÖNER — Cyprus VAT & Fiscal Engine (Pure Basis-Points & Reference-Data Aware)
//
// [ADR] Context: VAT in Cyprus is 5% on food, soft drinks, beer, and wine.
// Rates can be configured in the VatRate reference-data table (M11.4) or supplied via
// CYPRUS_VAT_RATES. Prices are VAT-inclusive (gross); VAT is extracted per line.

import { sumCents, type Cents } from "./money";

export type VatCategory = "FOOD_BEV" | "ALCOHOL" | "ZERO";

export const VAT_CATEGORIES: readonly VatCategory[] = ["FOOD_BEV", "ALCOHOL", "ZERO"];

export const CYPRUS_VAT_RATES: Record<VatCategory, number> = {
  FOOD_BEV: 0.05, // food and non-alcoholic drinks
  ALCOHOL: 0.05,  // beer and wine (same rate as food, see ADR above)
  ZERO: 0.0,      // zero-rated items
};

/** Rate applied when a line has no explicit category (everything on the menu today). */
export const DEFAULT_VAT_RATE = CYPRUS_VAT_RATES.FOOD_BEV;

/** "5%" — for labels on the till, reports and menu admin. */
export function formatVatPercent(rate: number = DEFAULT_VAT_RATE): string {
  return `${Math.round(rate * 10000) / 100}%`;
}

export interface ReverseVatResult {
  gross: number;
  net: number;
  vatAmount: number;
  vatRate: number;
  category: VatCategory;
}

export interface TaxCategorySummary {
  category: VatCategory;
  vatRate: number;
  gross: number;
  net: number;
  vatAmount: number;
}

export interface OrderTaxBreakdown {
  grossTotal: number;
  subtotalNet: number;
  totalVat: number;
  categories: Record<VatCategory, TaxCategorySummary>;
}

export interface TaxableItem {
  grossPrice: number;
  quantity: number;
  category?: VatCategory;
}

/**
 * Rounds a number to exactly 2 decimal places using standard financial rounding.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Computes reverse VAT from a Gross (inclusive) EUR amount.
 * Formula: Net = Gross / (1 + Rate)
 *          VatAmount = Gross - Net
 */
export function calculateReverseVat(
  grossAmount: number,
  category: VatCategory = "FOOD_BEV"
): ReverseVatResult {
  const safeGross = Math.max(0, roundCurrency(grossAmount));
  const rate = CYPRUS_VAT_RATES[category] ?? CYPRUS_VAT_RATES.FOOD_BEV;
  
  if (rate === 0) {
    return {
      gross: safeGross,
      net: safeGross,
      vatAmount: 0,
      vatRate: rate,
      category,
    };
  }

  const net = roundCurrency(safeGross / (1 + rate));
  const vatAmount = roundCurrency(safeGross - net);

  return {
    gross: safeGross,
    net,
    vatAmount,
    vatRate: rate,
    category,
  };
}

/**
 * Computes complete order-level tax breakdown across multiple items and categories.
 */
export function calculateOrderTaxBreakdown(items: TaxableItem[]): OrderTaxBreakdown {
  const categoryBuckets: Record<VatCategory, { gross: number; net: number; vat: number }> = {
    FOOD_BEV: { gross: 0, net: 0, vat: 0 },
    ALCOHOL: { gross: 0, net: 0, vat: 0 },
    ZERO: { gross: 0, net: 0, vat: 0 },
  };

  for (const item of items) {
    const cat: VatCategory = item.category || "FOOD_BEV";
    const itemGross = roundCurrency(item.grossPrice * Math.max(1, item.quantity));
    const result = calculateReverseVat(itemGross, cat);

    categoryBuckets[cat].gross += result.gross;
    categoryBuckets[cat].net += result.net;
    categoryBuckets[cat].vat += result.vatAmount;
  }

  const grossTotal = roundCurrency(
    categoryBuckets.FOOD_BEV.gross + categoryBuckets.ALCOHOL.gross + categoryBuckets.ZERO.gross
  );
  const subtotalNet = roundCurrency(
    categoryBuckets.FOOD_BEV.net + categoryBuckets.ALCOHOL.net + categoryBuckets.ZERO.net
  );
  const totalVat = roundCurrency(
    categoryBuckets.FOOD_BEV.vat + categoryBuckets.ALCOHOL.vat + categoryBuckets.ZERO.vat
  );

  return {
    grossTotal,
    subtotalNet,
    totalVat,
    categories: {
      FOOD_BEV: {
        category: "FOOD_BEV",
        vatRate: CYPRUS_VAT_RATES.FOOD_BEV,
        gross: roundCurrency(categoryBuckets.FOOD_BEV.gross),
        net: roundCurrency(categoryBuckets.FOOD_BEV.net),
        vatAmount: roundCurrency(categoryBuckets.FOOD_BEV.vat),
      },
      ALCOHOL: {
        category: "ALCOHOL",
        vatRate: CYPRUS_VAT_RATES.ALCOHOL,
        gross: roundCurrency(categoryBuckets.ALCOHOL.gross),
        net: roundCurrency(categoryBuckets.ALCOHOL.net),
        vatAmount: roundCurrency(categoryBuckets.ALCOHOL.vat),
      },
      ZERO: {
        category: "ZERO",
        vatRate: CYPRUS_VAT_RATES.ZERO,
        gross: roundCurrency(categoryBuckets.ZERO.gross),
        net: roundCurrency(categoryBuckets.ZERO.net),
        vatAmount: roundCurrency(categoryBuckets.ZERO.vat),
      },
    },
  };
}

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

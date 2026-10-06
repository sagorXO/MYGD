// MY GERMAN DÖNER — Cyprus VAT & Fiscal Engine (WU 1.1)
//
// [ADR] Context: the owner confirmed VAT is 5% on everything sold (food, soft drinks, beer, wine),
// and the rate had been copied into the till, the order service, BI, the locales and the seed.
// Decision: this file is the only place a rate is written. Everything else imports it. The
// ALCOHOL category is kept (at 5% today) so a different rate for it is a one-line change here.
// Consequence: change CYPRUS_VAT_RATES and the till, receipts, reports and seed follow.
// - Food, soft drinks, beer, wine: 5% VAT
// - Zero Rated / Exempt: 0% VAT
// Note: In compliance with European consumer protection laws, all displayed and catalog prices are GROSS (VAT-inclusive).

export type VatCategory = 'FOOD_BEV' | 'ALCOHOL' | 'ZERO';

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
  category: VatCategory = 'FOOD_BEV'
): ReverseVatResult {
  const safeGross = Math.max(0, roundCurrency(grossAmount));
  const rate = CYPRUS_VAT_RATES[category] ?? CYPRUS_VAT_RATES.FOOD_BEV;
  
  if (rate === 0) {
    return {
      gross: safeGross,
      net: safeGross,
      vatAmount: 0,
      vatRate: 0,
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
    const cat: VatCategory = item.category || 'FOOD_BEV';
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
        category: 'FOOD_BEV',
        vatRate: CYPRUS_VAT_RATES.FOOD_BEV,
        gross: roundCurrency(categoryBuckets.FOOD_BEV.gross),
        net: roundCurrency(categoryBuckets.FOOD_BEV.net),
        vatAmount: roundCurrency(categoryBuckets.FOOD_BEV.vat),
      },
      ALCOHOL: {
        category: 'ALCOHOL',
        vatRate: CYPRUS_VAT_RATES.ALCOHOL,
        gross: roundCurrency(categoryBuckets.ALCOHOL.gross),
        net: roundCurrency(categoryBuckets.ALCOHOL.net),
        vatAmount: roundCurrency(categoryBuckets.ALCOHOL.vat),
      },
      ZERO: {
        category: 'ZERO',
        vatRate: CYPRUS_VAT_RATES.ZERO,
        gross: roundCurrency(categoryBuckets.ZERO.gross),
        net: roundCurrency(categoryBuckets.ZERO.net),
        vatAmount: roundCurrency(categoryBuckets.ZERO.vat),
      },
    },
  };
}

// MY GERMAN DÖNER — Cyprus VAT & Fiscal Engine (WU 1.1)
// EU / Cyprus Value Added Tax Compliance:
// - Food & Non-Alcoholic Beverages: 9% VAT (Reduced Rate)
// - Alcoholic Beverages & Standard Goods: 19% VAT (Standard Rate)
// - Zero Rated / Exempt: 0% VAT
// Note: In compliance with European consumer protection laws, all displayed and catalog prices are GROSS (VAT-inclusive).

export type VatCategory = 'FOOD_BEV' | 'ALCOHOL' | 'ZERO';

export const CYPRUS_VAT_RATES: Record<VatCategory, number> = {
  FOOD_BEV: 0.09, // 9% Cyprus reduced rate for food and catering/restaurant services
  ALCOHOL: 0.19,  // 19% Cyprus standard rate for beer, wine, and spirits
  ZERO: 0.00,     // 0% for zero-rated items
};

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

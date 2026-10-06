// MY GERMAN DÖNER — POS totals (pure): discount, then VAT, per line, in integer cents
//
// A discount is shared across the lines in proportion to their price (largest remainder), so each
// line's VAT is computed on what the customer actually pays for that line. This keeps mixed-rate
// orders exact: net + VAT always equals the total, and the lines always add up to the total.

import { allocateProportionally, percentOf, sumCents, type Cents } from "../../lib/money";
import { rateOf, splitGross, type VatCategory, type VatRatesBp } from "../../lib/tax";

export interface POSLineInput {
  totalPriceCents: Cents;
  category: VatCategory;
}

export interface POSTotalsInput {
  lines: readonly POSLineInput[];
  /** 0 to 100, at most 2 decimals. */
  discountPercent: number;
  rates: VatRatesBp;
}

export interface POSLineTotals {
  category: VatCategory;
  rateBp: number;
  /** What the customer pays for this line after its share of the discount. */
  grossCents: Cents;
  netCents: Cents;
  vatCents: Cents;
}

export interface POSTotals {
  grossSubtotalCents: Cents;
  discountCents: Cents;
  totalCents: Cents;
  netCents: Cents;
  vatCents: Cents;
  lines: POSLineTotals[];
}

export function computePOSTotals(input: POSTotalsInput): POSTotals {
  const { lines, discountPercent, rates } = input;
  if (lines.length === 0) throw new RangeError("Cart cannot be empty");
  for (const line of lines) {
    if (!Number.isInteger(line.totalPriceCents) || line.totalPriceCents < 0) {
      throw new RangeError(`Line price must be a non-negative integer number of cents, got ${line.totalPriceCents}`);
    }
  }

  const grossSubtotalCents = sumCents(lines.map((line) => line.totalPriceCents));
  const discountCents = percentOf(grossSubtotalCents, discountPercent);
  const discountShares = allocateProportionally(
    discountCents,
    lines.map((line) => line.totalPriceCents),
  );

  const computed = lines.map((line, index): POSLineTotals => {
    const rateBp = rateOf(rates, line.category);
    const grossCents = line.totalPriceCents - discountShares[index];
    const { netCents, vatCents } = splitGross(grossCents, rateBp);
    return { category: line.category, rateBp, grossCents, netCents, vatCents };
  });

  return {
    grossSubtotalCents,
    discountCents,
    totalCents: sumCents(computed.map((line) => line.grossCents)),
    netCents: sumCents(computed.map((line) => line.netCents)),
    vatCents: sumCents(computed.map((line) => line.vatCents)),
    lines: computed,
  };
}

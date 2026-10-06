// MY GERMAN DÖNER — POS order pricing (dependencies injected, no database import)
//
// Turns a validated tender request into exact totals: the VAT category of every line comes from the
// product record (never from the client), the rates come from the rate loader (read once per order),
// the discount is shared per line, and cash change is computed in whole cents.

import { centsToDecimalString, toCents, type Cents } from "../../lib/money";
import type { VatCategory, VatRatesBp } from "../../lib/tax";
import type { POSOrderTender } from "./pos.schema";
import { computePOSTotals, type POSTotals } from "./pos.totals";

export interface PricingDeps {
  findProductCategories(productIds: string[]): Promise<ReadonlyArray<{ id: string; vatCategory: VatCategory }>>;
  loadRates(): Promise<VatRatesBp>;
}

export interface PricedLine {
  productId: string;
  vatCategory: VatCategory;
  rateBp: number;
  baseUnitCents: Cents;
  /** Price of the line before any discount. */
  listPriceCents: Cents;
  /** What the customer pays for the line after its share of the discount. */
  grossCents: Cents;
  netCents: Cents;
  vatCents: Cents;
}

export interface PricedOrder {
  totals: POSTotals;
  lines: PricedLine[];
  changeDueCents: Cents;
}

export async function priceTender(order: POSOrderTender, deps: PricingDeps): Promise<PricedOrder> {
  const productIds = [...new Set(order.lines.map((line) => line.productId))];
  const [products, rates] = await Promise.all([deps.findProductCategories(productIds), deps.loadRates()]);

  const categoryById = new Map(products.map((product) => [product.id, product.vatCategory]));
  const unknown = productIds.filter((id) => !categoryById.has(id));
  if (unknown.length > 0) throw new Error(`Unknown product: ${unknown.join(", ")}`);

  const totals = computePOSTotals({
    lines: order.lines.map((line) => ({
      totalPriceCents: toCents(line.totalPrice),
      category: categoryById.get(line.productId) as VatCategory,
    })),
    discountPercent: order.discountPercent,
    rates,
  });

  let changeDueCents = 0;
  if (order.paymentMethod === "CASH" && order.cashTendered !== undefined) {
    const tenderedCents = toCents(order.cashTendered);
    if (tenderedCents < totals.totalCents) {
      throw new Error(
        `Insufficient cash tendered: received €${centsToDecimalString(tenderedCents)}, required €${centsToDecimalString(totals.totalCents)}`,
      );
    }
    changeDueCents = tenderedCents - totals.totalCents;
  }

  const lines = order.lines.map((line, index): PricedLine => {
    const computed = totals.lines[index];
    return {
      productId: line.productId,
      vatCategory: computed.category,
      rateBp: computed.rateBp,
      baseUnitCents: toCents(line.basePrice),
      listPriceCents: toCents(line.totalPrice),
      grossCents: computed.grossCents,
      netCents: computed.netCents,
      vatCents: computed.vatCents,
    };
  });

  return { totals, lines, changeDueCents };
}

// MY GERMAN DÖNER — Discount, promotion and voucher engine.
//
// [ADR] Context: the till only had one flat "discountPercent" typed by staff; menu offers
// (2nd pizza 20% off, 4 tacos for €11.90) and vouchers were not modelled.
// Decision: one pure, side-effect-free engine in integer cents. Order of application:
// automatic promotions -> voucher / gift card -> staff percent. Each step only sees what the
// previous step left, so discounts can never push the total below zero.
// Consequence: the same function prices the cart on the till (preview) and on the server
// (the charged amount); the database only stores the outcome (see POSService.tenderOrder).

import type { PromotionDef } from "../menu/mygd-menu";

export interface CartLine {
  readonly sku: string;
  readonly sectionSlug: string;
  readonly unitPrice: number;
  readonly quantity: number;
}

export type VoucherKind = "PERCENT" | "FIXED" | "GIFT_CARD";

export interface VoucherInput {
  readonly code: string;
  readonly kind: VoucherKind;
  /** Percent (0-100) for PERCENT, euro amount for FIXED. Unused for GIFT_CARD. */
  readonly value: number;
  readonly isActive: boolean;
  readonly minSubtotal: number;
  readonly validFrom: string | Date | null;
  readonly validUntil: string | Date | null;
  readonly maxRedemptions: number | null;
  readonly redemptions: number;
  /** Remaining euro balance (GIFT_CARD only). */
  readonly balance: number | null;
}

export type VoucherRejection =
  | "INACTIVE" | "NOT_YET_VALID" | "EXPIRED" | "USED_UP" | "MIN_SUBTOTAL" | "NO_BALANCE";

export type VoucherCheck = { readonly ok: true } | { readonly ok: false; readonly reason: VoucherRejection };

export interface AppliedPromotion {
  readonly code: string;
  readonly name: string;
  readonly amount: number;
}

export interface AppliedVoucher {
  readonly code: string;
  readonly amount: number;
  readonly balanceAfter?: number;
  readonly rejectedReason?: VoucherRejection;
}

export interface PricedCart {
  readonly subtotal: number;
  readonly discounts: readonly AppliedPromotion[];
  readonly voucher?: AppliedVoucher;
  readonly manual?: { readonly percent: number; readonly amount: number };
  readonly discountTotal: number;
  readonly total: number;
}

export interface PriceCartInput {
  readonly lines: readonly CartLine[];
  readonly promotions: readonly PromotionDef[];
  readonly voucher?: VoucherInput;
  readonly manualPercent?: number;
  readonly now?: Date;
}

const toCents = (euro: number): number => Math.round(euro * 100);
const toEuro = (cents: number): number => cents / 100;

export function validateVoucher(voucher: VoucherInput, subtotal: number, now: Date = new Date()): VoucherCheck {
  if (!voucher.isActive) return { ok: false, reason: "INACTIVE" };
  if (voucher.validFrom && new Date(voucher.validFrom) > now) return { ok: false, reason: "NOT_YET_VALID" };
  if (voucher.validUntil && new Date(voucher.validUntil) < now) return { ok: false, reason: "EXPIRED" };
  if (voucher.maxRedemptions !== null && voucher.redemptions >= voucher.maxRedemptions) return { ok: false, reason: "USED_UP" };
  if (toCents(subtotal) < toCents(voucher.minSubtotal)) return { ok: false, reason: "MIN_SUBTOTAL" };
  if (voucher.kind === "GIFT_CARD" && toCents(voucher.balance ?? 0) <= 0) return { ok: false, reason: "NO_BALANCE" };
  return { ok: true };
}

/** One entry per physical unit, most expensive first. */
function unitsOf(lines: readonly CartLine[], sectionSlug: string): number[] {
  return lines
    .filter((l) => l.sectionSlug === sectionSlug)
    .flatMap((l) => Array.from({ length: Math.max(0, Math.floor(l.quantity)) }, () => toCents(l.unitPrice)))
    .sort((a, b) => b - a);
}

function promotionCents(promotion: PromotionDef, lines: readonly CartLine[]): number {
  const rule = promotion.rule;
  const units = unitsOf(lines, rule.sectionSlug);
  if (rule.type === "NTH_ITEM_PERCENT") {
    // Pair units from most to least expensive; the nth (cheaper) unit of every group is discounted.
    let total = 0;
    for (let i = rule.nth - 1; i < units.length; i += rule.nth) {
      total += Math.round((units[i] * rule.percent) / 100);
    }
    return total;
  }
  // BUNDLE_PRICE: every full group of `quantity` units costs `bundlePrice` (never more than its parts).
  let total = 0;
  const bundle = toCents(rule.bundlePrice);
  for (let i = 0; i + rule.quantity <= units.length; i += rule.quantity) {
    const group = units.slice(i, i + rule.quantity).reduce((s, c) => s + c, 0);
    total += Math.max(0, group - bundle);
  }
  return total;
}

export function priceCart(input: PriceCartInput): PricedCart {
  const now = input.now ?? new Date();
  const subtotalCents = input.lines.reduce((s, l) => s + toCents(l.unitPrice) * Math.max(0, Math.floor(l.quantity)), 0);
  let remaining = subtotalCents;

  const discounts: AppliedPromotion[] = [];
  for (const promotion of input.promotions) {
    const cents = Math.min(remaining, promotionCents(promotion, input.lines));
    if (cents > 0) {
      discounts.push({ code: promotion.code, name: promotion.name, amount: toEuro(cents) });
      remaining -= cents;
    }
  }

  let voucher: AppliedVoucher | undefined;
  if (input.voucher) {
    const v = input.voucher;
    const check = validateVoucher(v, toEuro(remaining), now);
    if (!check.ok) {
      voucher = { code: v.code, amount: 0, rejectedReason: check.reason };
    } else {
      let cents: number;
      if (v.kind === "PERCENT") cents = Math.round((remaining * Math.min(100, Math.max(0, v.value))) / 100);
      else if (v.kind === "FIXED") cents = toCents(v.value);
      else cents = toCents(v.balance ?? 0);
      cents = Math.min(remaining, Math.max(0, cents));
      remaining -= cents;
      voucher = {
        code: v.code,
        amount: toEuro(cents),
        ...(v.kind === "GIFT_CARD" ? { balanceAfter: toEuro(toCents(v.balance ?? 0) - cents) } : {}),
      };
    }
  }

  let manual: PricedCart["manual"];
  const percent = Math.min(100, Math.max(0, input.manualPercent ?? 0));
  if (percent > 0) {
    const cents = Math.min(remaining, Math.round((remaining * percent) / 100));
    manual = { percent, amount: toEuro(cents) };
    remaining -= cents;
  }

  return {
    subtotal: toEuro(subtotalCents),
    discounts,
    ...(voucher ? { voucher } : {}),
    ...(manual ? { manual } : {}),
    discountTotal: toEuro(subtotalCents - remaining),
    total: toEuro(remaining),
  };
}

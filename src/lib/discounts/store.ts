// DB access for promotions and vouchers. Pure pricing lives in ./engine.ts.
import { z } from "zod";
import type { PrismaClient, Voucher } from "@prisma/client";
import type { PromotionDef } from "../menu/mygd-menu";
import type { VoucherInput } from "./engine";

const PromotionRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("NTH_ITEM_PERCENT"), sectionSlug: z.string().min(1), nth: z.number().int().min(2), percent: z.number().min(0).max(100) }),
  z.object({ type: z.literal("BUNDLE_PRICE"), sectionSlug: z.string().min(1), quantity: z.number().int().min(2), bundlePrice: z.number().positive() }),
]);

export function parsePromotionRule(json: string): PromotionDef["rule"] {
  return PromotionRuleSchema.parse(JSON.parse(json));
}

export const normaliseVoucherCode = (code: string): string => code.trim().toUpperCase();

export function voucherToInput(v: Voucher): VoucherInput {
  return {
    code: v.code,
    kind: v.kind,
    value: v.value,
    isActive: v.isActive,
    minSubtotal: v.minSubtotal,
    validFrom: v.validFrom,
    validUntil: v.validUntil,
    maxRedemptions: v.maxRedemptions,
    redemptions: v.redemptions,
    balance: v.balance,
  };
}

/** Active automatic promotions. A promotion with an unreadable rule is skipped, never half-applied. */
export async function loadActivePromotions(db: Pick<PrismaClient, "promotion">): Promise<PromotionDef[]> {
  const rows = await db.promotion.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  const out: PromotionDef[] = [];
  for (const row of rows) {
    try {
      out.push({ code: row.code, name: row.name, rule: parsePromotionRule(row.ruleJson) });
    } catch (err) {
      console.error(`[discounts] Promotion ${row.code} has an invalid rule and was skipped:`, err);
    }
  }
  return out;
}

export async function findVoucher(db: Pick<PrismaClient, "voucher">, code: string): Promise<Voucher | null> {
  return db.voucher.findUnique({ where: { code: normaliseVoucherCode(code) } });
}

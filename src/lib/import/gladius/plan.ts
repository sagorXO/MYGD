// Gladius POS catalogue snapshot -> MYGD import plan. Pure: no database access.
//
// [ADR] Context: the PRD asks for an external-ID map, but the schema stays frozen
// until Phase 2. Decision: the stable key is Product.sku = "GLD-<Gladius ItemNum>";
// rows are never matched by name. Consequence: re-running the import updates the
// same products; DM Soft kiosk IDs get a proper mapping table in Phase 2.
import { z } from "zod";

export type VatCategory = "FOOD_BEV" | "ALCOHOL" | "ZERO";

const money = z.number().nullable();
const flag = z.union([z.boolean(), z.number()]).nullable().transform((v) => v === true || v === 1);
const text = z.string().nullable();

const inventoryRow = z.object({
  ItemNum: z.string().min(1),
  ItemName: z.string(),
  Dept_ID: text,
  Price: money,
  TaxRate: z.number().nullable(),
  IsModifier: flag,
  ActiveItem: flag,
  PromptPrice: flag,
  Kitchen: text,
  ModGroupCode: text,
  ModGroupCode1: text,
  ModGroupCode2: text,
}).passthrough();

const snapshotSchema = z.object({
  departments: z.array(z.object({ Dept_ID: z.string(), Description: text }).passthrough()),
  taxRates: z.array(z.object({ TaxRate: z.number() }).passthrough()),
  inventory: z.array(inventoryRow),
  groupModifiers: z.array(z.object({
    ModGroup: z.string(), ModDesc: text, ModNum: z.string(), ModName: text,
    Priced: flag, Price: money, NumSel: text, SortOrder: z.number().nullable(),
  }).passthrough()),
  itemPrinters: z.array(z.object({ ItemNum: z.string(), PrinterName: z.string() })).default([]),
  lastChargedPrice: z.array(z.object({ ItemNum: z.string(), LastChargedPrice: z.number(), LastSold: z.string() })).default([]),
});

export type GladiusSnapshot = z.infer<typeof snapshotSchema>;

export interface ImportDecisions {
  /** Gladius TaxRate (as a string, e.g. "9") -> MYGD VAT category. Unmapped rates block their products. */
  vatRateToCategory: Record<string, VatCategory | null>;
  /** ItemNum -> gross price in EUR, for items whose Gladius price is missing or wrong. */
  priceOverrides?: Record<string, number>;
  /** ItemNums to leave out on purpose. */
  skipItems?: string[];
}

export type IssueCode =
  | "VAT_UNMAPPED"
  | "PRICE_MISSING"
  | "PRICE_DIFFERS_FROM_LAST_SALE"
  | "DUPLICATE_NAME"
  | "INACTIVE_SKIPPED"
  | "SKIPPED_BY_DECISION"
  | "MODIFIER_RULE_UNKNOWN"
  | "MODIFIER_GROUP_UNKNOWN";

export interface ImportIssue {
  code: IssueCode;
  blocking: boolean;
  itemNum?: string;
  name?: string;
  message: string;
}

export interface PlannedCategory { slug: string; name: string; sortOrder: number }
export interface PlannedProduct {
  sku: string; itemNum: string; name: string; basePrice: number; vatCategory: VatCategory; categorySlug: string; sortOrder: number;
}
export interface PlannedModifierGroup { slug: string; name: string; minSelected: number; maxSelected: number; isRequired: boolean; sortOrder: number }
export interface PlannedModifier { groupSlug: string; slug: string; name: string; priceAdjustment: number; sortOrder: number }
export interface PlannedLink { sku: string; groupSlug: string; sortOrder: number }
export interface StationHint { sku: string; name: string; kitchen: string | null; printers: string[] }

export interface ImportPlan {
  categories: PlannedCategory[];
  products: PlannedProduct[];
  modifierGroups: PlannedModifierGroup[];
  modifiers: PlannedModifier[];
  productModifierGroups: PlannedLink[];
  stationHints: StationHint[];
  issues: ImportIssue[];
}

export function parseSnapshot(raw: unknown): GladiusSnapshot {
  return snapshotSchema.parse(raw);
}

export const toCents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const eur = (n: number) => toCents(n).toFixed(2);
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
export const skuFor = (itemNum: string) => `GLD-${itemNum.trim()}`;
const groupSlugFor = (modGroup: string) => `gld-${slug(modGroup)}`;

/** Gladius NumSel -> selection rule. Returns null for values we don't understand. */
export function selectionRule(numSel: string | null, optionCount: number) {
  const v = (numSel ?? "").replace(/\s+/g, "");
  if (v === "=1") return { minSelected: 1, maxSelected: 1, isRequired: true };
  if (v === ">=1") return { minSelected: 1, maxSelected: Math.max(1, optionCount), isRequired: true };
  if (v === "=0") return { minSelected: 0, maxSelected: Math.max(1, optionCount), isRequired: false };
  return null;
}

export function buildImportPlan(rawSnapshot: unknown, decisions: ImportDecisions): ImportPlan {
  const snap = parseSnapshot(rawSnapshot);
  const issues: ImportIssue[] = [];
  const skip = new Set(decisions.skipItems ?? []);
  const overrides = decisions.priceOverrides ?? {};
  const lastSale = new Map(snap.lastChargedPrice.map((r) => [r.ItemNum, r]));

  // Products
  const products: PlannedProduct[] = [];
  snap.inventory.forEach((row, index) => {
    if (row.IsModifier) return; // become Modifier rows below
    const name = row.ItemName.trim();
    const base = { itemNum: row.ItemNum, name };
    if (!row.ActiveItem) {
      issues.push({ ...base, code: "INACTIVE_SKIPPED", blocking: false, message: "Inactive in Gladius; not imported." });
      return;
    }
    if (skip.has(row.ItemNum)) {
      issues.push({ ...base, code: "SKIPPED_BY_DECISION", blocking: false, message: "Skipped by decision file." });
      return;
    }
    const vatKey = row.TaxRate === null ? "null" : String(row.TaxRate);
    const vatCategory = decisions.vatRateToCategory[vatKey] ?? null;
    const price = overrides[row.ItemNum] ?? row.Price ?? 0;

    let blocked = false;
    if (!vatCategory) {
      blocked = true;
      issues.push({ ...base, code: "VAT_UNMAPPED", blocking: true,
        message: `Gladius VAT rate ${vatKey}% has no MYGD category yet. Add it to vatRateToCategory (accountant decision).` });
    }
    if (!(price > 0)) {
      blocked = true;
      issues.push({ ...base, code: "PRICE_MISSING", blocking: true,
        message: row.PromptPrice ? "Price was typed at the till (PromptPrice). Add a priceOverride." : "No price in Gladius. Add a priceOverride or skip it." });
    }
    if (blocked || !vatCategory) return;

    const sold = lastSale.get(row.ItemNum);
    if (sold && overrides[row.ItemNum] === undefined && Math.abs(sold.LastChargedPrice - price) >= 0.005) {
      issues.push({ ...base, code: "PRICE_DIFFERS_FROM_LAST_SALE", blocking: false,
        message: `Menu price €${eur(price)} but last sold at €${eur(sold.LastChargedPrice)} on ${sold.LastSold.slice(0, 10)}.` });
    }
    products.push({
      sku: skuFor(row.ItemNum), itemNum: row.ItemNum, name, basePrice: toCents(price), vatCategory,
      categorySlug: `gld-${slug(row.Dept_ID ?? "uncategorised")}`, sortOrder: index,
    });
  });

  // Duplicate names among imported products (both are kept: SKUs differ)
  const byName = new Map<string, PlannedProduct[]>();
  for (const p of products) byName.set(p.name.toLowerCase(), [...(byName.get(p.name.toLowerCase()) ?? []), p]);
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    for (const p of group) {
      issues.push({ itemNum: p.itemNum, name: p.name, code: "DUPLICATE_NAME", blocking: false,
        message: `Same name as ${group.filter((o) => o !== p).map((o) => o.sku).join(", ")}. Both imported; rename if staff can't tell them apart.` });
    }
  }

  // Categories: only departments that received at least one product
  const usedCategorySlugs = [...new Set(products.map((p) => p.categorySlug))];
  const categories: PlannedCategory[] = usedCategorySlugs.map((s, i) => {
    const dept = snap.departments.find((d) => `gld-${slug(d.Dept_ID)}` === s);
    return { slug: s, name: (dept?.Description ?? dept?.Dept_ID ?? s).trim(), sortOrder: i };
  });

  // Modifier groups and options
  const modifierGroups: PlannedModifierGroup[] = [];
  const modifiers: PlannedModifier[] = [];
  const optionsByGroup = new Map<string, typeof snap.groupModifiers>();
  for (const gm of snap.groupModifiers) optionsByGroup.set(gm.ModGroup, [...(optionsByGroup.get(gm.ModGroup) ?? []), gm]);
  [...optionsByGroup.entries()].forEach(([modGroup, options], i) => {
    const rule = selectionRule(options[0].NumSel, options.length);
    if (!rule) {
      issues.push({ code: "MODIFIER_RULE_UNKNOWN", blocking: true, name: modGroup,
        message: `Modifier group ${modGroup} has selection rule "${options[0].NumSel}", which the importer doesn't understand.` });
      return;
    }
    const groupSlug = groupSlugFor(modGroup);
    modifierGroups.push({ slug: groupSlug, name: (options.find((o) => o.ModDesc)?.ModDesc ?? modGroup).trim(), ...rule, sortOrder: i });
    for (const o of options) {
      modifiers.push({
        groupSlug, slug: slug(o.ModNum), name: (o.ModName ?? o.ModNum).trim(),
        priceAdjustment: o.Priced && o.Price ? toCents(o.Price) : 0, sortOrder: o.SortOrder ?? 0,
      });
    }
  });

  // Product -> modifier group links
  const knownGroups = new Set(modifierGroups.map((g) => g.slug));
  const productBySku = new Map(products.map((p) => [p.sku, p]));
  const productModifierGroups: PlannedLink[] = [];
  for (const row of snap.inventory) {
    const sku = skuFor(row.ItemNum);
    if (!productBySku.has(sku)) continue;
    [row.ModGroupCode, row.ModGroupCode1, row.ModGroupCode2].forEach((code, sortOrder) => {
      if (!code || !code.trim()) return;
      const groupSlug = groupSlugFor(code);
      if (!knownGroups.has(groupSlug)) {
        issues.push({ itemNum: row.ItemNum, name: row.ItemName.trim(), code: "MODIFIER_GROUP_UNKNOWN", blocking: false,
          message: `Links to modifier group ${code}, which isn't in GroupModifiers; link not created.` });
        return;
      }
      productModifierGroups.push({ sku, groupSlug, sortOrder });
    });
  }

  // Station hints (old printer routing), for the station mapping decision (Q-HW-3)
  const printers = new Map<string, Set<string>>();
  for (const p of snap.itemPrinters) printers.set(p.ItemNum, (printers.get(p.ItemNum) ?? new Set()).add(p.PrinterName));
  // Every active product counts as evidence, including ones blocked by a pending decision.
  const stationHints: StationHint[] = snap.inventory
    .filter((r) => r.ActiveItem && !r.IsModifier && !skip.has(r.ItemNum))
    .map((r) => ({
      sku: skuFor(r.ItemNum), name: r.ItemName.trim(), kitchen: r.Kitchen,
      printers: [...(printers.get(r.ItemNum) ?? [])].sort(),
    }));

  return { categories, products, modifierGroups, modifiers, productModifierGroups, stationHints, issues };
}

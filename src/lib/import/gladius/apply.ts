// Applies an ImportPlan through a CatalogStore. Idempotent (upsert by stable
// keys), never deletes, and audit-logs price changes and the run summary.
import type { ImportPlan, PlannedCategory, PlannedModifier, PlannedModifierGroup, PlannedProduct } from "./plan";

export type Change = "created" | "updated" | "unchanged";

export interface CatalogStore {
  upsertCategory(c: PlannedCategory): Promise<{ id: string; change: Change }>;
  upsertProduct(p: PlannedProduct, categoryId: string): Promise<{ id: string; change: Change; previousPrice: number | null }>;
  upsertModifierGroup(g: PlannedModifierGroup): Promise<{ id: string; change: Change }>;
  upsertModifier(m: PlannedModifier, groupId: string): Promise<{ id: string; change: Change }>;
  linkProductModifierGroup(productId: string, groupId: string, sortOrder: number): Promise<{ change: Change }>;
  audit(entry: { action: string; details: Record<string, unknown> }): Promise<void>;
}

export interface Counts { created: number; updated: number; unchanged: number }
export interface ApplyResult {
  categories: Counts; products: Counts; modifierGroups: Counts; modifiers: Counts; links: Counts;
}

const counts = (): Counts => ({ created: 0, updated: 0, unchanged: 0 });

export async function applyImportPlan(
  plan: ImportPlan,
  store: CatalogStore,
  options: { source: string; allowBlocked?: boolean }
): Promise<ApplyResult> {
  const blocking = plan.issues.filter((i) => i.blocking);
  if (blocking.length > 0 && !options.allowBlocked) {
    throw new Error(`Plan has ${blocking.length} blocking issue(s); resolve them in the decisions file (or pass allowBlocked to import only the decided items).`);
  }

  const result: ApplyResult = { categories: counts(), products: counts(), modifierGroups: counts(), modifiers: counts(), links: counts() };

  const categoryIds = new Map<string, string>();
  for (const c of plan.categories) {
    const r = await store.upsertCategory(c);
    categoryIds.set(c.slug, r.id);
    result.categories[r.change] += 1;
  }

  const productIds = new Map<string, string>();
  for (const p of plan.products) {
    const categoryId = categoryIds.get(p.categorySlug);
    if (!categoryId) throw new Error(`Product ${p.sku} refers to unknown category ${p.categorySlug}.`);
    const r = await store.upsertProduct(p, categoryId);
    productIds.set(p.sku, r.id);
    result.products[r.change] += 1;
    if (r.change === "updated" && r.previousPrice !== null && r.previousPrice !== p.basePrice) {
      await store.audit({ action: "PRICE_CHANGED_BY_IMPORT", details: { sku: p.sku, from: r.previousPrice, to: p.basePrice, source: options.source } });
    }
  }

  const groupIds = new Map<string, string>();
  for (const g of plan.modifierGroups) {
    const r = await store.upsertModifierGroup(g);
    groupIds.set(g.slug, r.id);
    result.modifierGroups[r.change] += 1;
  }

  for (const m of plan.modifiers) {
    const groupId = groupIds.get(m.groupSlug);
    if (!groupId) throw new Error(`Modifier ${m.slug} refers to unknown group ${m.groupSlug}.`);
    const r = await store.upsertModifier(m, groupId);
    result.modifiers[r.change] += 1;
  }

  for (const l of plan.productModifierGroups) {
    const productId = productIds.get(l.sku);
    const groupId = groupIds.get(l.groupSlug);
    if (!productId || !groupId) continue;
    const r = await store.linkProductModifierGroup(productId, groupId, l.sortOrder);
    result.links[r.change] += 1;
  }

  await store.audit({ action: "CATALOG_IMPORT_APPLIED", details: { source: options.source, ...result } });
  return result;
}

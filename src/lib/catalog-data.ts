// MY GERMAN DÖNER — offline catalog (public site, POS and signage when the database is unreachable).
// Derived from the single menu source, src/lib/menu/mygd-menu.ts — nothing is typed in here.
import { MYGD_MENU_SECTIONS, MYGD_MODIFIER_GROUPS, allMenuItems } from "./menu/mygd-menu";

export interface MasterCatalogModifier {
  id: string;
  modifierGroupId: string;
  slug: string;
  name: string;
  nameDE: string;
  nameGR: string;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MasterCatalogModifierGroup {
  id: string;
  slug: string;
  name: string;
  nameDE: string;
  nameGR: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  sortOrder: number;
  modifiers: MasterCatalogModifier[];
}

export interface MasterCatalogProduct {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  nameDE: string;
  nameGR: string;
  description?: string;
  basePrice: number;
  vatCategory: "FOOD_BEV" | "ALCOHOL";
  imageUrl: string;
  isVeggie: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  allowMealUpgrade: boolean;
  sortOrder: number;
  modifierGroups: MasterCatalogModifierGroup[];
}

export interface MasterCatalogCategory {
  id: string;
  slug: string;
  name: string;
  nameDE: string;
  nameGR: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  products: MasterCatalogProduct[];
}

function buildCatalog(): MasterCatalogCategory[] {
  const groups = new Map(
    MYGD_MODIFIER_GROUPS.map((g, gi): [string, MasterCatalogModifierGroup] => [
      g.slug,
      {
        id: `mg-${g.slug}`,
        slug: g.slug,
        name: g.name,
        nameDE: g.name,
        nameGR: g.name,
        minSelected: g.minSelected,
        maxSelected: g.maxSelected,
        isRequired: g.isRequired,
        sortOrder: gi + 1,
        modifiers: g.options.map((o, oi) => ({
          id: `mod-${g.slug}-${o.slug}`,
          modifierGroupId: `mg-${g.slug}`,
          slug: o.slug,
          name: o.name,
          nameDE: o.name,
          nameGR: o.name,
          priceAdjustment: o.price,
          isDefault: o.isDefault ?? false,
          isAvailable: true,
          sortOrder: oi + 1,
        })),
      },
    ]),
  );
  const items = allMenuItems();
  return MYGD_MENU_SECTIONS.map((section, index) => ({
    id: `cat-${section.slug}`,
    slug: section.slug,
    name: section.name,
    nameDE: section.nameDE,
    nameGR: section.nameGR,
    description: section.note,
    sortOrder: index + 1,
    isActive: true,
    products: items
      .filter((i) => i.sectionSlug === section.slug)
      .map((i) => ({
        id: `prod-${i.sku}`,
        categoryId: `cat-${section.slug}`,
        sku: i.sku,
        name: i.name,
        nameDE: i.name,
        nameGR: i.name,
        description: i.description,
        basePrice: i.price,
        vatCategory: i.vat,
        imageUrl: i.imageUrl,
        isVeggie: i.isVeggie ?? false,
        isSpicy: i.isSpicy ?? false,
        isAvailable: true,
        allowMealUpgrade: i.allowMealUpgrade ?? false,
        sortOrder: i.sortOrder,
        modifierGroups: (i.modifierGroups ?? []).flatMap((slug) => groups.get(slug) ?? []),
      })),
  }));
}

export const CANONICAL_CATALOG_CATEGORIES: MasterCatalogCategory[] = buildCatalog();

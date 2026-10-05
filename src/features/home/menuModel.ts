import type { ProductDTO } from "@/types";
import type { Tone } from "@/ui";

export type MenuFilter = "ALL" | "POPULAR" | "VEGGIE" | "SPICY";
export type MenuProduct = Pick<ProductDTO, "id" | "name" | "description" | "basePrice" | "badge" | "isVeggie" | "isSpicy" | "isAvailable"> &
  Partial<Pick<ProductDTO, "imageUrl" | "nameDE" | "nameGR">>;

export interface ProductBadge {
  label: string;
  tone: Tone;
}

const POPULAR_BADGES = new Set(["POPULAR", "CHEF_CHOICE", "TOP_SELLER", "BESTSELLER"]);

const BADGE_MAP: Record<string, ProductBadge> = {
  POPULAR: { label: "Bestseller", tone: "highlight" },
  TOP_SELLER: { label: "Bestseller", tone: "highlight" },
  BESTSELLER: { label: "Bestseller", tone: "highlight" },
  CHEF_CHOICE: { label: "Chef's choice", tone: "accent" },
  VEGGIE: { label: "Veggie", tone: "success" },
  SPICY: { label: "Spicy", tone: "critical" },
};

/** Category names in the DB carry the menu-board number ("Board 1: …"); customers never see it. */
export function displayCategoryName(name: string): string {
  const cleaned = name.replace(/^\s*board\s*\d+\s*:\s*/i, "").trim();
  return cleaned || "Menu";
}

function isVeggie(p: MenuProduct): boolean {
  return p.isVeggie || p.badge === "VEGGIE" || p.name.toLowerCase().includes("falafel");
}

function isSpicy(p: MenuProduct): boolean {
  return p.isSpicy || p.badge === "SPICY" || (p.description?.toLowerCase().includes("chili") ?? false);
}

export function filterProducts<P extends MenuProduct>(products: P[], filter: MenuFilter): P[] {
  return products.filter((p) => {
    if (!p.isAvailable) return false;
    if (filter === "POPULAR") return p.badge != null && POPULAR_BADGES.has(p.badge);
    if (filter === "VEGGIE") return isVeggie(p);
    if (filter === "SPICY") return isSpicy(p);
    return true;
  });
}

export function productBadges(p: MenuProduct): ProductBadge[] {
  const out: ProductBadge[] = [];
  const add = (b: ProductBadge | undefined) => {
    if (b && !out.some((x) => x.label === b.label)) out.push(b);
  };
  add(p.badge ? BADGE_MAP[p.badge] : undefined);
  if (p.isVeggie) add(BADGE_MAP.VEGGIE);
  if (p.isSpicy) add(BADGE_MAP.SPICY);
  return out;
}

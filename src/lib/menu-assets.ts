// MY GERMAN DÖNER — Asset Ingestion Pipeline & Fallback Engine
// Resolves menu photography & brand vector assets with resilient SVG fallback
import { allMenuItems } from "./menu/mygd-menu";

export interface MenuAssetDefinition {
  sku: string;
  name: string;
  /** Menu section slug, e.g. "wraps". */
  category: string;
  localPath: string;
  remoteFallbackUrl?: string;
}

/** One entry per menu item, derived from the single menu source — nothing is listed by hand. */
export const MENU_ASSET_REGISTRY: Record<string, MenuAssetDefinition> = Object.fromEntries(
  allMenuItems().map((item): [string, MenuAssetDefinition] => [
    item.sku,
    {
      sku: item.sku,
      name: item.name,
      category: item.sectionSlug,
      localPath: "/assets/menu/placeholder.svg",
      remoteFallbackUrl: item.imageUrl,
    },
  ]),
);

export const BRAND_ASSETS: Record<string, string> = {
  LOGO_PRIMARY: "/assets/brand/logo.svg",
  HERO_SPIT: "/assets/brand/logo.svg",
  PLACEHOLDER_MENU: "/assets/menu/placeholder.svg",
};

/**
 * Generates an inline SVG data URI vector placeholder when physical images are unavailable.
 */
export function generateVectorPlaceholder(title: string, category: string = "DÖNER"): string {
  const cleanTitle = title.replace(/[<>&"]/g, "");
  const cleanCategory = category.toUpperCase().replace(/[<>&"]/g, "");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1F1F21"/>
        <stop offset="100%" stop-color="#2B2B2E"/>
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E50D7E"/>
        <stop offset="100%" stop-color="#00FCED"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" rx="20" fill="url(#bg)"/>
    <rect x="25" y="25" width="550" height="350" rx="16" fill="none" stroke="#3A3A3E" stroke-width="2"/>
    <circle cx="300" cy="170" r="65" fill="#E50D7E" opacity="0.12"/>
    <path d="M260 190 C 260 135, 340 135, 340 190 Z" fill="url(#neon)"/>
    <rect x="250" y="195" width="100" height="12" rx="6" fill="#00FCED"/>
    <text x="300" y="270" text-anchor="middle" fill="#FFFFFF" font-family="Oswald, sans-serif" font-size="24" font-weight="900" letter-spacing="2">${cleanTitle}</text>
    <text x="300" y="305" text-anchor="middle" fill="#00FCED" font-family="Figtree, sans-serif" font-size="14" font-weight="700" letter-spacing="3">${cleanCategory} · MYGD</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns a valid image URL for a menu item.
 * Tries local path, falls back to remote image, or generates an inline SVG vector placeholder.
 */
export function getMenuAsset(skuOrName: string, category: string = "MENU"): string {
  // Check exact SKU in registry
  const entry = MENU_ASSET_REGISTRY[skuOrName];
  if (entry) {
    return entry.remoteFallbackUrl || entry.localPath || BRAND_ASSETS.PLACEHOLDER_MENU;
  }

  // Find by partial name
  const matched = Object.values(MENU_ASSET_REGISTRY).find((item) =>
    item.name.toLowerCase().includes(skuOrName.toLowerCase())
  );
  if (matched) {
    return matched.remoteFallbackUrl || matched.localPath || BRAND_ASSETS.PLACEHOLDER_MENU;
  }

  // Generate vector placeholder as clean zero-broken-link fallback
  return generateVectorPlaceholder(skuOrName, category);
}

/**
 * Returns the brand asset path with fallback to primary logo.
 */
export function getBrandAsset(key: string): string {
  return BRAND_ASSETS[key] || BRAND_ASSETS.LOGO_PRIMARY;
}

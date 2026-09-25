// MY GERMAN DÖNER — Asset Ingestion Pipeline & Fallback Engine
// Resolves menu photography & brand vector assets with resilient SVG fallback

export interface MenuAssetDefinition {
  sku: string;
  name: string;
  category: "DOENER" | "WRAPS" | "BOWLS" | "SIDES" | "DRINKS" | "SAUCES";
  localPath: string;
  remoteFallbackUrl?: string;
}

export const MENU_ASSET_REGISTRY: Record<string, MenuAssetDefinition> = {
  "MYGD-CL-DONER": {
    sku: "MYGD-CL-DONER",
    name: "Original German Döner (150g)",
    category: "DOENER",
    localPath: "/assets/menu/classic-doner.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
  },
  "MYGD-ST-DONER": {
    sku: "MYGD-ST-DONER",
    name: "Steak Döner (100% Beef)",
    category: "DOENER",
    localPath: "/assets/menu/steak-doner.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=85",
  },
  "MYGD-CK-DONER": {
    sku: "MYGD-CK-DONER",
    name: "Crispy Chicken Döner",
    category: "DOENER",
    localPath: "/assets/menu/chicken-doner.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
  },
  "MYGD-ST-DURUM": {
    sku: "MYGD-ST-DURUM",
    name: "Standard Dürüm Wrap",
    category: "WRAPS",
    localPath: "/assets/menu/durum-wrap.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85",
  },
  "MYGD-DN-BOX": {
    sku: "MYGD-DN-BOX",
    name: "Döner Box with Fries",
    category: "BOWLS",
    localPath: "/assets/menu/doner-box.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
  },
  "MYGD-CR-FRIES": {
    sku: "MYGD-CR-FRIES",
    name: "Crispy Berlin Fries",
    category: "SIDES",
    localPath: "/assets/menu/fries.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=85",
  },
  "MYGD-GER-BEER": {
    sku: "MYGD-GER-BEER",
    name: "German Pilsner Beer (500ml)",
    category: "DRINKS",
    localPath: "/assets/menu/beer.svg",
    remoteFallbackUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=85",
  },
};

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
export function getMenuAsset(skuOrName: string, category: string = "DOENER"): string {
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

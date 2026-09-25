// MY GERMAN DÖNER — Module M10: Digital Menu Boards Real-Time Engine
// Daypart resolution, screen slot configuration, sold-out inventory overlays, layout validation

export type DaypartType = "LUNCH" | "DINNER" | "LATE_NIGHT" | "MORNING";
export type LayoutPresetType = "PROMO_HERO" | "PRICE_MATRIX" | "SPLIT_COMBO";

export interface MenuBoardItem {
  id?: string;
  name: string;
  nameDE?: string;
  nameGR?: string;
  desc?: string;
  price: number;
  badge?: string;
  badgeColor?: string;
  imageUrl?: string;
  calories?: string | number;
  allergens?: string[];
  isSpicy?: boolean;
  isVeggie?: boolean;
  spiceLevel?: number;
  isAvailable?: boolean;
  isSoldOut?: boolean;
  categoryBadge?: string;
}

export interface MenuBoardScreenConfig {
  slotId?: number;
  screenNumber?: number;
  title: string;
  subtitle?: string;
  categoryBadge?: string;
  layoutType: LayoutPresetType | string;
  heroLayout?: boolean;
  activeDaypart?: string;
  items: MenuBoardItem[];
  isOnline?: boolean;
  updatedAt?: string | Date;
}

/**
 * 7-Screen Canonical Master Configuration
 */
export const CANONICAL_SCREEN_CONFIGS: Record<number, MenuBoardScreenConfig> = {
  1: {
    slotId: 1,
    screenNumber: 1,
    title: "BERLIN ROTISSERIE HERO",
    subtitle: "BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS",
    categoryBadge: "FLAGSHIP ROTISSERIE",
    layoutType: "PROMO_HERO",
    heroLayout: true,
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-hero-1",
        name: "Original German Döner (150g)",
        nameDE: "Original Berliner Döner Kebab",
        desc: "Freshly carved veal/beef or chicken rotisserie, toasted sesame Fladenbrot, crispy red cabbage, fresh tomatoes, homemade Kräuter & Knoblauch sauces.",
        price: 7.5,
        badge: "BITE THE HYPE",
        badgeColor: "bg-[#E50D7E]",
        imageUrl:
          "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
  2: {
    slotId: 2,
    screenNumber: 2,
    title: "ORIGINAL DÖNER SELECTION",
    subtitle: "100% FRESH GERMAN ROTISSERIE · CARVED TO ORDER",
    categoryBadge: "SANDWICHES",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-doner-1",
        name: "Original German Döner",
        nameDE: "Classic 150g Meat",
        desc: "Toasted sesame bread, crisp salad, garlic herb sauce",
        price: 7.5,
        badge: "BESTSELLER",
        badgeColor: "bg-[#E50D7E]",
        imageUrl:
          "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-steak-1",
        name: "Steak Döner (100% Beef)",
        nameDE: "Premium Cut",
        desc: "Thin-sliced beef steak, fresh herbs, lemon garlic cream",
        price: 9.0,
        badge: "CHEF CHOICE",
        badgeColor: "bg-[#E5A93C]",
        imageUrl:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-spezial-1",
        name: "Döner Spezial (Double Meat)",
        nameDE: "250g Meat Load",
        desc: "Extra meat load, melted cheddar sauce, grilled onions",
        price: 10.5,
        badge: "🔥 SPICY KICK",
        badgeColor: "bg-[#E53935]",
        isSpicy: true,
        imageUrl:
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-falafel-1",
        name: "Falafel & Grilled Halloumi",
        nameDE: "Vegetarisch",
        desc: "Crispy chickpea falafel, Cyprus halloumi, sesame tahini",
        price: 7.0,
        badge: "🌱 VEGETARIAN",
        badgeColor: "bg-[#4CAF50]",
        isVeggie: true,
        imageUrl:
          "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
  3: {
    slotId: 3,
    screenNumber: 3,
    title: "WRAPS & DÜRÜM",
    subtitle: "ROLLED WARM IN THIN FLATBREAD WITH HOMEMADE SAUCES",
    categoryBadge: "ROLLED DÜRÜM",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-durum-1",
        name: "Standard Dürüm Wrap (150g)",
        nameDE: "Berliner Dürüm",
        desc: "Thin lavash flatbread, rotisserie meat, sumac onions, salad",
        price: 8.0,
        badge: "POPULAR",
        badgeColor: "bg-[#E50D7E]",
        imageUrl:
          "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-durum-chicken",
        name: "Chicken Dürüm Spezial",
        nameDE: "Geflügel Dürüm",
        desc: "Marinated chicken breast, golden fries inside, chili garlic sauce",
        price: 8.5,
        badge: "FRIES INSIDE",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl:
          "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-durum-halloumi",
        name: "Halloumi & Falafel Dürüm",
        nameDE: "Veggie Wrap",
        desc: "Grilled local halloumi, organic falafel, herbs, tahini dip",
        price: 7.5,
        badge: "🌱 VEGGIE",
        badgeColor: "bg-[#4CAF50]",
        isVeggie: true,
        imageUrl:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
  4: {
    slotId: 4,
    screenNumber: 4,
    title: "BOWLS & DÖNER BOXES",
    subtitle: "OVER CRISPY BERLIN FRIES OR AROMATIC SEASONED RICE",
    categoryBadge: "BOXES & BOWLS",
    layoutType: "SPLIT_COMBO",
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-box-1",
        name: "Original Döner Box",
        nameDE: "Mit Pommes",
        desc: "Crispy Berlin fries foundation topped with sliced meat & garlic sauce",
        price: 7.0,
        badge: "TOP SELLER",
        badgeColor: "bg-[#E50D7E]",
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-bowl-1",
        name: "Döner Rice Bowl XL (200g)",
        nameDE: "Teller mit Reis",
        desc: "200g meat load, seasoned Turkish rice, salad, double sauce dips",
        price: 11.5,
        badge: "HIGH PROTEIN",
        badgeColor: "bg-[#E5A93C]",
        imageUrl:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-bowl-falafel",
        name: "Falafel & Hummus Power Bowl",
        nameDE: "Falafel Teller",
        desc: "4x Falafel patties, creamy hummus, Kalamata olives, sumac salad",
        price: 8.5,
        badge: "🌱 VEGAN",
        badgeColor: "bg-[#4CAF50]",
        isVeggie: true,
        imageUrl:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
  5: {
    slotId: 5,
    screenNumber: 5,
    title: "SPECIALTIES & MEAL COMBOS",
    subtitle: "BERLIN FAST-CASUAL ICONS & BUNDLE DEALS",
    categoryBadge: "ICONS & MEALS",
    layoutType: "SPLIT_COMBO",
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-currywurst-1",
        name: "Original Berlin Currywurst",
        nameDE: "Kult-Currywurst",
        desc: "German pork/beef bratwurst in spiced tomato curry sauce with fries",
        price: 7.5,
        badge: "BERLIN ICON",
        badgeColor: "bg-[#E50D7E]",
        imageUrl:
          "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-combo-meal",
        name: "Make It A Meal Combo (+€3.50)",
        nameDE: "Menü Upgrade",
        desc: "Upgrade ANY Döner or Wrap with Crispy Berlin Fries + 330ml Chilled Drink",
        price: 3.5,
        badge: "⭐ BEST VALUE",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl:
          "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-doner-burger",
        name: "German Döner Burger",
        nameDE: "Döner Burger",
        desc: "Toasted brioche, shaved rotisserie meat, melted cheddar, burger sauce",
        price: 7.0,
        badge: "NEW",
        badgeColor: "bg-[#E5A93C]",
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
  6: {
    slotId: 6,
    screenNumber: 6,
    title: "SIDES & SAUCE BAR",
    subtitle: "CRISPY SIDES & HOMEMADE SIGNATURE SAUCES",
    categoryBadge: "SIDES & SAUCES",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-fries-1",
        name: "Crispy Berlin Fries (Skin-On)",
        nameDE: "Berliner Pommes",
        desc: "Golden fries seasoned with our signature paprika-salt spice blend",
        price: 3.5,
        imageUrl:
          "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-loaded-fries",
        name: "Chili-Cheese Loaded Fries",
        nameDE: "Käse-Pommes",
        desc: "Warm cheddar cheese sauce, jalapeños, rotisserie beef crumbles",
        price: 6.0,
        badge: "🔥 SPICY",
        badgeColor: "bg-[#E53935]",
        isSpicy: true,
        imageUrl:
          "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-halloumi-side",
        name: "Grilled Cyprus Halloumi (4 pcs)",
        nameDE: "Gegrillter Halloumi",
        desc: "Authentic grilled Cyprus cheese with fresh oregano and olive oil",
        price: 4.5,
        badge: "CYPRUS SPECIAL",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl:
          "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
  7: {
    slotId: 7,
    screenNumber: 7,
    title: "DRINKS & HOMEMADE DESSERTS",
    subtitle: "ICE-COLD SODAS, TRADITIONAL AYRAN & FRESH BAKLAVA",
    categoryBadge: "DRINKS & SWEETS",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    items: [
      {
        id: "prod-ayran-1",
        name: "Traditional Salted Ayran (250ml)",
        nameDE: "Frischer Ayran",
        desc: "Authentic chilled yoghurt drink — the perfect döner companion",
        price: 2.0,
        badge: "DÖNER PAIRING",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl:
          "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-gazoz-1",
        name: "Uludağ Gazoz (330ml Can)",
        nameDE: "Uludağ Gazoz",
        desc: "Famous Turkish sparkling citrus soda",
        price: 2.5,
        imageUrl:
          "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
      {
        id: "prod-baklava-1",
        name: "Pistachio Baklava (3 pcs)",
        nameDE: "Pistazien Baklava",
        desc: "Handcrafted crispy phyllo pastry, pistachios, honey syrup",
        price: 4.0,
        badge: "SWEET BITE",
        badgeColor: "bg-[#E5A93C]",
        imageUrl:
          "https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=85",
        isAvailable: true,
      },
    ],
  },
};

/**
 * Resolves active operational daypart based on current time or numerical hour:
 * - LUNCH: 11:00 to 16:00 (11.00 <= h < 16.00)
 * - DINNER: 16:00 to 23:00 (16.00 <= h < 23.00)
 * - LATE_NIGHT: 23:00 to 04:00 (23.00 <= h or h < 4.00)
 * - MORNING: 04:00 to 11:00 (4.00 <= h < 11.00)
 * Handles modulo 24 normalization for negative numbers and overflow.
 */
export function resolveActiveDaypart(hourOrDate: number | Date): DaypartType {
  let h: number;

  if (hourOrDate instanceof Date) {
    h =
      hourOrDate.getHours() +
      hourOrDate.getMinutes() / 60 +
      hourOrDate.getSeconds() / 3600 +
      hourOrDate.getMilliseconds() / 3600000;
  } else if (typeof hourOrDate === "number") {
    h = ((hourOrDate % 24) + 24) % 24;
  } else {
    const now = new Date();
    h = now.getHours() + now.getMinutes() / 60;
  }

  if (h >= 11 && h < 16) {
    return "LUNCH";
  } else if (h >= 16 && h < 23) {
    return "DINNER";
  } else if (h >= 23 || h < 4) {
    return "LATE_NIGHT";
  } else {
    return "MORNING";
  }
}

/**
 * Validates layout type preset.
 * Only exact strings 'PROMO_HERO', 'PRICE_MATRIX', 'SPLIT_COMBO' are accepted.
 */
export function validateLayoutType(layoutType: any): boolean {
  if (typeof layoutType !== "string") return false;
  return layoutType === "PROMO_HERO" || layoutType === "PRICE_MATRIX" || layoutType === "SPLIT_COMBO";
}

/**
 * Resolves screen configuration for a given screen slot (1-7), applying live inventory overlays (isSoldOut).
 * Guarantees immutability of the input configs.
 */
export function resolveScreenConfig(
  screenNumber: number,
  configs: any[] | Record<string | number, any> | Map<string | number, any>,
  liveInventory?: any
): MenuBoardScreenConfig {
  let targetConfig: any = null;

  if (Array.isArray(configs)) {
    targetConfig = configs.find(
      (c) =>
        c?.screenNumber === screenNumber ||
        c?.slotId === screenNumber ||
        c?.id === screenNumber ||
        c?.id === String(screenNumber)
    );
    if (!targetConfig && configs.length > 0) {
      targetConfig = configs[screenNumber - 1] || configs[0];
    }
  } else if (configs instanceof Map) {
    targetConfig = configs.get(screenNumber) || configs.get(String(screenNumber));
  } else if (configs && typeof configs === "object") {
    targetConfig = configs[screenNumber] || configs[String(screenNumber)];
  }

  if (!targetConfig) {
    targetConfig =
      CANONICAL_SCREEN_CONFIGS[screenNumber] ||
      CANONICAL_SCREEN_CONFIGS[1] || {
        slotId: screenNumber,
        screenNumber,
        title: `SCREEN ${screenNumber}`,
        subtitle: "MY GERMAN DÖNER",
        categoryBadge: "MENU",
        layoutType: "PRICE_MATRIX",
        items: [],
      };
  }

  // Parse items if stored as JSON string (e.g. from Prisma itemsJson)
  let itemsList: any[] = targetConfig.items;
  if (!itemsList && typeof targetConfig.itemsJson === "string") {
    try {
      itemsList = JSON.parse(targetConfig.itemsJson);
    } catch {
      itemsList = [];
    }
  }

  // Deep clone to guarantee immutability
  const resolved: MenuBoardScreenConfig = JSON.parse(
    JSON.stringify({
      ...targetConfig,
      items: Array.isArray(itemsList) ? itemsList : targetConfig.items || [],
    })
  );

  if (typeof resolved.items === "string") {
    try {
      resolved.items = JSON.parse(resolved.items);
    } catch {
      resolved.items = [];
    }
  }

  if (Array.isArray(resolved.items)) {
    resolved.items = resolved.items.map((item: any) => {
      const clonedItem = { ...item };
      const itemId = clonedItem.id;

      let isAvail: boolean | undefined = undefined;

      if (liveInventory !== undefined && liveInventory !== null) {
        if (Array.isArray(liveInventory)) {
          const entry = liveInventory.find(
            (inv: any) =>
              inv?.id === itemId || inv?.productId === itemId || inv?.sku === itemId
          );
          if (entry !== undefined) {
            if (typeof entry === "boolean") {
              isAvail = entry;
            } else if (entry && typeof entry === "object") {
              if (entry.isAvailable !== undefined) isAvail = Boolean(entry.isAvailable);
              else if (entry.isSoldOut !== undefined) isAvail = !entry.isSoldOut;
              else if (entry.currentStock !== undefined) isAvail = entry.currentStock > 0;
            }
          }
        } else if (liveInventory instanceof Map) {
          if (liveInventory.has(itemId)) {
            const entry = liveInventory.get(itemId);
            if (typeof entry === "boolean") {
              isAvail = entry;
            } else if (entry && typeof entry === "object") {
              if (entry.isAvailable !== undefined) isAvail = Boolean(entry.isAvailable);
              else if (entry.isSoldOut !== undefined) isAvail = !entry.isSoldOut;
              else if (entry.currentStock !== undefined) isAvail = entry.currentStock > 0;
            }
          }
        } else if (typeof liveInventory === "object") {
          if (itemId in liveInventory) {
            const entry = liveInventory[itemId];
            if (typeof entry === "boolean") {
              isAvail = entry;
            } else if (entry && typeof entry === "object") {
              if (entry.isAvailable !== undefined) isAvail = Boolean(entry.isAvailable);
              else if (entry.isSoldOut !== undefined) isAvail = !entry.isSoldOut;
              else if (entry.currentStock !== undefined) isAvail = entry.currentStock > 0;
            }
          }
        }
      }

      if (isAvail === false) {
        clonedItem.isSoldOut = true;
        clonedItem.isAvailable = false;
        clonedItem.badge = "SOLD OUT";
      } else if (isAvail === true) {
        clonedItem.isSoldOut = false;
        clonedItem.isAvailable = true;
      } else if (isAvail === undefined) {
        if (clonedItem.isSoldOut === true || clonedItem.isAvailable === false) {
          clonedItem.isSoldOut = true;
          clonedItem.isAvailable = false;
          if (!clonedItem.badge) clonedItem.badge = "SOLD OUT";
        } else if (liveInventory !== undefined && liveInventory !== null) {
          clonedItem.isSoldOut = clonedItem.isSoldOut ?? false;
          clonedItem.isAvailable = clonedItem.isAvailable ?? true;
        }
      }

      return clonedItem;
    });
  }

  return resolved;
}

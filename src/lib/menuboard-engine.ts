// MY GERMAN DÖNER — Module M10: Digital Menu Boards Real-Time Engine
// Daypart resolution, screen slot configuration, sold-out inventory overlays, layout validation
import { buildBoardConfigs } from "./menu/boards";

export type DaypartType = "LUNCH" | "DINNER" | "LATE_NIGHT" | "MORNING";
export type LayoutPresetType = "PROMO_HERO" | "PRICE_MATRIX" | "SPLIT_COMBO" | "DRINKS_SIDES";

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
  sku?: string;
  section?: string;
  sectionNote?: string;
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
 * Offline fallback screens, derived from the single menu source (src/lib/menu/mygd-menu.ts).
 * The database (MenuBoardConfig, written by the seed) is the live source; nothing is typed in here.
 */
export const CANONICAL_SCREEN_CONFIGS: Record<number, MenuBoardScreenConfig> = buildBoardConfigs();

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
  return layoutType === "PROMO_HERO" || layoutType === "PRICE_MATRIX" || layoutType === "SPLIT_COMBO" || layoutType === "DRINKS_SIDES";
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

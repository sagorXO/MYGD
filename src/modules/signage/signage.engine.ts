// MY GERMAN DÖNER — 4K Dynamic Menu Board Engine
import { SignageScreenConfig } from "./signage.schema";
import { buildSignageScreens } from "@/lib/menu/boards";

// Offline fallback for /boards, derived from the single menu source (src/lib/menu/mygd-menu.ts).
// The live screens load /api/menuboards (database) and only use this when that request fails.
export const CANONICAL_4K_SCREENS: Record<number, SignageScreenConfig> = buildSignageScreens();

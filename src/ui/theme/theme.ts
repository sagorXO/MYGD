export type Surface = "kiosk" | "order" | "board" | "display" | "pos" | "kds" | "staff" | "admin";
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const SURFACE_DEFAULT_THEME: Record<Surface, ThemePreference> = {
  kiosk: "dark",
  board: "dark",
  display: "dark",
  kds: "dark",
  pos: "light",
  staff: "light",
  admin: "light",
  order: "system",
};

export function storageKey(surface: Surface): string {
  return `mygd.theme.${surface}`;
}

export function parsePreference(value: unknown): ThemePreference | null {
  return value === "light" || value === "dark" || value === "system" ? value : null;
}

export function readStoredTheme(storage: Pick<Storage, "getItem"> | null | undefined, surface: Surface): ThemePreference | null {
  if (!storage) return null;
  try {
    return parsePreference(storage.getItem(storageKey(surface)));
  } catch {
    return null;
  }
}

export function resolveTheme(pref: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === "system") return systemPrefersDark ? "dark" : "light";
  return pref;
}

/** Server-side default: no storage or media query available, so "system" renders light. */
export function initialTheme(surface: Surface): ResolvedTheme {
  return resolveTheme(SURFACE_DEFAULT_THEME[surface], false);
}

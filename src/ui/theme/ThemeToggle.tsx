"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { SURFACE_DEFAULT_THEME, readStoredTheme, resolveTheme, storageKey, type Surface, type ThemePreference } from "./theme";

const OPTIONS: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "System theme", Icon: Monitor },
];

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ThemeToggle({ surface, className }: { surface: Surface; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pref, setPref] = useState<ThemePreference>(SURFACE_DEFAULT_THEME[surface]);

  useEffect(() => {
    setPref(readStoredTheme(safeStorage(), surface) ?? SURFACE_DEFAULT_THEME[surface]);
  }, [surface]);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-surface]");
    if (!root) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.theme = resolveTheme(pref, media.matches);
    };
    apply();
    if (pref !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [pref]);

  const choose = (value: ThemePreference) => {
    setPref(value);
    try {
      safeStorage()?.setItem(storageKey(surface), value);
    } catch {
      // Storage blocked (private mode / kiosk lockdown): the theme still applies for this session.
    }
  };

  return (
    <div ref={ref} role="radiogroup" aria-label="Theme" className={cn("inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5", className)}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-secondary transition-colors duration-fast",
            "hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            pref === value && "bg-accent-subtle text-accent-text",
          )}
        >
          <Icon aria-hidden width={16} height={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

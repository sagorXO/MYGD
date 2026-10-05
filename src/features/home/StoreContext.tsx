"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { LOCATIONS, type StoreLocation } from "./storeLocations";

interface StoreContextValue {
  store: StoreLocation;
  setStoreSlug: (slug: StoreLocation["slug"]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** One selected store drives the header CTA, menu prices and the location cards. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<StoreLocation["slug"]>(LOCATIONS[0].slug);
  const value = useMemo(
    () => ({ store: LOCATIONS.find((l) => l.slug === slug) ?? LOCATIONS[0], setStoreSlug: setSlug }),
    [slug],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function StoreSwitcher({ className }: { className?: string }) {
  const { store, setStoreSlug } = useStore();
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">Choose a store</span>
      <MapPin aria-hidden width={16} height={16} strokeWidth={1.5} className="pointer-events-none absolute left-3 text-text-secondary" />
      <select
        value={store.slug}
        onChange={(e) => setStoreSlug(e.target.value as StoreLocation["slug"])}
        className="h-11 appearance-none rounded-pill border border-border bg-surface pl-9 pr-9 text-sm font-medium text-text transition-colors duration-fast hover:border-border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {LOCATIONS.map((l) => (
          <option key={l.slug} value={l.slug}>
            {l.name}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden width={16} height={16} strokeWidth={1.5} className="pointer-events-none absolute right-3 text-text-secondary" />
    </label>
  );
}

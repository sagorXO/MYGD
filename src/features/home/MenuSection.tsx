"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import type { CategoryDTO } from "@/types";
import { Banner, EmptyState, ErrorState, SegmentedControl, Skeleton, Tabs } from "@/ui";
import { displayCategoryName, filterProducts, offerTitles, type MenuFilter } from "./menuModel";
import { ProductCard } from "./ProductCard";
import { LOCATIONS, type StoreLocation } from "./storeLocations";

type Status = "loading" | "ready" | "error";
const FILTERS: { value: MenuFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "POPULAR", label: "Bestsellers" },
  { value: "VEGGIE", label: "Veggie" },
  { value: "SPICY", label: "Spicy" },
];

interface MenuResponse {
  success: boolean;
  categories?: CategoryDTO[];
  promotions?: { name: string }[];
}

export function MenuSection() {
  const [location, setLocation] = useState<StoreLocation["slug"]>("EMBA");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [filter, setFilter] = useState<MenuFilter>("ALL");
  const [offers, setOffers] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async (slug: StoreLocation["slug"], signal?: AbortSignal) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/menu?location=${slug}`, { signal });
      if (!res.ok) throw new Error(`Menu request failed: ${res.status}`);
      const data = (await res.json()) as MenuResponse;
      if (!data.success) throw new Error("Menu request unsuccessful");
      const cats = data.categories ?? [];
      setCategories(cats);
      setOffers(offerTitles(data.promotions));
      setCategoryId((prev) => (cats.some((c) => c.id === prev) ? prev : cats[0]?.id ?? ""));
      setStatus("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to load menu", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(location, controller.signal);
    return () => controller.abort();
  }, [location, load]);

  const active = categories.find((c) => c.id === categoryId);
  const products = filterProducts(active?.products ?? [], filter);

  return (
    <section id="menu" aria-labelledby="menu-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 md:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent-text">Updated live from our kitchens</p>
          <h2 id="menu-title" className="font-display text-4xl uppercase tracking-tight text-text">
            Our menu
          </h2>
        </div>
        <SegmentedControl
          label="Location"
          value={location}
          onChange={setLocation}
          options={LOCATIONS.map((l) => ({ value: l.slug, label: l.name }))}
        />
      </div>

      {status === "ready" && offers.length > 0 && (
        <Banner tone="info" title="Offers" className="mb-4">
          <ul className="list-inside list-disc">
            {offers.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </Banner>
      )}

      {status === "ready" && categories.length > 0 && (
        <Tabs
          label="Menu categories"
          selected={categoryId}
          onSelect={setCategoryId}
          tabs={categories.map((c) => ({ id: c.id, label: displayCategoryName(c.name) }))}
        />
      )}

      <div className="my-4">
        <SegmentedControl label="Filter" value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <div id={categoryId ? `tabpanel-${categoryId}` : undefined} role={categoryId ? "tabpanel" : undefined} aria-labelledby={categoryId ? `tab-${categoryId}` : undefined}>
        {status === "loading" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading menu">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        )}
        {status === "error" && <ErrorState title="We couldn't load the menu" description="Check your connection and try again." onRetry={() => void load(location)} />}
        {status === "ready" && products.length === 0 && (
          <EmptyState icon={SearchX} title="Nothing matches this filter" description="Try another filter or category." />
        )}
        {status === "ready" && products.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

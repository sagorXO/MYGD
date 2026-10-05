"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flame, Leaf, Search, SearchX, type LucideIcon } from "lucide-react";
import type { CategoryDTO, ProductDTO } from "@/types";
import { EmptyState, ErrorState } from "@/ui";
import { cn } from "@/lib/cn";
import { displayCategoryName, filterProducts, type MenuFilter } from "./menuModel";
import { MenuItemRow } from "./MenuItemRow";
import { ItemSheet } from "./ItemSheet";
import { useStore } from "./StoreContext";
import type { StoreLocation } from "./storeLocations";

type Status = "loading" | "ready" | "error";

interface MenuResponse {
  success: boolean;
  categories?: CategoryDTO[];
}

const FILTERS: { value: MenuFilter; label: string; icon?: LucideIcon }[] = [
  { value: "ALL", label: "Everything" },
  { value: "POPULAR", label: "Bestsellers" },
  { value: "VEGGIE", label: "Veggie", icon: Leaf },
  { value: "SPICY", label: "Spicy", icon: Flame },
];

const chipBase =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-4 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
const chipOn = "bg-[var(--brand-black)] text-[var(--mygd-gray-0)]";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MenuSection() {
  const { store } = useStore();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [filter, setFilter] = useState<MenuFilter>("ALL");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("");
  const [selected, setSelected] = useState<ProductDTO | null>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const navRef = useRef<HTMLElement>(null);

  const load = useCallback(async (slug: StoreLocation["slug"], signal?: AbortSignal) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/menu?location=${slug}`, { signal });
      if (!res.ok) throw new Error(`Menu request failed: ${res.status}`);
      const data = (await res.json()) as MenuResponse;
      if (!data.success) throw new Error("Menu request unsuccessful");
      setCategories(data.categories ?? []);
      setStatus("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to load menu", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(store.slug, controller.signal);
    return () => controller.abort();
  }, [store.slug, load]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((category) => ({
        category,
        products: filterProducts(category.products ?? [], filter).filter(
          (p) => !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.products.length > 0);
  }, [categories, filter, query]);

  // Scroll-spy: the category nearest the top of the viewport is the active chip.
  useEffect(() => {
    if (status !== "ready" || groups.length === 0) return;
    setActiveId((prev) => (groups.some((g) => g.category.id === prev) ? prev : groups[0].category.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = hit?.target.getAttribute("data-category-id");
        if (id) setActiveId(id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    sections.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [status, groups]);

  // Keep the active chip visible inside the horizontally scrolling nav.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) return;
    const chip = nav.querySelector<HTMLElement>(`[data-chip="${CSS.escape(activeId)}"]`);
    if (chip) nav.scrollTo({ left: chip.offsetLeft - 20, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [activeId]);

  const jumpTo = (id: string) => {
    setActiveId(id);
    sections.current.get(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  return (
    <section id="menu" aria-labelledby="menu-title" className="scroll-mt-16 border-t border-border-subtle">
      <div className="mx-auto max-w-6xl px-5 pt-16 md:px-8 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="menu-title" className="font-display text-4xl font-semibold uppercase text-text md:text-5xl">
              Menu
            </h2>
            <p className="mt-2 text-text-secondary">Prices at {store.name}, VAT included.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search aria-hidden width={16} height={16} strokeWidth={1.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              aria-label="Search the menu"
              className="h-11 w-full rounded-pill border border-border bg-surface pl-10 pr-4 text-sm text-text transition-colors duration-fast placeholder:text-text-subtle hover:border-border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>
        </div>
        <div role="group" aria-label="Filter the menu" className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map(({ value, label, icon: Glyph }) => {
            const on = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(value)}
                className={cn(chipBase, "border", on ? cn(chipOn, "border-[var(--brand-black)]") : "border-border text-text-secondary hover:border-border-input hover:text-text")}
              >
                {Glyph && <Glyph aria-hidden width={14} height={14} strokeWidth={1.75} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {status === "ready" && groups.length > 0 && (
        <div className="sticky top-16 z-20 mt-8 border-y border-border-subtle bg-surface">
          <nav ref={navRef} aria-label="Menu categories" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-2 [scrollbar-width:none] md:px-8">
            {groups.map(({ category }) => {
              const on = category.id === activeId;
              return (
                <button
                  key={category.id}
                  type="button"
                  data-chip={category.id}
                  aria-current={on ? "true" : undefined}
                  onClick={() => jumpTo(category.id)}
                  className={cn(chipBase, on ? chipOn : "text-text-secondary hover:bg-surface-hover hover:text-text")}
                >
                  {displayCategoryName(category.name)}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8" aria-busy={status === "loading" || undefined}>
        {status === "loading" && (
          <div aria-label="Loading menu" className="grid gap-x-10 pt-12 md:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex gap-4 border-b border-border-subtle py-5">
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-hover" />
                  <div className="h-3 w-5/6 animate-pulse rounded-sm bg-surface-hover" />
                  <div className="h-4 w-16 animate-pulse rounded-sm bg-surface-hover" />
                </div>
                <div className="h-24 w-24 animate-pulse rounded-md bg-surface-hover md:h-28 md:w-28" />
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="pt-12">
            <ErrorState title="We couldn't load the menu" description="Check your connection and try again." onRetry={() => void load(store.slug)} />
          </div>
        )}

        {status === "ready" && groups.length === 0 && (
          <div className="pt-12">
            <EmptyState icon={SearchX} title="Nothing matches" description="Try a different search or clear the filter." />
          </div>
        )}

        {status === "ready" &&
          groups.map(({ category, products }) => (
            <section
              key={category.id}
              data-category-id={category.id}
              ref={(el) => {
                if (el) sections.current.set(category.id, el);
                else sections.current.delete(category.id);
              }}
              aria-labelledby={`cat-${category.id}`}
              className="scroll-mt-36 pt-14"
            >
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <h3 id={`cat-${category.id}`} className="font-display text-2xl font-semibold uppercase text-text">
                  {displayCategoryName(category.name)}
                </h3>
                <span className="text-sm text-text-subtle">
                  {products.length} {products.length === 1 ? "item" : "items"}
                </span>
              </div>
              {category.description && <p className="mt-3 max-w-prose text-sm text-text-secondary">{category.description}</p>}
              <ul className="grid gap-x-10 md:grid-cols-2">
                {products.map((p) => (
                  <li key={p.id} className="border-b border-border-subtle">
                    <MenuItemRow product={p} onSelect={() => setSelected(p)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>

      <ItemSheet product={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

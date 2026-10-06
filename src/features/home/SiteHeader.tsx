"use client";

import { buttonClasses, Logo, ThemeToggle } from "@/ui";
import { StoreSwitcher, useStore } from "./StoreContext";

const LINKS = [
  { href: "#menu", label: "Menu" },
  { href: "#about", label: "Our döner" },
  { href: "#locations", label: "Locations" },
];

export function SiteHeader() {
  const { store } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 md:px-8">
        <a href="#top" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Logo size={36} />
          <span className="hidden font-display text-[17px] font-semibold uppercase tracking-[0.04em] text-text sm:inline">My German Döner</span>
        </a>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle surface="order" />
          <StoreSwitcher className="hidden sm:inline-flex" />
          <a href={store.delivery.href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary", size: "lg" })}>
            Order online
          </a>
        </div>
      </div>
    </header>
  );
}

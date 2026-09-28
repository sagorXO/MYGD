"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TabsProps {
  label: string;
  tabs: { id: string; label: string; badge?: ReactNode }[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function Tabs({ label, tabs, selected, onSelect, className }: TabsProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === selected);
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta || i < 0) return;
    e.preventDefault();
    const next = tabs[(i + delta + tabs.length) % tabs.length];
    onSelect(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t) => {
        const active = t.id === selected;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(t.id)}
            className={cn(
              "-mb-px inline-flex h-10 min-h-hit items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              active ? "border-accent text-text" : "border-transparent text-text-secondary hover:text-text",
            )}
          >
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}

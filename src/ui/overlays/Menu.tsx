"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/actions/Button";
import { IconButton } from "@/ui/actions/IconButton";

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  critical?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
  trigger?: "button" | "icon";
}

export function Menu({ label, items, trigger = "icon" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const nodes = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown" && nodes.length) {
      e.preventDefault();
      nodes[(i + 1) % nodes.length].focus();
    }
    if (e.key === "ArrowUp" && nodes.length) {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length].focus();
    }
  };

  const triggerProps = {
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    onClick: () => setOpen((v) => !v),
  };

  return (
    <div ref={root} className="relative inline-block" onKeyDown={onKeyDown}>
      {trigger === "icon" ? (
        <IconButton icon={MoreHorizontal} label={label} variant="secondary" {...triggerProps} />
      ) : (
        <Button variant="secondary" {...triggerProps}>
          {label}
        </Button>
      )}
      {open && (
        <div id={menuId} role="menu" aria-label={label} className="animate-in absolute right-0 z-40 mt-1 min-w-48 rounded-md bg-surface-raised p-1 shadow-2">
          {items.map(({ id, label: itemLabel, icon: Glyph, critical, onSelect }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                onSelect();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-surface-hover focus:bg-surface-hover focus:outline-none",
                critical ? "text-danger" : "text-text",
              )}
            >
              {Glyph && <Glyph aria-hidden width={16} height={16} strokeWidth={1.5} />}
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

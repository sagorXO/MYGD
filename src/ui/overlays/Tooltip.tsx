"use client";

import { cloneElement, useId, useState, type ReactElement } from "react";
import { cn } from "@/lib/cn";

interface TooltipProps {
  content: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          setOpen(false);
        }
      }}
    >
      {cloneElement(children, { "aria-describedby": id })}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-text px-2 py-1 text-xs text-surface shadow-2",
          open ? "block" : "sr-only",
        )}
      >
        {content}
      </span>
    </span>
  );
}

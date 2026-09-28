"use client";

import { cn } from "@/lib/cn";

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-md bg-surface-hover p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 min-h-hit rounded-sm px-3 text-sm font-medium transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            o.value === value ? "bg-surface text-text shadow-card" : "text-text-secondary hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

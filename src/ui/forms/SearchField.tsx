"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClasses } from "./Field";

interface SearchFieldProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchField({ id, label = "Search", value, onChange, placeholder, className }: SearchFieldProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search aria-hidden width={16} height={16} className="pointer-events-none absolute left-3 text-text-subtle" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses(false), "h-9 min-h-hit pl-9 pr-9")}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-sm text-text-subtle hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X aria-hidden width={14} height={14} />
        </button>
      )}
    </div>
  );
}

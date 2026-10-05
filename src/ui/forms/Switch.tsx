"use client";

import { cn } from "@/lib/cn";

interface SwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ id, label, checked, onChange, disabled = false, className }: SwitchProps) {
  return (
    <div className={cn("flex min-h-hit items-center gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-accent" : "bg-border-input",
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-pill bg-surface shadow-card transition-transform duration-fast", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
      <label htmlFor={id} className="text-sm text-text">
        {label}
      </label>
    </div>
  );
}

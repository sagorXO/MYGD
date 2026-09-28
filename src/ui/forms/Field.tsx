import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldA11y {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  labelHidden?: boolean;
  className?: string;
  children: (a11y: FieldA11y) => ReactNode;
}

export function inputClasses(invalid: boolean) {
  return cn(
    "w-full rounded-md border bg-surface px-3 text-text placeholder:text-text-subtle",
    "transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
    "disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-subtle",
    invalid ? "border-danger" : "border-border-input",
  );
}

export function Field({ id, label, hint, error, required, labelHidden = false, className, children }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const a11y: FieldA11y = { id, ...(describedBy ? { "aria-describedby": describedBy } : {}), ...(error ? { "aria-invalid": true as const } : {}) };
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={cn("block text-sm font-medium text-text", labelHidden && "sr-only")}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children(a11y)}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

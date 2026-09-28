import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, inputClasses } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ id, label, hint, error, options, placeholder, required, className, ...rest }: SelectProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => (
        <div className="relative">
          <select {...rest} {...a11y} required={required} className={cn(inputClasses(Boolean(error)), "h-9 min-h-hit appearance-none pr-9")}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden width={16} height={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
        </div>
      )}
    </Field>
  );
}

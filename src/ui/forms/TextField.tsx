import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, inputClasses } from "./Field";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "prefix"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  labelHidden?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function TextField({ id, label, hint, error, labelHidden, prefix, suffix, required, className, type = "text", ...rest }: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} labelHidden={labelHidden} className={className}>
      {(a11y) => (
        <div className="relative flex items-center">
          {prefix && <span className="pointer-events-none absolute left-3 text-text-subtle">{prefix}</span>}
          <input {...rest} {...a11y} type={type} required={required} className={cn(inputClasses(Boolean(error)), "h-9 min-h-hit", prefix && "pl-9", suffix && "pr-9")} />
          {suffix && <span className="absolute right-3 text-text-subtle">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

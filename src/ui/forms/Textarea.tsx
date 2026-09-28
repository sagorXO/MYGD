import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field, inputClasses } from "./Field";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function Textarea({ id, label, hint, error, required, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => <textarea {...rest} {...a11y} rows={rows} required={required} className={cn(inputClasses(Boolean(error)), "py-2")} />}
    </Field>
  );
}

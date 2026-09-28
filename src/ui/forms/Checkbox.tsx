import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  id: string;
  label: string;
  hint?: string;
}

export function choiceClasses(round: boolean) {
  return cn(
    "mt-0.5 h-4 w-4 shrink-0 border border-border-input bg-surface accent-[var(--color-accent)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
    round ? "rounded-pill" : "rounded-sm",
  );
}

export function Checkbox({ id, label, hint, className, ...rest }: ChoiceProps) {
  return (
    <div className={cn("flex min-h-hit items-start gap-2", className)}>
      <input {...rest} id={id} type="checkbox" aria-describedby={hint ? `${id}-hint` : undefined} className={choiceClasses(false)} />
      <label htmlFor={id} className="flex-1 cursor-pointer text-sm text-text">
        {label}
        {hint && (
          <span id={`${id}-hint`} className="block text-text-secondary">
            {hint}
          </span>
        )}
      </label>
    </div>
  );
}

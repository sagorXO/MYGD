import { cn } from "@/lib/cn";
import { choiceClasses, type ChoiceProps } from "./Checkbox";

export function Radio({ id, label, hint, className, ...rest }: ChoiceProps) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <input {...rest} id={id} type="radio" aria-describedby={hint ? `${id}-hint` : undefined} className={choiceClasses(true)} />
      <label htmlFor={id} className="text-sm text-text">
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

import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface FiltersProps {
  chips: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function Filters({ chips, onRemove, onClearAll, className }: FiltersProps) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span key={chip.key} className="inline-flex h-7 items-center gap-1 rounded-pill border border-border bg-surface pl-3 pr-1 text-sm text-text">
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter ${chip.label}`}
            onClick={() => onRemove(chip.key)}
            className="flex h-5 min-h-hit w-5 min-w-hit items-center justify-center rounded-pill text-text-subtle hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <X aria-hidden width={12} height={12} />
          </button>
        </span>
      ))}
      {onClearAll && (
        <button type="button" onClick={onClearAll} className="text-sm font-medium text-accent-text hover:underline">
          Clear all
        </button>
      )}
    </div>
  );
}

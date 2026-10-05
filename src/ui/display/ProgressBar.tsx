import { cn } from "@/lib/cn";

const TONE = { accent: "bg-accent", success: "bg-success", warning: "bg-warning", critical: "bg-danger" } as const;

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: keyof typeof TONE;
  className?: string;
}

export function ProgressBar({ value, label, tone = "accent", className }: ProgressBarProps) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn("h-2 w-full overflow-hidden rounded-pill bg-surface-hover", className)}>
      <div className={cn("h-full rounded-pill transition-[width] duration-base", TONE[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

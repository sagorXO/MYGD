import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Trend = "up" | "down" | "flat";

const TREND = {
  up: { cls: "text-success", Glyph: ArrowUpRight },
  down: { cls: "text-danger", Glyph: ArrowDownRight },
  flat: { cls: "text-text-secondary", Glyph: ArrowRight },
} as const;

interface StatProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; trend: Trend };
  className?: string;
}

export function Stat({ label, value, delta, className }: StatProps) {
  const trend = delta ? TREND[delta.trend] : null;
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-text">{value}</p>
      {delta && trend && (
        <p className={cn("inline-flex items-center gap-1 text-sm font-medium", trend.cls)}>
          <trend.Glyph aria-hidden width={16} height={16} />
          {delta.value}
        </p>
      )}
    </div>
  );
}

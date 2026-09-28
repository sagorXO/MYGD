import { cn } from "@/lib/cn";

type Variant = "text" | "block" | "card" | "table-row";
const BASE = "rounded-sm bg-surface-hover motion-safe:animate-pulse";

interface SkeletonProps {
  variant?: Variant;
  lines?: number;
  className?: string;
}

export function Skeleton({ variant = "text", lines = 1, className }: SkeletonProps) {
  if (variant === "block") return <div aria-hidden="true" className={cn(BASE, "h-24 w-full rounded-md", className)} />;
  if (variant === "card") {
    return (
      <div aria-hidden="true" className={cn("space-y-3 rounded-lg bg-surface p-4 shadow-card", className)}>
        <div data-skeleton-line className={cn(BASE, "h-4 w-1/3")} />
        <div data-skeleton-line className={cn(BASE, "h-3 w-full")} />
        <div data-skeleton-line className={cn(BASE, "h-3 w-5/6")} />
      </div>
    );
  }
  if (variant === "table-row") {
    return (
      <div aria-hidden="true" className={cn("flex items-center gap-4 border-b border-border-subtle px-4 py-3", className)}>
        <div data-skeleton-line className={cn(BASE, "h-4 w-4")} />
        <div data-skeleton-line className={cn(BASE, "h-3 flex-1")} />
        <div data-skeleton-line className={cn(BASE, "h-3 w-20")} />
      </div>
    );
  }
  const count = Number.isFinite(lines) ? Math.max(1, Math.floor(lines)) : 1;
  return (
    <div aria-hidden="true" className={cn("space-y-2", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} data-skeleton-line className={cn(BASE, "h-3", count > 1 && i === count - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

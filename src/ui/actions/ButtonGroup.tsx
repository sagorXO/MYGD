import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ButtonGroup({ attached = false, className, children }: { attached?: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center",
        attached ? "[&>*+*]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none" : "gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

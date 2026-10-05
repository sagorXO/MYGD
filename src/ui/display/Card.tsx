import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const PADDING = { none: "", sm: "p-3", md: "p-4 md:p-5" } as const;

interface CardProps {
  as?: "div" | "section" | "article";
  interactive?: boolean;
  selected?: boolean;
  padding?: keyof typeof PADDING;
  className?: string;
  children: ReactNode;
}

export function Card({ as: Tag = "div", interactive = false, selected = false, padding = "md", className, children }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg bg-surface text-text shadow-card",
        PADDING[padding],
        interactive && "cursor-pointer transition-colors duration-fast hover:bg-surface-hover",
        selected && "ring-2 ring-accent",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardSection({ subdued = false, className, children }: { subdued?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("-mx-4 border-t border-border-subtle px-4 py-3 md:-mx-5 md:px-5", subdued && "bg-canvas", className)}>
      {children}
    </div>
  );
}

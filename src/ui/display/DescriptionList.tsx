import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DescriptionListProps {
  items: { term: ReactNode; description: ReactNode }[];
  className?: string;
}

export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cn("divide-y divide-border-subtle", className)}>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 py-2">
          <dt className="text-sm text-text-secondary">{item.term}</dt>
          <dd className="col-span-2 text-sm text-text">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

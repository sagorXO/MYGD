import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-surface px-1 font-mono text-xs text-text-secondary">
      {children}
    </kbd>
  );
}

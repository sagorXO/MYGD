import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

const WIDTH = { default: "max-w-6xl", narrow: "max-w-3xl", full: "max-w-none" } as const;

interface PageProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  badges?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  width?: keyof typeof WIDTH;
  className?: string;
  children: ReactNode;
}

export function Page({ title, subtitle, backHref, backLabel = "Back", badges, primaryAction, secondaryActions, width = "default", className, children }: PageProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 md:px-6", WIDTH[width], className)}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <ArrowLeft aria-hidden width={18} height={18} strokeWidth={1.5} />
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-text">{title}</h1>
              {badges}
            </div>
            {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
          </div>
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

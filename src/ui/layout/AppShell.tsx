import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/ui/display/Logo";
import { ThemeToggle } from "@/ui/theme/ThemeToggle";
import type { Surface } from "@/ui/theme/theme";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

interface AppShellProps {
  surface: Surface;
  nav?: NavItem[];
  topBarSlot?: ReactNode;
  user?: ReactNode;
  fullBleed?: boolean;
  children: ReactNode;
}

export function AppShell({ surface, nav = [], topBarSlot, user, fullBleed = false, children }: AppShellProps) {
  if (fullBleed) {
    return (
      <main id="main" className="min-h-screen">
        {children}
      </main>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-text focus:shadow-3"
      >
        Skip to content
      </a>
      {/* Brand moment: the top bar is logo-black in both themes (spec §4.1, principle 7). */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-[var(--brand-black)] px-4 text-[var(--mygd-gray-0)]">
        <Logo size={36} />
        <span className="font-display text-lg uppercase tracking-wide">My German Doener</span>
        <div className="ml-auto flex items-center gap-3">
          {topBarSlot}
          <ThemeToggle surface={surface} />
          {user}
        </div>
      </header>
      <div className="flex flex-1">
        {nav.length > 0 && (
          <nav aria-label="Main" className="hidden w-60 shrink-0 border-r border-border bg-surface p-3 md:block">
            <ul className="space-y-0.5">
              {nav.map(({ href, label, icon: Glyph, active }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-fast",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                      active ? "bg-accent-subtle text-accent-text" : "text-text-secondary hover:bg-surface-hover hover:text-text",
                    )}
                  >
                    <Glyph aria-hidden width={18} height={18} strokeWidth={1.5} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

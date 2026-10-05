import { Logo } from "@/ui";

export function SiteFooter() {
  return (
    <footer id="about" className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-text-secondary md:px-6">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <p>Halal certified · HACCP food-safety certified · Est. 2025</p>
        </div>
        <p>© {new Date().getFullYear()} My German Doener, Cyprus</p>
      </div>
    </footer>
  );
}

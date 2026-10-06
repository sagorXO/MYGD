import { buttonClasses, Logo, ThemeToggle } from "@/ui";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#menu", label: "Menu" },
  { href: "#locations", label: "Locations" },
  { href: "#about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-[var(--brand-black)] text-[var(--mygd-gray-0)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
        <a href="#top" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Logo size={40} />
          <span className="hidden font-display text-lg uppercase tracking-wide sm:inline">My German Doener</span>
        </a>
        <nav aria-label="Main" className="ml-6 hidden items-center gap-6 text-sm md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-sm text-[var(--mygd-gray-400)] transition-colors duration-fast hover:text-[var(--mygd-gray-0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle surface="order" />
          <a href="https://wolt.com" target="_blank" rel="noopener noreferrer" className={cn(buttonClasses({ variant: "tertiary", size: "md" }), "hidden text-[var(--mygd-gray-0)] hover:text-text sm:inline-flex")}>
            Order on Wolt
          </a>
          <a href="https://foody.com.cy" target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary", size: "md" })}>
            Order on Foody
          </a>
        </div>
      </div>
    </header>
  );
}

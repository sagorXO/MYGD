import { Leaf, Sandwich, Soup } from "lucide-react";
import { Card, buttonClasses } from "@/ui";

const STATS = [
  { icon: Leaf, value: "100%", label: "Halal certified meat" },
  { icon: Sandwich, value: "Daily", label: "Fresh-baked bread" },
  { icon: Soup, value: "12+", label: "Homemade sauces" },
];

export function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:px-6 md:py-20">
      <div className="space-y-6">
        <p className="text-sm font-medium text-accent-text">Authentic Berlin street food · Paphos &amp; Limassol</p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-text md:text-7xl">
          Bite the <span className="text-accent">hype.</span>
        </h1>
        <p className="max-w-prose text-base text-text-secondary md:text-lg">
          Freshly carved veal, beef and chicken, roasted on open vertical spits. Served in toasted Turkish flatbread with crisp red
          cabbage, fresh herbs and our homemade garlic &amp; Kräuter sauces.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="#menu" className={buttonClasses({ variant: "primary", size: "lg" })}>
            Explore the menu
          </a>
          <a href="#locations" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Find our stores
          </a>
        </div>
        <ul className="grid grid-cols-3 gap-3 pt-2">
          {STATS.map(({ icon: Glyph, value, label }) => (
            <li key={label}>
              <Card padding="sm" className="h-full">
                <Glyph aria-hidden width={20} height={20} strokeWidth={1.5} className="text-accent-text" />
                <p className="mt-2 text-lg font-semibold text-text">{value}</p>
                <p className="text-xs text-text-secondary">{label}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <Card padding="none" className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- local static board artwork */}
        <img src="/assets/boards/board-1-doener-wraps-bigs-bowls.jpg" alt="Döner, wraps and bowls from our menu board" className="aspect-[4/3] w-full object-cover" />
      </Card>
    </section>
  );
}

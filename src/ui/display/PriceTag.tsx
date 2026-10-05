import { cn } from "@/lib/cn";
import { formatEuro } from "@/lib/i18n";
import type { Locale } from "@/types";

const SIZE = { sm: "text-sm", md: "text-base", lg: "text-xl font-semibold", xl: "text-3xl font-bold" } as const;

interface PriceTagProps {
  /** Amount in euros — the unit used by formatEuro and the menu data. */
  amount: number;
  locale?: Locale;
  size?: keyof typeof SIZE;
  strike?: boolean;
  className?: string;
}

export function PriceTag({ amount, locale = "en", size = "md", strike = false, className }: PriceTagProps) {
  const text = Number.isFinite(amount) ? formatEuro(amount, locale) : "—";
  const cls = cn("tabular-nums", SIZE[size], strike && "text-text-subtle", className);
  return strike ? <del className={cls}>{text}</del> : <span className={cls}>{text}</span>;
}

import { UtensilsCrossed } from "lucide-react";
import type { ProductDTO } from "@/types";
import { Badge } from "@/ui";
import { formatEuro } from "@/lib/i18n";
import { productBadges } from "./menuModel";

interface MenuItemRowProps {
  product: ProductDTO;
  onSelect: () => void;
}

/** Delivery-app row: text first, price under the name, photo on a black plate to the right. */
export function MenuItemRow({ product, onSelect }: MenuItemRowProps) {
  const badges = productBadges(product);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-start gap-4 rounded-sm py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
    >
      <span className="block min-w-0 flex-1">
        <span className="block font-semibold text-text transition-colors duration-fast group-hover:text-accent-text">{product.name}</span>
        {product.description && <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-text-secondary">{product.description}</span>}
        <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[15px] font-semibold tabular-nums text-text">{formatEuro(product.basePrice)}</span>
          {badges.map((b) => (
            <Badge key={b.label} tone={b.tone}>
              {b.label}
            </Badge>
          ))}
        </span>
      </span>
      <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--brand-black)] md:h-28 md:w-28">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- menu photos are local static assets
          <img src={product.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed aria-hidden width={24} height={24} strokeWidth={1.5} className="text-[var(--mygd-gray-550)]" />
        )}
      </span>
    </button>
  );
}

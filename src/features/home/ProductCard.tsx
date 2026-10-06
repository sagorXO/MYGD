import { UtensilsCrossed } from "lucide-react";
import { Badge, Card, PriceTag } from "@/ui";
import { productBadges, type MenuProduct } from "./menuModel";

export function ProductCard({ product }: { product: MenuProduct }) {
  const badges = productBadges(product);
  return (
    <Card as="article" padding="none" className="flex flex-col overflow-hidden">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote menu photos; next/image host config lands with the /api image proxy
        <img src={product.imageUrl} alt="" loading="lazy" className="aspect-[4/3] w-full bg-surface-hover object-cover" />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface-hover text-text-subtle">
          <UtensilsCrossed aria-hidden width={32} height={32} strokeWidth={1.5} />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <Badge key={b.label} tone={b.tone}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
        <h3 className="font-semibold text-text">{product.name}</h3>
        {product.description && <p className="line-clamp-2 text-sm text-text-secondary">{product.description}</p>}
        {product.allowMealUpgrade && (
          <div className="mt-2 rounded-lg border border-border bg-surface-subtle p-2">
            <div className="flex items-center justify-between text-xs font-semibold text-text">
              <span className="text-accent-text font-bold">Make it a Menu (+€3.00)</span>
              <span className="text-[10px] font-medium text-text-secondary">Fries/Rice + 0.4L Drink</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="overflow-hidden rounded border border-border/80" title="Crispy Golden Fries">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/menu/upgrade/fries.jpg" alt="Crispy Fries" className="h-8 w-8 object-cover" />
              </div>
              <span className="text-[10px] font-semibold text-text-subtle">or</span>
              <div className="overflow-hidden rounded border border-border/80" title="Steamed Basmati Rice">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/menu/upgrade/rice.jpg" alt="Steamed Rice" className="h-8 w-8 object-cover" />
              </div>
              <span className="text-[10px] font-semibold text-text-subtle">+</span>
              <div className="overflow-hidden rounded border border-border/80" title="0.4L Chilled Soft Drink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/menu/upgrade/drink.jpg" alt="0.4L Drink" className="h-8 w-8 object-cover" />
              </div>
            </div>
          </div>
        )}
        <PriceTag amount={product.basePrice} size="lg" className="mt-auto pt-2 font-mono" />
      </div>
    </Card>
  );
}

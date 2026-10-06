"use client";

import { useEffect, useState } from "react";
import type { ProductDTO } from "@/types";
import { Badge, Sheet, Switch, buttonClasses } from "@/ui";
import { formatEuro } from "@/lib/i18n";
import { productBadges } from "./menuModel";
import { useStore } from "./StoreContext";

function normalizeAllergens(raw: ProductDTO["allergens"]): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

const MENU_UPGRADE = 3;

interface ItemSheetProps {
  product: ProductDTO | null;
  onClose: () => void;
}

export function ItemSheet({ product, onClose }: ItemSheetProps) {
  const { store } = useStore();
  const [asMenu, setAsMenu] = useState(false);
  useEffect(() => setAsMenu(false), [product?.id]);
  if (!product) return null;
  const total = product.basePrice + (asMenu && product.allowMealUpgrade ? MENU_UPGRADE : 0);

  const badges = productBadges(product);
  const allergens = normalizeAllergens(product.allergens);
  const groups = (product.modifierGroups ?? []).filter((g) => g.modifiers.length > 0);

  return (
    <Sheet
      open
      onClose={onClose}
      title={product.name}
      side="right"
      footer={
        <div className="w-full">
          <p className="mb-3 flex items-baseline justify-between text-text">
            <span className="text-sm text-text-secondary">Total</span>
            <span className="text-2xl font-semibold tabular-nums">{formatEuro(total)}</span>
          </p>
          <a href={store.delivery.href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}>
            {store.delivery.label}
          </a>
          <p className="mt-2 text-center text-xs text-text-subtle">You&apos;ll finish your order on {store.delivery.partner}.</p>
        </div>
      }
    >
      {product.imageUrl && (
        <div className="-mx-5 -mt-4 mb-5 bg-[var(--brand-black)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- menu photos are local static assets */}
          <img src={product.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xl font-semibold tabular-nums text-text">{formatEuro(product.basePrice)}</p>
        {badges.map((b) => (
          <Badge key={b.label} tone={b.tone}>
            {b.label}
          </Badge>
        ))}
      </div>
      {product.description && <p className="mt-3 leading-relaxed text-text-secondary">{product.description}</p>}

      {product.allowMealUpgrade && (
        <div className="mt-6 rounded-md border border-border-subtle p-4">
          <p className="font-medium text-text">Make it a menu (+{formatEuro(MENU_UPGRADE)})</p>
          <p className="mt-1 text-sm text-text-secondary">Fries or rice, plus a 0.4 L drink.</p>
          <Switch id="make-it-a-menu" label={asMenu ? "Menu included" : "Add the menu"} checked={asMenu} onChange={setAsMenu} className="mt-2" />
        </div>
      )}

      {groups.length > 0 && (
        <section aria-labelledby="item-options" className="mt-8">
          <h3 id="item-options" className="text-sm font-semibold text-text">
            Options
          </h3>
          <div className="mt-3 space-y-5">
            {groups.map((g) => (
              <div key={g.id}>
                <p className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-text">{g.name}</span>
                  <span className="text-text-subtle">
                    {g.isRequired ? "Required" : "Optional"}
                    {g.maxSelected > 1 ? `, up to ${g.maxSelected}` : ""}
                  </span>
                </p>
                <ul className="mt-2 divide-y divide-border-subtle rounded-md border border-border-subtle">
                  {g.modifiers.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                      <span className="text-text">{m.name}</span>
                      {m.priceAdjustment > 0 && <span className="tabular-nums text-text-secondary">+{formatEuro(m.priceAdjustment)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="item-allergens" className="mt-8">
        <h3 id="item-allergens" className="text-sm font-semibold text-text">
          Allergens
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          {allergens.length > 0 ? allergens.join(", ") : "Ask our team about allergens before you order."}
        </p>
        {product.calories ? <p className="mt-1 text-sm text-text-subtle">{product.calories} kcal</p> : null}
      </section>
    </Sheet>
  );
}

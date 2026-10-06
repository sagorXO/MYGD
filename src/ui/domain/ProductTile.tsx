import React from "react";

export type ProductAvailability = "available" | "sold-out" | "low-stock" | "channel-unavailable";

export interface ProductTileProps {
  title: string;
  price: number;
  availability?: ProductAvailability;
  stockCount?: number;
  imageUrl?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export function ProductTile({
  title,
  price,
  availability = "available",
  stockCount,
  imageUrl,
  description,
  onClick,
  className = "",
}: ProductTileProps): React.JSX.Element {
  const isSoldOut = availability === "sold-out";
  const isLowStock = availability === "low-stock";

  const formattedPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);

  return (
    <button
      type="button"
      data-availability={availability}
      aria-disabled={isSoldOut ? true : undefined}
      disabled={isSoldOut}
      onClick={isSoldOut ? undefined : onClick}
      className={`group relative flex flex-col justify-between p-4 min-h-[110px] text-left bg-surface border border-border rounded-[20px] transition-all duration-150 active:scale-[0.98] select-none ${
        isSoldOut
          ? "opacity-55 cursor-not-allowed border-border-subtle"
          : "hover:border-accent hover:shadow-sm cursor-pointer"
      } ${className}`}
    >
      {/* Top Header / Badges */}
      <div className="flex items-start justify-between gap-2 w-full">
        <h4 className="font-semibold text-base text-text leading-snug line-clamp-2">
          {title}
        </h4>

        {isSoldOut && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-danger-subtle text-danger border border-danger/20">
            SOLD OUT
          </span>
        )}

        {isLowStock && stockCount !== undefined && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning-subtle text-warning border border-warning/20">
            LOW STOCK: {stockCount}
          </span>
        )}
      </div>

      {/* Description if present */}
      {description && !isSoldOut && (
        <p className="text-xs text-text-secondary line-clamp-1 mt-1">{description}</p>
      )}

      {/* Footer / Price */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle w-full">
        <span className="text-sm font-bold text-text tabular-nums tracking-tight">
          {formattedPrice}
        </span>
        {!isSoldOut && (
          <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
            + Add
          </span>
        )}
      </div>
    </button>
  );
}

import React from "react";

export type KdsTimingTier = "normal" | "warning" | "late";

export function resolveKdsTimingState(elapsedSeconds: number): KdsTimingTier {
  if (elapsedSeconds <= 300) return "normal"; // 0-5 min
  if (elapsedSeconds <= 480) return "warning"; // 5-8 min
  return "late"; // 8+ min
}

export interface OrderTicketItem {
  name: string;
  quantity: number;
  modifiers?: string[];
}

export interface OrderTicketProps {
  orderNumber: string;
  channel: "dine-in" | "takeaway" | "delivery" | string;
  elapsedSeconds: number;
  items: OrderTicketItem[];
  onBump?: () => void;
  bumpLabel?: string;
  className?: string;
}

export function OrderTicket({
  orderNumber,
  channel,
  elapsedSeconds,
  items,
  onBump,
  bumpLabel = "START",
  className = "",
}: OrderTicketProps): React.JSX.Element {
  const tier = resolveKdsTimingState(elapsedSeconds);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timerFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const tierStyles = {
    normal: {
      border: "border-border",
      badgeBg: "bg-success-subtle text-success border-success/40",
      accent: "bg-success",
    },
    warning: {
      border: "border-warning",
      badgeBg: "bg-warning-subtle text-warning border-warning/40",
      accent: "bg-warning",
    },
    late: {
      border: "border-danger ring-2 ring-danger/30",
      badgeBg: "bg-danger text-on-accent border-transparent animate-pulse",
      accent: "bg-danger",
    },
  }[tier];

  return (
    <article
      data-timing-state={tier}
      data-bump-target="64px"
      className={`flex flex-col justify-between w-full min-w-[280px] max-w-[360px] bg-surface-raised text-text rounded-xl border ${tierStyles.border} overflow-hidden shadow-md select-none ${className}`}
    >
      {/* Header */}
      <div className="p-4 bg-surface border-b border-border flex items-center justify-between">
        <div>
          <span className="text-xl font-black tabular-nums tracking-wide">#{orderNumber}</span>
          <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {channel}
          </span>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums border ${tierStyles.badgeBg}`}
        >
          {timerFormatted}
        </span>
      </div>

      {/* Items Body */}
      <div className="p-4 flex-1 space-y-3 overflow-y-auto min-h-[160px]">
        {items.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="border-b border-border-subtle pb-2.5 last:border-none">
            <div className="flex items-start gap-2">
              <span className="font-bold text-base tabular-nums text-accent">
                {item.quantity}×
              </span>
              <span className="font-semibold text-base text-text">{item.name}</span>
            </div>
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ml-6 mt-1 flex flex-wrap gap-1">
                {item.modifiers.map((mod, mIdx) => {
                  const isCaution = mod.toUpperCase().includes("NO ");
                  return (
                    <span
                      key={`${mod}-${mIdx}`}
                      className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        isCaution
                          ? "bg-danger-subtle text-danger border border-danger/30 uppercase"
                          : "text-text-secondary"
                      }`}
                    >
                      {mod}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer / 64px Bump Button */}
      {onBump && (
        <div className="p-3 bg-surface border-t border-border">
          <button
            type="button"
            onClick={onBump}
            className={`w-full min-h-[64px] h-16 flex items-center justify-center font-bold text-lg rounded-xl text-on-accent transition-all active:scale-[0.98] ${
              tier === "late" ? "bg-danger hover:opacity-90" : "bg-success hover:opacity-90"
            }`}
          >
            {bumpLabel}
          </button>
        </div>
      )}
    </article>
  );
}

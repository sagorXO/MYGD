import React from "react";

export interface OfflineBannerProps {
  mode?: "local-mode" | "cloud-connected" | "reconnecting" | string;
  queuedCount?: number;
  lastSync?: string;
  className?: string;
}

export function OfflineBanner({
  mode = "local-mode",
  queuedCount,
  lastSync,
  className = "",
}: OfflineBannerProps): React.JSX.Element {
  const isLocal = mode === "local-mode";

  return (
    <aside
      role="status"
      data-mode={mode}
      aria-live="polite"
      className={`flex items-center justify-between gap-4 px-4 py-3 bg-surface-hover border-b border-border text-text transition-colors select-none ${className}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-2.5 w-2.5 rounded-full shrink-0 ${
            isLocal ? "bg-warning animate-pulse" : "bg-success"
          }`}
          aria-hidden="true"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm">
          <strong className="font-semibold tracking-wide">
            {isLocal ? "LOCAL OPERATING MODE" : "CLOUD CONNECTED"}
          </strong>
          <span className="text-xs text-text-secondary">
            {isLocal
              ? "Store running autonomously on local till server. Transactions queued safely."
              : "System synchronized with cloud backend."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-xs text-text-secondary tabular-nums">
        {queuedCount !== undefined && (
          <span className="px-2 py-0.5 rounded font-medium bg-surface border border-border">
            {queuedCount} queued
          </span>
        )}
        {lastSync && <span>Last sync: {lastSync}</span>}
      </div>
    </aside>
  );
}

import React from "react";

export type PrinterHealthStatus = "online" | "offline" | "out-of-paper" | "error";

export interface PrinterStatusProps {
  name: string;
  ipAddress: string;
  port: number;
  status: PrinterHealthStatus;
  paperLevel?: "ok" | "low" | "empty";
  onTestPrint?: () => void;
  className?: string;
}

export function PrinterStatus({
  name,
  ipAddress,
  port,
  status,
  paperLevel = "ok",
  onTestPrint,
  className = "",
}: PrinterStatusProps): React.JSX.Element {
  const isOnline = status === "online";

  const statusDisplay = {
    online: {
      label: "Online",
      dotClass: "bg-success",
      badgeClass: "bg-success-subtle text-success border-success/30",
    },
    offline: {
      label: "Offline",
      dotClass: "bg-text-subtle",
      badgeClass: "bg-surface-hover text-text-secondary border-border",
    },
    "out-of-paper": {
      label: "Out of Paper",
      dotClass: "bg-danger",
      badgeClass: "bg-danger-subtle text-danger border-danger/30",
    },
    error: {
      label: "Printer Error",
      dotClass: "bg-danger",
      badgeClass: "bg-danger-subtle text-danger border-danger/30",
    },
  }[status];

  return (
    <div
      data-status={status}
      role="region"
      aria-label={`Printer ${name}`}
      className={`p-4 bg-surface border border-border rounded-xl flex items-center justify-between gap-4 transition-all ${className}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-3 h-3 rounded-full shrink-0 ${statusDisplay.dotClass}`}
          aria-hidden="true"
        />
        <div>
          <h4 className="font-semibold text-sm text-text leading-tight">{name}</h4>
          <p className="text-xs text-text-secondary font-mono tabular-nums mt-0.5">
            TCP {ipAddress}:{port}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums border ${statusDisplay.badgeClass}`}
        >
          {statusDisplay.label}
        </span>

        {paperLevel !== "ok" && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-subtle text-warning border border-warning/30">
            Paper: {paperLevel}
          </span>
        )}

        {onTestPrint && isOnline && (
          <button
            type="button"
            onClick={onTestPrint}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-surface-hover hover:bg-surface-raised border border-border text-text transition-colors active:scale-[0.98]"
          >
            Test
          </button>
        )}
      </div>
    </div>
  );
}

import React from "react";

export type OperationalStatus =
  | "online"
  | "ready"
  | "paid"
  | "preparing"
  | "waiting"
  | "low-stock"
  | "late"
  | "failed"
  | "offline"
  | "sold-out"
  | "available";

export interface StatusBadgeProps {
  status: OperationalStatus;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  OperationalStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  online: {
    label: "Online",
    dotClass: "bg-success",
    bgClass: "bg-success-subtle",
    textClass: "text-success",
  },
  ready: {
    label: "Ready",
    dotClass: "bg-success",
    bgClass: "bg-success-subtle",
    textClass: "text-success",
  },
  paid: {
    label: "Paid",
    dotClass: "bg-success",
    bgClass: "bg-success-subtle",
    textClass: "text-success",
  },
  available: {
    label: "Available",
    dotClass: "bg-success",
    bgClass: "bg-success-subtle",
    textClass: "text-success",
  },
  preparing: {
    label: "Preparing",
    dotClass: "bg-info",
    bgClass: "bg-info-subtle",
    textClass: "text-info",
  },
  waiting: {
    label: "Waiting",
    dotClass: "bg-text-subtle",
    bgClass: "bg-surface-hover",
    textClass: "text-text-secondary",
  },
  "low-stock": {
    label: "Low Stock",
    dotClass: "bg-warning",
    bgClass: "bg-warning-subtle",
    textClass: "text-warning",
  },
  late: {
    label: "Late",
    dotClass: "bg-danger",
    bgClass: "bg-danger-subtle",
    textClass: "text-danger",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-danger",
    bgClass: "bg-danger-subtle",
    textClass: "text-danger",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-text-subtle",
    bgClass: "bg-surface-hover",
    textClass: "text-text-secondary",
  },
  "sold-out": {
    label: "Sold Out",
    dotClass: "bg-danger",
    bgClass: "bg-danger-subtle",
    textClass: "text-danger",
  },
};

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.waiting;
  const displayText = label ?? config.label;

  return (
    <span
      role="status"
      data-status={status}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold tabular-nums border border-current/15 ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
}

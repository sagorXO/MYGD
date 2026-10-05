import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type BannerTone = "info" | "success" | "warning" | "critical";

const STYLE: Record<BannerTone, { box: string; icon: LucideIcon }> = {
  info: { box: "bg-info-subtle text-info", icon: Info },
  success: { box: "bg-success-subtle text-success", icon: CheckCircle2 },
  warning: { box: "bg-warning-subtle text-warning", icon: AlertTriangle },
  critical: { box: "bg-danger-subtle text-danger", icon: XCircle },
};

interface BannerProps {
  tone?: BannerTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ tone = "info", title, children, action, onDismiss, className }: BannerProps) {
  const { box, icon: Glyph } = STYLE[tone];
  return (
    <div role={tone === "critical" || tone === "warning" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg p-3", box, className)}>
      <Glyph aria-hidden width={20} height={20} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="flex h-8 min-h-hit w-8 min-w-hit shrink-0 items-center justify-center rounded-sm hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <X aria-hidden width={16} height={16} />
        </button>
      )}
    </div>
  );
}

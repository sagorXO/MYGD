import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "success" | "warning" | "critical" | "highlight" | "accent";

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-hover text-text-secondary",
  info: "bg-info-subtle text-info",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  critical: "bg-danger-subtle text-danger",
  highlight: "bg-highlight-subtle text-highlight",
  accent: "bg-accent-subtle text-accent-text",
};

const SIZE = { sm: "h-5 px-1.5 text-xs gap-1", md: "h-6 px-2 text-sm gap-1.5" } as const;

interface BadgeProps {
  tone?: Tone;
  size?: keyof typeof SIZE;
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", size = "sm", dot = false, icon: Glyph, className, children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-pill font-medium", TONE_CLASSES[tone], SIZE[size], className)}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-current" />}
      {Glyph && <Glyph aria-hidden width={12} height={12} strokeWidth={2} />}
      {children}
    </span>
  );
}

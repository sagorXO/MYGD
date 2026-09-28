import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconSize = 16 | 20 | 24;

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  /** Provide only when the icon carries meaning on its own. */
  label?: string;
  className?: string;
}

export function Icon({ icon: Glyph, size = 20, label, className }: IconProps) {
  return (
    <Glyph
      width={size}
      height={size}
      strokeWidth={1.5}
      className={cn("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}

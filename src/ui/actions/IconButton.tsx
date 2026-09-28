import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

const SQUARE: Record<ButtonSize, string> = { sm: "w-8 px-0", md: "w-9 px-0", lg: "w-11 px-0", xl: "min-w-hit px-0" };
const ICON: Record<ButtonSize, number> = { sm: 16, md: 16, lg: 20, xl: 24 };

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  /** Required accessible name (also shown as the native tooltip). */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function IconButton({ icon: Glyph, label, variant = "tertiary", size = "md", type = "button", className, ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cn(buttonClasses({ variant, size }), SQUARE[size], className)} {...rest}>
      <Glyph aria-hidden width={ICON[size]} height={ICON[size]} strokeWidth={1.5} />
    </button>
  );
}

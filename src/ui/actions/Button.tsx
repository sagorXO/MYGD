import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/ui/primitives/Spinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "critical" | "plain";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent font-semibold shadow-card hover:bg-accent-hover",
  secondary: "bg-surface text-text font-medium shadow-card hover:bg-surface-hover",
  tertiary: "bg-transparent text-text font-medium hover:bg-surface-hover",
  critical: "bg-danger text-surface font-semibold hover:opacity-90",
  plain: "bg-transparent text-accent-text font-medium underline-offset-4 hover:underline !px-0",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-11 px-5 text-base rounded-md",
  xl: "min-h-hit px-6 text-lg rounded-lg",
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 16, lg: 20, xl: 24 };

export function buttonClasses({ variant, size, fullWidth = false }: { variant: ButtonVariant; size: ButtonSize; fullWidth?: boolean }) {
  return cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap transition-colors duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
    VARIANT[variant],
    SIZE[size],
    fullWidth && "w-full",
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Glyph,
  iconPosition = "start",
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const glyph = Glyph ? <Glyph aria-hidden width={ICON_SIZE[size]} height={ICON_SIZE[size]} strokeWidth={1.5} /> : null;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {iconPosition === "start" && glyph}
        {children}
        {iconPosition === "end" && glyph}
      </span>
      {loading && <Spinner size="sm" label="Loading" className="absolute" />}
    </button>
  );
}

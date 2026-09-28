import { cn } from "@/lib/cn";

export const LOGO_ALT = "My German Doener — Bite the Hype";
const LOGO_SRC = "/assets/brand/logo-badge.webp";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  // eslint-disable-next-line @next/next/no-img-element -- static brand asset; plain img keeps the kit renderable outside Next (tests, gallery)
  return <img src={LOGO_SRC} alt={LOGO_ALT} width={size} height={size} decoding="async" className={cn("shrink-0 rounded-pill", className)} />;
}

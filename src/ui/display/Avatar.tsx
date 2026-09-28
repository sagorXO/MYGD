import { cn } from "@/lib/cn";

const SIZE = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm" } as const;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZE;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const box = cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-accent-subtle font-semibold text-accent-text", SIZE[size], className);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- small local staff photos
    return <img src={src} alt={name} className={cn(box, "object-cover")} />;
  }
  return (
    <span role="img" aria-label={name} className={box}>
      {initials(name)}
    </span>
  );
}

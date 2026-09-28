import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZE = { sm: "h-10 w-10", md: "h-14 w-14", lg: "h-20 w-20" } as const;

interface ThumbnailProps {
  src?: string;
  alt: string;
  size?: keyof typeof SIZE;
  className?: string;
}

export function Thumbnail({ src, alt, size = "md", className }: ThumbnailProps) {
  const box = cn("shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface-hover", SIZE[size], className);
  if (!src) {
    return (
      <span role="img" aria-label={alt} className={cn(box, "flex items-center justify-center text-text-subtle")}>
        <ImageOff aria-hidden width={16} height={16} />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- small local product images; next/image would need host config per surface
  return <img src={src} alt={alt} loading="lazy" className={cn(box, "object-cover")} />;
}

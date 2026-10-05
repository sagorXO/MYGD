import { cn } from "@/lib/cn";

const SIZE = { sm: "h-4 w-4 border-2", md: "h-5 w-5 border-2", lg: "h-8 w-8 border-[3px]" } as const;

interface SpinnerProps {
  size?: keyof typeof SIZE;
  label?: string;
  className?: string;
}

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <span aria-hidden className={cn("inline-block animate-spin rounded-pill border-current border-t-transparent motion-reduce:animate-none", SIZE[size])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

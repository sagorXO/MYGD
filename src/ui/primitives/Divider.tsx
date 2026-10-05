import { cn } from "@/lib/cn";

export function Divider({ className }: { className?: string }) {
  return <hr role="separator" className={cn("border-0 border-t border-border-subtle", className)} />;
}

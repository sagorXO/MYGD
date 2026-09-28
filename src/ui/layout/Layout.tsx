import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Layout({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-3", className)}>{children}</div>;
}

export function LayoutSection({ variant = "main", className, children }: { variant?: "main" | "aside"; className?: string; children: ReactNode }) {
  return <div className={cn("space-y-4", variant === "main" ? "lg:col-span-2" : "lg:col-span-1", className)}>{children}</div>;
}

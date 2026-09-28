import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
const GAP: Record<Gap, string> = { 0: "gap-0", 1: "gap-1", 2: "gap-2", 3: "gap-3", 4: "gap-4", 5: "gap-5", 6: "gap-6", 8: "gap-8" };
const ALIGN = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;
const JUSTIFY = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" } as const;
const COLS = { 1: "grid-cols-1", 2: "grid-cols-1 md:grid-cols-2", 3: "grid-cols-1 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4" } as const;

type Tag = "div" | "section" | "ul" | "ol";

interface StackProps {
  gap?: Gap;
  align?: keyof typeof ALIGN;
  as?: Tag;
  className?: string;
  children: ReactNode;
}

export function Stack({ gap = 4, align = "stretch", as: Tag = "div", className, children }: StackProps) {
  return <Tag className={cn("flex flex-col", GAP[gap], ALIGN[align], className)}>{children}</Tag>;
}

interface InlineProps extends StackProps {
  justify?: keyof typeof JUSTIFY;
  wrap?: boolean;
}

export function Inline({ gap = 2, align = "center", justify = "start", wrap = false, as: Tag = "div", className, children }: InlineProps) {
  return <Tag className={cn("flex", GAP[gap], ALIGN[align], JUSTIFY[justify], wrap && "flex-wrap", className)}>{children}</Tag>;
}

interface GridProps extends Omit<StackProps, "align"> {
  columns?: keyof typeof COLS;
}

export function Grid({ columns = 2, gap = 4, as: Tag = "div", className, children }: GridProps) {
  return <Tag className={cn("grid", COLS[columns], GAP[gap], className)}>{children}</Tag>;
}

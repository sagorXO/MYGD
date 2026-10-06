import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initialTheme, type Surface } from "./theme";
import { themeBootScript } from "./bootScript";

interface SurfaceRootProps {
  surface: Surface;
  className?: string;
  children: ReactNode;
}

/** Wraps one surface (route group): sets density and theme tokens for everything inside. */
export function SurfaceRoot({ surface, className, children }: SurfaceRootProps) {
  return (
    <div
      data-surface={surface}
      data-theme={initialTheme(surface)}
      suppressHydrationWarning
      className={cn("min-h-screen font-body antialiased bg-canvas text-text", className)}
    >
      <script dangerouslySetInnerHTML={{ __html: themeBootScript(surface) }} />
      {children}
    </div>
  );
}

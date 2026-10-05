"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Menu as MenuIcon } from "lucide-react";
import { IconButton } from "@/ui/actions/IconButton";
import { Sheet } from "@/ui/overlays/Sheet";

/**
 * Navigation below the md breakpoint. The nav list is rendered by the (server) AppShell and passed
 * in as children, because icon components cannot cross the server/client boundary as props.
 */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeOnLink = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  };
  return (
    <div className="md:hidden">
      <IconButton icon={MenuIcon} label="Open navigation" onClick={() => setOpen(true)} className="text-[var(--mygd-gray-0)] hover:text-text" />
      <Sheet open={open} onClose={() => setOpen(false)} title="Menu" side="bottom">
        <div onClick={closeOnLink}>{children}</div>
      </Sheet>
    </div>
  );
}

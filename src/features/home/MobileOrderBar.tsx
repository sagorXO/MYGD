"use client";

import { Phone } from "lucide-react";
import { buttonClasses } from "@/ui";
import { useStore } from "./StoreContext";

/** Phones only: Order and Call stay one tap away while the visitor scrolls the menu. */
export function MobileOrderBar() {
  const { store } = useStore();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 md:hidden">
      <a href={store.phoneHref} className={buttonClasses({ variant: "secondary", size: "lg" })} aria-label={`Call ${store.name}`}>
        <Phone aria-hidden width={20} height={20} strokeWidth={1.5} />
      </a>
      <a href={store.delivery.href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}>
        {store.delivery.label}
      </a>
    </div>
  );
}

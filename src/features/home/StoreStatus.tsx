"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/ui";
import { storeStatus, type StoreStatusInfo } from "./storeHours";
import type { StoreLocation } from "./storeLocations";

/** Open-now chip. Computed after mount so server and client markup match; refreshed every minute. */
export function StoreStatus({ store, size = "md" }: { store: StoreLocation; size?: "sm" | "md" }) {
  const [status, setStatus] = useState<StoreStatusInfo | null>(null);
  useEffect(() => {
    const tick = () => setStatus(storeStatus(store));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [store]);
  if (!status) return <span aria-hidden className="inline-block h-6" />;
  return (
    <Badge tone={status.open ? "success" : "neutral"} size={size} dot>
      {status.label}
    </Badge>
  );
}

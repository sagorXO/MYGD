import type { StoreLocation } from "./storeLocations";

export interface StoreStatusInfo {
  open: boolean;
  label: string;
}

const TIME_ZONE = "Asia/Nicosia";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes since local midnight in Cyprus, whatever the visitor's own time zone is. */
export function minutesInCyprus(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** Open now / closed for a store with one daily opening window. */
export function storeStatus(store: Pick<StoreLocation, "opens" | "closes">, now: Date = new Date()): StoreStatusInfo {
  const minutes = minutesInCyprus(now);
  const opens = toMinutes(store.opens);
  const closes = toMinutes(store.closes);
  if (minutes >= opens && minutes < closes) return { open: true, label: `Open now · until ${store.closes}` };
  if (minutes < opens) return { open: false, label: `Closed · opens ${store.opens}` };
  return { open: false, label: `Closed · opens tomorrow ${store.opens}` };
}

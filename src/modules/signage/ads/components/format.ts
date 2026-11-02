// Display text for the ads admin (pure).
import { formatClock } from "../ads.schema";
import type { ItemStatus } from "../status";
import type { AdminItem } from "./adsApi";

export const WEEKDAYS = [
  { n: 1, short: "Mon" }, { n: 2, short: "Tue" }, { n: 3, short: "Wed" }, { n: 4, short: "Thu" },
  { n: 5, short: "Fri" }, { n: 6, short: "Sat" }, { n: 7, short: "Sun" },
] as const;

function dayLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone }).format(new Date(iso));
}

/** The stored end is exclusive; managers think in the last day it runs. */
function lastDayLabel(endsAtIso: string, timeZone: string): string {
  return dayLabel(new Date(new Date(endsAtIso).getTime() - 1).toISOString(), timeZone);
}

export function scheduleText(i: AdminItem, timeZone: string): string {
  const parts: string[] = [];
  if (i.daysOfWeek.length > 0 && i.daysOfWeek.length < 7) {
    parts.push(WEEKDAYS.filter((d) => i.daysOfWeek.includes(d.n)).map((d) => d.short).join(", "));
  }
  if (i.startMinute !== null && i.endMinute !== null) parts.push(`${formatClock(i.startMinute)}–${formatClock(i.endMinute)}`);
  if (i.startsAt && i.endsAt) parts.push(`${dayLabel(i.startsAt, timeZone)} – ${lastDayLabel(i.endsAt, timeZone)}`);
  else if (i.startsAt) parts.push(`from ${dayLabel(i.startsAt, timeZone)}`);
  else if (i.endsAt) parts.push(`until ${lastDayLabel(i.endsAt, timeZone)}`);
  return parts.length > 0 ? parts.join(" · ") : "Always";
}

export function durationText(i: AdminItem): string {
  if (i.durationSeconds !== null) return `${i.durationSeconds} s`;
  if (i.media.durationMs !== null) {
    const total = Math.round(i.media.durationMs / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")} (video length)`;
  }
  return "—";
}

export function statusLabel(status: ItemStatus, i: AdminItem, timeZone: string): { text: string; tone: "success" | "neutral" | "info" | "warning" } | null {
  switch (status) {
    case "SHOWING":
      return null;
    case "OFF":
      return { text: "Switched off", tone: "neutral" };
    case "EXPIRED":
      return { text: `Expired ${i.endsAt ? lastDayLabel(i.endsAt, timeZone) : ""}`.trim(), tone: "warning" };
    case "SCHEDULED":
      return { text: `Starts ${i.startsAt ? dayLabel(i.startsAt, timeZone) : ""}`.trim(), tone: "info" };
    case "NOT_NOW":
      return { text: "Not showing now", tone: "info" };
  }
}

/** `timeZone` undefined = this computer's zone (a screen may not have a playlist yet). */
export function lastSeenText(iso: string | null, timeZone?: string): string {
  if (!iso) return "never connected";
  return `last seen ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso))}`;
}

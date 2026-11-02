// MY GERMAN DÖNER — Admin-side status for playlist items and screens (pure).
import { isItemActive, type PlaylistItem } from "./playlist";

export type ItemStatus = "SHOWING" | "OFF" | "EXPIRED" | "SCHEDULED" | "NOT_NOW";

/** Two missed 60 s feed polls plus slack. */
export const SCREEN_ONLINE_WINDOW_MS = 150_000;

export function itemStatus(item: PlaylistItem, now: Date, timeZone: string): ItemStatus {
  if (!item.isActive) return "OFF";
  if (item.endsAt && now.getTime() >= item.endsAt.getTime()) return "EXPIRED";
  if (item.startsAt && now.getTime() < item.startsAt.getTime()) return "SCHEDULED";
  return isItemActive(item, now, timeZone) ? "SHOWING" : "NOT_NOW";
}

export function screenOnline(lastSeenAt: Date | null, now: Date): boolean {
  return lastSeenAt !== null && now.getTime() - lastSeenAt.getTime() <= SCREEN_ONLINE_WINDOW_MS;
}

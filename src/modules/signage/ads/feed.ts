// MY GERMAN DÖNER — What a portrait screen receives (pure mapping, no I/O).
// The screen gets the whole schedule, not just what is live now, so it can keep deciding
// correctly from its cached copy while the network is down.

import { activeItems, type AdMediaKind } from "./playlist";

export interface FeedSourceItem {
  id: string;
  position: number;
  durationSeconds: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  daysOfWeek: number[];
  startMinute: number | null;
  endMinute: number | null;
  isActive: boolean;
  media: { id: string; mediaType: AdMediaKind; storageKey: string; durationMs: number | null };
}

export interface FeedSourceDisplay {
  screenNumber: number;
  playlist: {
    id: string;
    name: string;
    timeZone: string;
    isActive: boolean;
    updatedAt: Date;
    items: FeedSourceItem[];
  } | null;
}

export interface FeedItem {
  id: string;
  position: number;
  mediaType: AdMediaKind;
  mediaUrl: string;
  durationSeconds: number | null;
  mediaDurationMs: number | null;
  startsAt: string | null;
  endsAt: string | null;
  daysOfWeek: number[];
  startMinute: number | null;
  endMinute: number | null;
  isActive: boolean;
}

export type FeedStatus = "READY" | "PAUSED" | "UNASSIGNED";

export interface ScreenFeed {
  screenNumber: number;
  status: FeedStatus;
  playlist: { id: string; name: string; timeZone: string; updatedAt: string } | null;
  items: FeedItem[];
  generatedAt: string;
}

export const MEDIA_URL_PREFIX = "/api/signage/media/";

function toFeedItem(i: FeedSourceItem): FeedItem {
  return {
    id: i.id,
    position: i.position,
    mediaType: i.media.mediaType,
    mediaUrl: `${MEDIA_URL_PREFIX}${i.media.storageKey}`,
    durationSeconds: i.durationSeconds,
    mediaDurationMs: i.media.durationMs,
    startsAt: i.startsAt ? i.startsAt.toISOString() : null,
    endsAt: i.endsAt ? i.endsAt.toISOString() : null,
    daysOfWeek: [...i.daysOfWeek],
    startMinute: i.startMinute,
    endMinute: i.endMinute,
    isActive: i.isActive,
  };
}

export function toScreenFeed(screenNumber: number, display: FeedSourceDisplay | null, now: Date): ScreenFeed {
  const generatedAt = now.toISOString();
  const playlist = display?.playlist ?? null;
  if (!playlist) return { screenNumber, status: "UNASSIGNED", playlist: null, items: [], generatedAt };

  const meta = { id: playlist.id, name: playlist.name, timeZone: playlist.timeZone, updatedAt: playlist.updatedAt.toISOString() };
  if (!playlist.isActive) return { screenNumber, status: "PAUSED", playlist: meta, items: [], generatedAt };

  const items = playlist.items
    .filter((i) => i.isActive && !(i.endsAt && i.endsAt.getTime() <= now.getTime()))
    .sort((a, b) => a.position - b.position)
    .map(toFeedItem);
  return { screenNumber, status: "READY", playlist: meta, items, generatedAt };
}

/** Browser-side: turn a feed item back into the shape the playlist rules use. */
export function feedItemToPlaylistItem(i: FeedItem) {
  return {
    ...i,
    startsAt: i.startsAt ? new Date(i.startsAt) : null,
    endsAt: i.endsAt ? new Date(i.endsAt) : null,
  };
}

/** Items to play right now, in order, decided on the screen from its (possibly cached) feed. */
export function playableItems(feed: ScreenFeed, now: Date) {
  if (feed.status !== "READY" || !feed.playlist) return [];
  return activeItems(feed.items.map(feedItemToPlaylistItem), now, feed.playlist.timeZone);
}

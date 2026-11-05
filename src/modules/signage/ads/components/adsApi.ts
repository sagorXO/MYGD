// Browser client for the manager API (/api/admin/ads/*). Dates arrive as ISO strings.
import type { AdOrientationKind } from "../ads.schema";
import type { AdMediaKind, PlaylistItem } from "../playlist";

export interface AdminMedia {
  id: string;
  fileName: string;
  mediaType: AdMediaKind;
  storageKey: string;
  durationMs: number | null;
}

export interface AdminItem {
  id: string;
  position: number;
  durationSeconds: number | null;
  startsAt: string | null;
  endsAt: string | null;
  daysOfWeek: number[];
  startMinute: number | null;
  endMinute: number | null;
  isActive: boolean;
  media: AdminMedia;
}

export interface AdminPlaylist {
  id: string;
  name: string;
  timeZone: string;
  isActive: boolean;
  items: AdminItem[];
}

export interface AdminDisplay {
  id: string;
  screenNumber: number;
  name: string;
  orientation: AdOrientationKind;
  playlistId: string | null;
  lastSeenAt: string | null;
}

export interface AdminOverview {
  playlists: AdminPlaylist[];
  displays: AdminDisplay[];
}

/** The body PATCH /items/:id and POST /items accept (window as HH:MM). */
export interface ItemBody {
  mediaId: string;
  durationSeconds: number | null;
  startsAt: string | null;
  endsAt: string | null;
  daysOfWeek: number[];
  window: { from: string; to: string } | null;
  isActive: boolean;
}

export class ApiError extends Error {}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = (await res.json().catch(() => null)) as ({ success?: boolean; error?: string } & T) | null;
  if (!res.ok || !json?.success) throw new ApiError(json?.error ?? `Request failed (${res.status})`);
  return json;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const adsApi = {
  overview: () => call<AdminOverview>("/api/admin/ads"),
  createPlaylist: (name: string) => call<{ playlist: AdminPlaylist }>("/api/admin/ads", jsonInit("POST", { name })),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return call<{ media: AdminMedia }>("/api/admin/ads/media", { method: "POST", body: form });
  },
  addItem: (playlistId: string, item: ItemBody) => call("/api/admin/ads/items", jsonInit("POST", { playlistId, item })),
  saveItem: (id: string, item: ItemBody) => call(`/api/admin/ads/items/${id}`, jsonInit("PATCH", item)),
  removeItem: (id: string) => call(`/api/admin/ads/items/${id}`, { method: "DELETE" }),
  reorder: (playlistId: string, itemIds: string[]) => call("/api/admin/ads/items", jsonInit("PUT", { playlistId, itemIds })),
  assign: (screen: number, playlistId: string | null, orientation?: AdOrientationKind) =>
    call(`/api/admin/ads/displays/${screen}`, jsonInit("PUT", { playlistId, orientation })),
};

export function toPlaylistItem(i: AdminItem): PlaylistItem {
  return {
    id: i.id,
    position: i.position,
    mediaType: i.media.mediaType,
    durationSeconds: i.durationSeconds,
    mediaDurationMs: i.media.durationMs,
    startsAt: i.startsAt ? new Date(i.startsAt) : null,
    endsAt: i.endsAt ? new Date(i.endsAt) : null,
    daysOfWeek: i.daysOfWeek,
    startMinute: i.startMinute,
    endMinute: i.endMinute,
    isActive: i.isActive,
  };
}

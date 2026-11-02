// MY GERMAN DÖNER — Screen ads: database operations (server only).
// Every change is audit-logged and pushed to the screens over SSE (channel "signage").
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { toScreenFeed, type ScreenFeed } from "./feed";
import { validatePlaylist, type PlaylistItem } from "./playlist";
import { sniffMedia, mp4DurationMs, storageKeyFor } from "./media";
import { MediaConfigError, maxUploadBytes, sha256Hex, writeMediaFile } from "./storage";
import type { ItemInput } from "./ads.schema";

export const SIGNAGE_CHANNEL = "signage";

export class AdsError extends Error {
  constructor(public readonly status: 400 | 404 | 409 | 413 | 415 | 422, message: string) {
    super(message);
  }
}

export interface Actor {
  userId: string;
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

const itemsWithMedia = { orderBy: { position: "asc" as const }, include: { media: true } };

function notifyScreens(reason: string): void {
  eventBroker.publish(SIGNAGE_CHANNEL, { type: "ADS_UPDATED", reason });
}

async function audit(actor: Actor, action: string, details: Record<string, unknown>): Promise<void> {
  await prisma.auditLog.create({ data: { adminUserId: actor.userId, action, details: JSON.stringify(details), severity: "INFO" } });
}

async function touchPlaylist(playlistId: string): Promise<void> {
  await prisma.adPlaylist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } });
}

// --- screens ---------------------------------------------------------------

export async function getScreenFeed(screenNumber: number, now = new Date()): Promise<ScreenFeed> {
  const display = await prisma.adDisplay.findUnique({
    where: { screenNumber },
    include: { playlist: { include: { items: itemsWithMedia } } },
  });
  // Heartbeat for the admin page; a screen seen for the first time gets its row, so it appears there.
  // screenNumber is already limited to the contract screens. A failed write must not stop the feed.
  prisma.adDisplay
    .upsert({
      where: { screenNumber },
      create: { screenNumber, name: `Portrait ${screenNumber}`, lastSeenAt: now },
      update: { lastSeenAt: now },
    })
    .catch((err: unknown) => console.error("[ads] heartbeat write failed", err instanceof Error ? err.message : err));
  return toScreenFeed(screenNumber, display, now);
}

// --- admin overview ----------------------------------------------------------

export async function getAdminOverview() {
  const [playlists, displays, media] = await Promise.all([
    prisma.adPlaylist.findMany({ orderBy: { createdAt: "asc" }, include: { items: itemsWithMedia } }),
    prisma.adDisplay.findMany({ orderBy: { screenNumber: "asc" } }),
    prisma.adMedia.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return { playlists, displays, media };
}

export async function createPlaylist(name: string, actor: Actor) {
  const exists = await prisma.adPlaylist.findUnique({ where: { name } });
  if (exists) throw new AdsError(409, `A playlist called "${name}" already exists.`);
  const playlist = await prisma.adPlaylist.create({ data: { name } });
  await audit(actor, "ADS_PLAYLIST_CREATED", { playlistId: playlist.id, name });
  return playlist;
}

// --- media -----------------------------------------------------------------

export async function addMedia(bytes: Uint8Array, fileName: string, actor: Actor) {
  if (bytes.length > maxUploadBytes()) throw new AdsError(413, "The file is larger than the upload limit.");
  const sniffed = sniffMedia(bytes);
  if (!sniffed) throw new AdsError(415, "Only JPG, PNG, WebP images and MP4 videos can be uploaded.");

  const durationMs = sniffed.mediaType === "VIDEO" ? mp4DurationMs(bytes) : null;
  if (sniffed.mediaType === "VIDEO" && durationMs === null) {
    throw new AdsError(422, "The video length could not be read. Export it again as MP4 (H.264).");
  }

  const sha256 = sha256Hex(bytes);
  const existing = await prisma.adMedia.findUnique({ where: { sha256 } });
  if (existing) return existing; // same file uploaded again: reuse it

  const storageKey = storageKeyFor(sha256, sniffed.ext);
  await writeMediaFile(storageKey, bytes);
  const media = await prisma.adMedia
    .create({
      data: {
        fileName: fileName.slice(0, 200),
        mediaType: sniffed.mediaType,
        mimeType: sniffed.mimeType,
        byteSize: bytes.length,
        sha256,
        storageKey,
        durationMs,
        uploadedBy: actor.userId,
      },
    })
    .catch(async (err: unknown) => {
      // The same file uploaded twice at once: the other request won, use its row.
      const winner = isUniqueViolation(err) ? await prisma.adMedia.findUnique({ where: { sha256 } }) : null;
      if (!winner) throw err;
      return winner;
    });
  await audit(actor, "ADS_MEDIA_UPLOADED", { mediaId: media.id, byteSize: media.byteSize, mediaType: media.mediaType });
  return media;
}

// --- playlist items ----------------------------------------------------------

function checkItem(candidate: PlaylistItem): void {
  const errors = validatePlaylist([candidate]);
  if (errors.length > 0) throw new AdsError(422, errors.map((e) => e.message).join(" "));
}

function candidateFrom(id: string, position: number, input: ItemInput, media: { mediaType: "IMAGE" | "VIDEO"; durationMs: number | null }): PlaylistItem {
  return { id, position, ...input, mediaType: media.mediaType, mediaDurationMs: media.durationMs };
}

function itemData(input: ItemInput) {
  const { mediaId, ...rest } = input;
  return { mediaId, ...rest };
}

export async function createItem(playlistId: string, input: ItemInput, actor: Actor) {
  const [playlist, media] = await Promise.all([
    prisma.adPlaylist.findUnique({ where: { id: playlistId }, select: { id: true } }),
    prisma.adMedia.findUnique({ where: { id: input.mediaId } }),
  ]);
  if (!playlist) throw new AdsError(404, "Playlist not found.");
  if (!media) throw new AdsError(404, "Media not found.");
  checkItem(candidateFrom("new", 1, input, media));

  const item = await prisma.$transaction(async (tx) => {
    const last = await tx.adPlaylistItem.aggregate({ where: { playlistId }, _max: { position: true } });
    return tx.adPlaylistItem.create({ data: { playlistId, position: (last._max.position ?? 0) + 1, ...itemData(input) } });
  });
  await touchPlaylist(playlistId);
  await audit(actor, "ADS_ITEM_ADDED", { playlistId, itemId: item.id, mediaId: media.id });
  notifyScreens("item-added");
  return item;
}

export async function updateItem(itemId: string, input: ItemInput, actor: Actor) {
  const current = await prisma.adPlaylistItem.findUnique({ where: { id: itemId } });
  if (!current) throw new AdsError(404, "Playlist item not found.");
  const media = await prisma.adMedia.findUnique({ where: { id: input.mediaId } });
  if (!media) throw new AdsError(404, "Media not found.");
  checkItem(candidateFrom(itemId, current.position, input, media));

  const item = await prisma.adPlaylistItem.update({ where: { id: itemId }, data: itemData(input) });
  await touchPlaylist(current.playlistId);
  await audit(actor, "ADS_ITEM_UPDATED", { playlistId: current.playlistId, itemId });
  notifyScreens("item-updated");
  return item;
}

export async function deleteItem(itemId: string, actor: Actor): Promise<void> {
  const current = await prisma.adPlaylistItem.findUnique({ where: { id: itemId } });
  if (!current) throw new AdsError(404, "Playlist item not found.");
  await prisma.$transaction(async (tx) => {
    await tx.adPlaylistItem.delete({ where: { id: itemId } });
    const rest = await tx.adPlaylistItem.findMany({ where: { playlistId: current.playlistId }, orderBy: { position: "asc" } });
    await renumber(tx, rest.map((i) => i.id));
  });
  await touchPlaylist(current.playlistId);
  await audit(actor, "ADS_ITEM_REMOVED", { playlistId: current.playlistId, itemId });
  notifyScreens("item-removed");
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Two passes so the (playlistId, position) unique index never sees a duplicate mid-update. */
async function renumber(tx: Tx, orderedIds: string[]): Promise<void> {
  for (const [index, id] of orderedIds.entries()) {
    await tx.adPlaylistItem.update({ where: { id }, data: { position: -(index + 1) } });
  }
  for (const [index, id] of orderedIds.entries()) {
    await tx.adPlaylistItem.update({ where: { id }, data: { position: index + 1 } });
  }
}

export async function reorderItems(playlistId: string, itemIds: string[], actor: Actor): Promise<void> {
  const items = await prisma.adPlaylistItem.findMany({ where: { playlistId }, select: { id: true } });
  if (items.length === 0) throw new AdsError(404, "Playlist not found or empty.");
  const known = new Set(items.map((i) => i.id));
  if (itemIds.length !== known.size || !itemIds.every((id) => known.has(id))) {
    throw new AdsError(409, "The playlist changed while you were editing. Reload and try again.");
  }
  await prisma.$transaction((tx) => renumber(tx, itemIds));
  await touchPlaylist(playlistId);
  await audit(actor, "ADS_ITEMS_REORDERED", { playlistId, count: itemIds.length });
  notifyScreens("reordered");
}

// --- screens ↔ playlists -----------------------------------------------------

export async function assignDisplay(screenNumber: number, playlistId: string | null, name: string | undefined, actor: Actor) {
  if (playlistId && !(await prisma.adPlaylist.findUnique({ where: { id: playlistId } }))) {
    throw new AdsError(404, "Playlist not found.");
  }
  const display = await prisma.adDisplay.upsert({
    where: { screenNumber },
    create: { screenNumber, name: name ?? `Portrait ${screenNumber}`, playlistId },
    update: { playlistId, ...(name ? { name } : {}) },
  });
  await audit(actor, "ADS_DISPLAY_ASSIGNED", { screenNumber, playlistId });
  notifyScreens("display-assigned");
  return display;
}

// --- HTTP helpers ------------------------------------------------------------

export function adsErrorResponse(err: unknown, label: string): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ success: false, error: "Validation error", issues: err.issues }, { status: 400 });
  }
  if (err instanceof AdsError) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.status });
  }
  if (isUniqueViolation(err)) {
    return NextResponse.json({ success: false, error: "The playlist changed at the same moment. Reload and try again." }, { status: 409 });
  }
  if (err instanceof MediaConfigError) {
    console.error(`[ads] ${label}: ${err.message}`);
    return NextResponse.json({ success: false, error: "Media storage is not configured on this server." }, { status: 503 });
  }
  console.error(`[ads] ${label} failed:`, err instanceof Error ? err.message : err);
  return NextResponse.json({ success: false, error: `Could not ${label}.` }, { status: 500 });
}

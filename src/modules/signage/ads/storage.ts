// MY GERMAN DÖNER — Ad media files on disk (server only).
// Files are stored by content hash under MEDIA_ROOT; the database keeps only the key.
import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, stat, writeFile, rm } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join, resolve } from "node:path";
import { Readable } from "node:stream";
import { isValidStorageKey } from "./media";

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

export class MediaConfigError extends Error {}

export function mediaRoot(): string {
  const root = process.env.MEDIA_ROOT?.trim();
  if (!root) throw new MediaConfigError("MEDIA_ROOT is not set; ad media cannot be stored or served.");
  return resolve(root);
}

export function maxUploadBytes(): number {
  const raw = process.env.AD_MEDIA_MAX_BYTES?.trim();
  if (!raw) return DEFAULT_MAX_BYTES;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new MediaConfigError("AD_MEDIA_MAX_BYTES must be a positive whole number.");
  return value;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function pathFor(key: string): string {
  if (!isValidStorageKey(key)) throw new Error("Invalid media key");
  return join(mediaRoot(), key);
}

/** Atomic write: a half-written file is never visible under its final name. */
export async function writeMediaFile(key: string, bytes: Uint8Array): Promise<void> {
  const target = pathFor(key);
  await mkdir(mediaRoot(), { recursive: true });
  const tmp = join(mediaRoot(), `.upload-${randomUUID()}`);
  try {
    await writeFile(tmp, bytes, { flag: "wx" });
    await rename(tmp, target);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
}

export async function mediaFileSize(key: string): Promise<number | null> {
  try {
    const s = await stat(pathFor(key));
    return s.isFile() ? s.size : null;
  } catch {
    return null;
  }
}

export function mediaFileStream(key: string, range?: { start: number; end: number }): ReadableStream<Uint8Array> {
  const node = createReadStream(pathFor(key), range ? { start: range.start, end: range.end } : undefined);
  return Readable.toWeb(node) as ReadableStream<Uint8Array>;
}

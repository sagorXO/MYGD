// MY GERMAN DÖNER — Ad media helpers (pure, no I/O).
// Uploads are identified by their bytes, never by file name or the browser's MIME type.

import type { AdMediaKind } from "./playlist";

export interface SniffedMedia {
  mediaType: AdMediaKind;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "video/mp4";
  ext: "jpg" | "png" | "webp" | "mp4";
}

export type ByteRange = { start: number; end: number };

const MIN_SNIFF_BYTES = 12;
// ISO base-media brands that browsers play as video/mp4. QuickTime ("qt  ") is not accepted.
const MP4_BRANDS = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "M4V "]);
const STORAGE_KEY = /^[a-f0-9]{64}\.(jpg|png|webp|mp4)$/;

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

export function sniffMedia(bytes: Uint8Array): SniffedMedia | null {
  if (bytes.length < MIN_SNIFF_BYTES) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mediaType: "IMAGE", mimeType: "image/jpeg", ext: "jpg" };
  }
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a) {
    return { mediaType: "IMAGE", mimeType: "image/png", ext: "png" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { mediaType: "IMAGE", mimeType: "image/webp", ext: "webp" };
  }
  if (ascii(bytes, 4, 4) === "ftyp" && MP4_BRANDS.has(ascii(bytes, 8, 4))) {
    return { mediaType: "VIDEO", mimeType: "video/mp4", ext: "mp4" };
  }
  return null;
}

interface Box {
  type: string;
  start: number; // offset of the payload
  end: number; // offset after the box
}

function readBoxes(bytes: Uint8Array, from: number, to: number): Box[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const boxes: Box[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    let size = view.getUint32(offset);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > to) break;
      const big = view.getBigUint64(offset + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      size = to - offset; // box runs to the end of its parent
    }
    if (size < header || offset + size > to) break;
    boxes.push({ type: ascii(bytes, offset + 4, 4), start: offset + header, end: offset + size });
    offset += size;
  }
  return boxes;
}

/** Length of an MP4 from its movie header (mvhd), or null when it cannot be read. */
export function mp4DurationMs(bytes: Uint8Array): number | null {
  const moov = readBoxes(bytes, 0, bytes.length).find((b) => b.type === "moov");
  if (!moov) return null;
  const mvhd = readBoxes(bytes, moov.start, moov.end).find((b) => b.type === "mvhd");
  if (!mvhd) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = bytes[mvhd.start];
  const need = version === 1 ? 32 : 20;
  if (mvhd.start + need > mvhd.end) return null;
  const timescale = version === 1 ? view.getUint32(mvhd.start + 20) : view.getUint32(mvhd.start + 12);
  const duration = version === 1 ? Number(view.getBigUint64(mvhd.start + 24)) : view.getUint32(mvhd.start + 16);
  if (timescale === 0 || !Number.isFinite(duration) || duration <= 0) return null;
  return Math.round((duration * 1000) / timescale);
}

/**
 * Parse a single-range `Range: bytes=…` header.
 * null = serve the whole file (no header, unsupported unit, multi-range or malformed).
 */
export function parseByteRange(header: string | null, size: number): ByteRange | "UNSATISFIABLE" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (suffix === 0) return "UNSATISFIABLE";
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(rawStart);
  const end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (start >= size || start > end) return "UNSATISFIABLE";
  return { start, end };
}

export function storageKeyFor(sha256: string, ext: SniffedMedia["ext"]): string {
  return `${sha256}.${ext}`;
}

export function isValidStorageKey(key: string): boolean {
  return STORAGE_KEY.test(key);
}

export function mimeForStorageKey(key: string): SniffedMedia["mimeType"] | null {
  if (!isValidStorageKey(key)) return null;
  const ext = key.slice(key.lastIndexOf(".") + 1);
  return ({ jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4" } as const)[ext as SniffedMedia["ext"]];
}

/** Checked before the body is read, so an unbounded or oversized upload never reaches memory. */
export function declaredUploadProblem(contentLength: string | null, maxBytes: number): 411 | 413 | null {
  if (!contentLength || !/^\d+$/.test(contentLength.trim())) return 411;
  return Number(contentLength) > maxBytes ? 413 : null;
}

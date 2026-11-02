import test from "node:test";
import assert from "node:assert/strict";

const { sniffMedia, mp4DurationMs, parseByteRange, storageKeyFor, isValidStorageKey } = await import(
  "../src/modules/signage/ads/media.ts"
);

const SHA = "a".repeat(64);

function box(type, payload) {
  const out = new Uint8Array(8 + payload.length);
  new DataView(out.buffer).setUint32(0, out.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(payload, 8);
  return out;
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function ftyp(brand = "isom") {
  const p = new Uint8Array(12);
  p.set(new TextEncoder().encode(brand), 0);
  p.set(new TextEncoder().encode("isom"), 8);
  return box("ftyp", p);
}

function mvhdV0(timescale, duration) {
  const p = new Uint8Array(100); // version 0, flags 0
  const v = new DataView(p.buffer);
  v.setUint32(12, timescale);
  v.setUint32(16, duration);
  return box("mvhd", p);
}

function mvhdV1(timescale, duration) {
  const p = new Uint8Array(112);
  p[0] = 1;
  const v = new DataView(p.buffer);
  v.setUint32(20, timescale);
  v.setBigUint64(24, BigInt(duration));
  return box("mvhd", p);
}

// --- sniffing (by content, never by file name or client MIME) --------------

test("sniffMedia recognises JPEG, PNG, WebP and MP4", () => {
  assert.deepEqual(sniffMedia(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), { mediaType: "IMAGE", mimeType: "image/jpeg", ext: "jpg" });
  assert.deepEqual(sniffMedia(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])), { mediaType: "IMAGE", mimeType: "image/png", ext: "png" });
  const webp = concat(new TextEncoder().encode("RIFF"), new Uint8Array(4), new TextEncoder().encode("WEBP"));
  assert.deepEqual(sniffMedia(webp), { mediaType: "IMAGE", mimeType: "image/webp", ext: "webp" });
  assert.deepEqual(sniffMedia(concat(ftyp("isom"), box("moov", new Uint8Array(0)))), { mediaType: "VIDEO", mimeType: "video/mp4", ext: "mp4" });
});

test("sniffMedia rejects anything else", () => {
  assert.equal(sniffMedia(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), null);
  assert.equal(sniffMedia(new TextEncoder().encode("GIF89a......")), null);
  assert.equal(sniffMedia(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0, 0, 0, 0, 0])), null); // PDF
  assert.equal(sniffMedia(new Uint8Array(3)), null);
  assert.equal(sniffMedia(ftyp("qt  ")), null); // QuickTime .mov is not supported
});

// --- MP4 length ----------------------------------------------------------

test("mp4DurationMs reads mvhd version 0 and 1", () => {
  assert.equal(mp4DurationMs(concat(ftyp(), box("moov", mvhdV0(1000, 15250)))), 15250);
  assert.equal(mp4DurationMs(concat(ftyp(), box("moov", mvhdV1(600, 9000)))), 15000);
});

test("mp4DurationMs finds moov after mdat (not fast-start)", () => {
  const file = concat(ftyp(), box("mdat", new Uint8Array(64)), box("moov", mvhdV0(90000, 900000)));
  assert.equal(mp4DurationMs(file), 10000);
});

test("mp4DurationMs returns null when there is no usable mvhd", () => {
  assert.equal(mp4DurationMs(concat(ftyp(), box("mdat", new Uint8Array(8)))), null);
  assert.equal(mp4DurationMs(concat(ftyp(), box("moov", mvhdV0(0, 1000)))), null); // timescale 0
  const truncated = concat(ftyp(), box("moov", mvhdV0(1000, 5000))).slice(0, 40);
  assert.equal(mp4DurationMs(truncated), null);
});

test("mp4DurationMs does not loop on a zero-size box", () => {
  const bad = concat(ftyp(), new Uint8Array([0, 0, 0, 0, 0x6d, 0x6f, 0x6f, 0x76]));
  assert.equal(mp4DurationMs(bad), null);
});

// --- HTTP Range (needed for video playback and seeking) -------------------

test("parseByteRange handles the single-range forms", () => {
  assert.deepEqual(parseByteRange("bytes=0-99", 1000), { start: 0, end: 99 });
  assert.deepEqual(parseByteRange("bytes=500-", 1000), { start: 500, end: 999 });
  assert.deepEqual(parseByteRange("bytes=-100", 1000), { start: 900, end: 999 });
  assert.deepEqual(parseByteRange("bytes=900-5000", 1000), { start: 900, end: 999 });
});

test("parseByteRange reports unsatisfiable ranges", () => {
  assert.equal(parseByteRange("bytes=1000-", 1000), "UNSATISFIABLE");
  assert.equal(parseByteRange("bytes=50-10", 1000), "UNSATISFIABLE");
  assert.equal(parseByteRange("bytes=-0", 1000), "UNSATISFIABLE");
});

test("parseByteRange ignores missing, malformed and multi-range headers", () => {
  assert.equal(parseByteRange(null, 1000), null);
  assert.equal(parseByteRange("items=0-1", 1000), null);
  assert.equal(parseByteRange("bytes=0-1,5-6", 1000), null);
  assert.equal(parseByteRange("bytes=abc", 1000), null);
});

// --- storage keys --------------------------------------------------------

test("storageKeyFor is the content hash plus the sniffed extension", () => {
  assert.equal(storageKeyFor(SHA, "mp4"), `${SHA}.mp4`);
});

test("isValidStorageKey only accepts hash.ext names (no paths)", () => {
  assert.equal(isValidStorageKey(`${SHA}.jpg`), true);
  assert.equal(isValidStorageKey(`${SHA}.webp`), true);
  assert.equal(isValidStorageKey(`../${SHA}.jpg`), false);
  assert.equal(isValidStorageKey(`${SHA}.svg`), false);
  assert.equal(isValidStorageKey(`${SHA.toUpperCase()}.jpg`), false);
  assert.equal(isValidStorageKey("abc.jpg"), false);
});

// --- upload size is decided before the body is read --------------------------

const { declaredUploadProblem } = await import("../src/modules/signage/ads/media.ts");

test("declaredUploadProblem needs a usable Content-Length under the limit", () => {
  assert.equal(declaredUploadProblem("1000", 1000), null);
  assert.equal(declaredUploadProblem("1001", 1000), 413);
  assert.equal(declaredUploadProblem(null, 1000), 411);
  assert.equal(declaredUploadProblem("", 1000), 411);
  assert.equal(declaredUploadProblem("abc", 1000), 411);
  assert.equal(declaredUploadProblem("-5", 1000), 411);
});

// Public media files for the portrait screens. Content-addressed (sha256), so cached forever.
// Supports Range requests, which browsers need to play and seek video.
import { NextRequest, NextResponse } from "next/server";
import { isValidStorageKey, mimeForStorageKey, parseByteRange } from "@/modules/signage/ads/media";
import { MediaConfigError, mediaFileSize, mediaFileStream } from "@/modules/signage/ads/storage";

export const dynamic = "force-dynamic";

const IMMUTABLE = "public, max-age=31536000, immutable";

async function serve(req: NextRequest, file: string, headOnly: boolean): Promise<Response> {
  const mime = mimeForStorageKey(file);
  if (!isValidStorageKey(file) || !mime) return new NextResponse(null, { status: 404 });
  try {
    const size = await mediaFileSize(file);
    if (size === null) return new NextResponse(null, { status: 404 });

    const etag = `"${file.slice(0, 64)}"`;
    const base = { "Content-Type": mime, "Accept-Ranges": "bytes", "Cache-Control": IMMUTABLE, ETag: etag };
    if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: base });

    const range = parseByteRange(req.headers.get("range"), size);
    if (range === "UNSATISFIABLE") {
      return new NextResponse(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    }
    if (range) {
      const headers = { ...base, "Content-Range": `bytes ${range.start}-${range.end}/${size}`, "Content-Length": String(range.end - range.start + 1) };
      return new Response(headOnly ? null : mediaFileStream(file, range), { status: 206, headers });
    }
    return new Response(headOnly ? null : mediaFileStream(file), { status: 200, headers: { ...base, "Content-Length": String(size) } });
  } catch (err) {
    if (err instanceof MediaConfigError) return new NextResponse(null, { status: 503 });
    console.error("[ads] media read failed:", err instanceof Error ? err.message : err);
    return new NextResponse(null, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  return serve(req, (await params).file, false);
}

export async function HEAD(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  return serve(req, (await params).file, true);
}

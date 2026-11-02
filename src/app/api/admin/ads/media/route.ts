// Manager upload of an ad image or video (multipart, field "file"). The type is checked from the bytes.
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { addMedia, adsErrorResponse } from "@/modules/signage/ads/ads.service";
import { declaredUploadProblem } from "@/modules/signage/ads/media";
import { maxUploadBytes } from "@/modules/signage/ads/storage";

export const dynamic = "force-dynamic";

// Multipart overhead allowance on top of the file limit, so the early size check is not too strict.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const TOO_LARGE = "The file is larger than the upload limit.";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const problem = declaredUploadProblem(req.headers.get("content-length"), maxUploadBytes() + MULTIPART_OVERHEAD_BYTES);
    if (problem === 411) return NextResponse.json({ success: false, error: "Content-Length is required." }, { status: 411 });
    if (problem === 413) return NextResponse.json({ success: false, error: TOO_LARGE }, { status: 413 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Attach one file in the field \"file\"." }, { status: 400 });
    }
    if (file.size > maxUploadBytes()) return NextResponse.json({ success: false, error: TOO_LARGE }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const media = await addMedia(bytes, file.name, { userId: auth.session.sub });
    return NextResponse.json({ success: true, media }, { status: 201 });
  } catch (err) {
    return adsErrorResponse(err, "upload the file");
  }
}

// Manager API: change (PATCH, full item body) or remove (DELETE) one playlist item.
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { ItemInputSchema } from "@/modules/signage/ads/ads.schema";
import { adsErrorResponse, deleteItem, updateItem } from "@/modules/signage/ads/ads.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const input = ItemInputSchema.parse(await req.json());
    const item = await updateItem((await params).id, input, { userId: auth.session.sub });
    return NextResponse.json({ success: true, item });
  } catch (err) {
    return adsErrorResponse(err, "save the item");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    await deleteItem((await params).id, { userId: auth.session.sub });
    return NextResponse.json({ success: true });
  } catch (err) {
    return adsErrorResponse(err, "remove the item");
  }
}

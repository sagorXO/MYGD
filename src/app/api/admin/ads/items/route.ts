// Manager API: add an item to a playlist (POST) or change the order (PUT).
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { ItemCreateSchema, ReorderSchema } from "@/modules/signage/ads/ads.schema";
import { adsErrorResponse, createItem, reorderItems } from "@/modules/signage/ads/ads.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const { playlistId, item } = ItemCreateSchema.parse(await req.json());
    const created = await createItem(playlistId, item, { userId: auth.session.sub });
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err) {
    return adsErrorResponse(err, "add the item");
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, "STORE_MANAGER");
  if (!auth.ok) return auth.response;
  try {
    const { playlistId, itemIds } = ReorderSchema.parse(await req.json());
    await reorderItems(playlistId, itemIds, { userId: auth.session.sub });
    return NextResponse.json({ success: true });
  } catch (err) {
    return adsErrorResponse(err, "change the order");
  }
}

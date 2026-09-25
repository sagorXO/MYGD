import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RestockIntakeRequestSchema } from "@/modules/inventory/inventory.schema";
import { eventBroker } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RestockIntakeRequestSchema.parse(body);

    const location = await prisma.location.findUnique({
      where: { slug: validated.locationSlug },
    });
    if (!location) {
      return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: {
        locationId_ingredientId: {
          locationId: location.id,
          ingredientId: validated.ingredientId,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: "Inventory item not found" }, { status: 404 });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        currentStock: item.currentStock + validated.addedUnits,
        lastRestockedAt: new Date(),
      },
    });

    // If stock is now positive, mark products available again
    if (updated.currentStock > 0) {
      const linkedProducts = await prisma.product.findMany({
        where: {
          OR: [
            { recipeBoms: { some: { ingredientId: validated.ingredientId } } },
            { recipes: { some: { ingredients: { some: { ingredientId: validated.ingredientId } } } } },
          ],
        },
      });

      for (const p of linkedProducts) {
        await prisma.product.update({
          where: { id: p.id },
          data: { isAvailable: true },
        });

        eventBroker.publish("all", {
          type: "STOCK_CHANGED",
          productId: p.id,
          isAvailable: true,
          locationId: location.id,
        });
      }
    }

    return NextResponse.json({ success: true, updatedStock: updated.currentStock });
  } catch (err: any) {
    console.error("[API /api/admin/inventory/restock] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

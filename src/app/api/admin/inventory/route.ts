// MY GERMAN DÖNER — Admin Inventory & Stock Levels API
// GET: Returns live stock levels, thresholds, portion yields, and low-stock alerts
// PATCH: Updates ingredient stock level and automatically triggers availability recomputation

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeLocationAvailability } from "@/lib/inventory-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationSlug = url.searchParams.get("location") || "EMBA";

    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location '${locationSlug}' not found` },
        { status: 404 }
      );
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { locationId: location.id },
      include: {
        ingredient: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { ingredient: { name: "asc" } },
    });

    // Run dynamic recomputation
    const recomputeData = await recomputeLocationAvailability(location.id);

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
      },
      items: inventoryItems.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        name: item.ingredient.name,
        sku: item.ingredient.sku,
        unit: item.ingredient.unit,
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        reorderBatchSize: item.reorderBatchSize,
        costPerUnit: item.ingredient.costPerUnitEUR,
        supplier: item.ingredient.supplier
          ? {
              id: item.ingredient.supplier.id,
              name: item.ingredient.supplier.name,
              contactName: item.ingredient.supplier.contactName,
              whatsApp: item.ingredient.supplier.whatsApp,
              email: item.ingredient.supplier.email,
            }
          : null,
        isLowStock: item.currentStock <= item.minThreshold,
        isDepleted: item.currentStock <= 0,
      })),
      yields: recomputeData.results,
      alerts: recomputeData.alerts,
    });
  } catch (err: any) {
    console.error("[Inventory GET Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load inventory" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { inventoryItemId, newStock, locationId } = body;

    if (!inventoryItemId || typeof newStock !== "number") {
      return NextResponse.json(
        { success: false, error: "inventoryItemId and numeric newStock are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        currentStock: Math.max(0, newStock),
        lastRestockedAt: newStock > 0 ? new Date() : undefined,
      },
      include: { location: true },
    });

    const targetLocationId = locationId || updated.locationId;
    const recomputeData = await recomputeLocationAvailability(targetLocationId);

    return NextResponse.json({
      success: true,
      item: updated,
      recompute: recomputeData,
    });
  } catch (err: any) {
    console.error("[Inventory PATCH Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update stock" },
      { status: 500 }
    );
  }
}

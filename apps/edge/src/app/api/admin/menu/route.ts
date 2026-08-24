import { NextResponse } from "next/server";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET all products and modifiers for Admin Management
export async function GET() {
  try {
    await initializeDatabasePragmas();

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: {
            locationPrices: true,
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    modifiers: {
                      orderBy: { sortOrder: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const locations = await prisma.location.findMany({
      where: { isActive: true },
    });

    const modifierGroups = await prisma.modifierGroup.findMany({
      include: {
        modifiers: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      categories,
      locations,
      modifierGroups,
    });
  } catch (error) {
    console.error("Admin menu fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin menu" },
      { status: 500 }
    );
  }
}

// PATCH to toggle availability or update price
export async function PATCH(request: Request) {
  try {
    await initializeDatabasePragmas();

    const body = await request.json();
    const { targetType, targetId, isAvailable, basePrice, locationId, overridePrice } = body;

    if (targetType === "PRODUCT") {
      if (typeof isAvailable === "boolean") {
        await prisma.product.update({
          where: { id: targetId },
          data: { isAvailable },
        });
      }
      if (typeof basePrice === "number" && basePrice > 0) {
        await prisma.product.update({
          where: { id: targetId },
          data: { basePrice },
        });
      }
      if (locationId && typeof overridePrice === "number") {
        await prisma.locationPrice.upsert({
          where: {
            locationId_productId: {
              locationId,
              productId: targetId,
            },
          },
          update: { price: overridePrice },
          create: {
            locationId,
            productId: targetId,
            price: overridePrice,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "PRODUCT_UPDATED",
          details: JSON.stringify({ productId: targetId, isAvailable, basePrice }),
          severity: "INFO",
        },
      });

      return NextResponse.json({ success: true, message: "Product updated successfully" });
    }

    if (targetType === "MODIFIER") {
      if (typeof isAvailable === "boolean") {
        await prisma.modifier.update({
          where: { id: targetId },
          data: { isAvailable },
        });
      }
      if (typeof basePrice === "number") {
        await prisma.modifier.update({
          where: { id: targetId },
          data: { priceAdjustment: basePrice },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: "MODIFIER_UPDATED",
          details: JSON.stringify({ modifierId: targetId, isAvailable, basePrice }),
          severity: "INFO",
        },
      });

      return NextResponse.json({ success: true, message: "Modifier updated successfully" });
    }

    return NextResponse.json(
      { success: false, error: "Invalid targetType. Expected 'PRODUCT' or 'MODIFIER'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin menu update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

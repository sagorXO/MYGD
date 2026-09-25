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

// POST to create a new product
export async function POST(request: Request) {
  try {
    await initializeDatabasePragmas();
    const body = await request.json();
    const {
      categoryId,
      sku,
      name,
      nameDE,
      description,
      basePrice,
      vatCategory = "FOOD_BEV",
      badge,
      calories,
      allergens,
      imageUrl,
      isVeggie = false,
      isSpicy = false,
    } = body;

    if (!categoryId || !name || typeof basePrice !== "number" || basePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Category, Name, and valid Base Price are required" },
        { status: 400 }
      );
    }

    const finalSku = sku?.trim() || `MYGD-${name.toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 12)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const newProduct = await prisma.product.create({
      data: {
        categoryId,
        sku: finalSku,
        name,
        nameDE: nameDE || null,
        description: description || null,
        basePrice: parseFloat(basePrice.toString()),
        vatCategory: vatCategory as any,
        badge: badge || null,
        calories: calories ? parseInt(calories.toString(), 10) : null,
        allergens: allergens ? (typeof allergens === "string" ? allergens : JSON.stringify(allergens)) : null,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
        isVeggie: Boolean(isVeggie),
        isSpicy: Boolean(isSpicy),
        isAvailable: true,
      },
    });

    // Create default Recipe container for the new product
    await prisma.recipe.create({
      data: {
        productId: newProduct.id,
        variantName: "STANDARD",
        yieldServings: 1,
        prepTimeSec: 180,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PRODUCT_CREATED",
        details: JSON.stringify({ productId: newProduct.id, sku: newProduct.sku, name: newProduct.name }),
        severity: "INFO",
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Admin product creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

// PUT to edit an existing product
export async function PUT(request: Request) {
  try {
    await initializeDatabasePragmas();
    const body = await request.json();
    const {
      id,
      categoryId,
      name,
      nameDE,
      description,
      basePrice,
      vatCategory,
      badge,
      calories,
      allergens,
      imageUrl,
      isVeggie,
      isSpicy,
      isAvailable,
    } = body;

    if (!id || !name || typeof basePrice !== "number" || basePrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Product ID, Name, and valid Base Price are required" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        categoryId: categoryId || undefined,
        name,
        nameDE: nameDE !== undefined ? nameDE : undefined,
        description: description !== undefined ? description : undefined,
        basePrice: parseFloat(basePrice.toString()),
        vatCategory: vatCategory ? (vatCategory as any) : undefined,
        badge: badge !== undefined ? badge : undefined,
        calories: calories ? parseInt(calories.toString(), 10) : null,
        allergens: allergens !== undefined ? (typeof allergens === "string" ? allergens : JSON.stringify(allergens)) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isVeggie: isVeggie !== undefined ? Boolean(isVeggie) : undefined,
        isSpicy: isSpicy !== undefined ? Boolean(isSpicy) : undefined,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PRODUCT_EDITED",
        details: JSON.stringify({ productId: id, name: updatedProduct.name, basePrice: updatedProduct.basePrice }),
        severity: "INFO",
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error("Admin product edit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE to remove an item from menu
export async function DELETE(request: Request) {
  try {
    await initializeDatabasePragmas();
    const url = new URL(request.url);
    let productId = url.searchParams.get("id");

    if (!productId) {
      try {
        const body = await request.json();
        productId = body.id;
      } catch (_) {}
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required for deletion" },
        { status: 400 }
      );
    }

    const deleted = await prisma.product.delete({
      where: { id: productId },
    });

    await prisma.auditLog.create({
      data: {
        action: "PRODUCT_DELETED",
        details: JSON.stringify({ productId, name: deleted.name, sku: deleted.sku }),
        severity: "WARNING",
      },
    });

    return NextResponse.json({ success: true, message: `Product '${deleted.name}' deleted successfully` });
  } catch (error: any) {
    console.error("Admin product deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}


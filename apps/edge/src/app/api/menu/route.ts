import { NextResponse } from "next/server";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await initializeDatabasePragmas();

    const { searchParams } = new URL(request.url);
    const locationSlug = (searchParams.get("location") || "EMBA").toUpperCase();

    // Find location
    const location = await prisma.location.findUnique({
      where: { slug: locationSlug },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location '${locationSlug}' not found` },
        { status: 404 }
      );
    }

    // Fetch active categories with their active products and modifier groups
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { sortOrder: "asc" },
          include: {
            locationPrices: {
              where: { locationId: location.id },
            },
            modifierGroups: {
              orderBy: { sortOrder: "asc" },
              include: {
                modifierGroup: {
                  include: {
                    modifiers: {
                      where: { isAvailable: true },
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

    // Transform and apply location-specific price overrides (M11 requirement)
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      nameDE: cat.nameDE,
      nameGR: cat.nameGR,
      description: cat.description,
      iconSvg: cat.iconSvg,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      products: cat.products.map((prod) => {
        // Check for location price override
        const override = prod.locationPrices[0];
        const effectivePrice = override ? override.price : prod.basePrice;

        return {
          id: prod.id,
          categoryId: prod.categoryId,
          sku: prod.sku,
          name: prod.name,
          nameDE: prod.nameDE,
          nameGR: prod.nameGR,
          description: prod.description,
          descriptionDE: prod.descriptionDE,
          descriptionGR: prod.descriptionGR,
          basePrice: effectivePrice,
          imageUrl: prod.imageUrl,
          badge: prod.badge,
          calories: prod.calories,
          allergens: prod.allergens ? JSON.parse(prod.allergens) : [],
          isVeggie: prod.isVeggie,
          isSpicy: prod.isSpicy,
          isAvailable: override ? override.isAvailable : prod.isAvailable,
          allowMealUpgrade: prod.allowMealUpgrade,
          sortOrder: prod.sortOrder,
          modifierGroups: prod.modifierGroups.map((pmg) => ({
            id: pmg.modifierGroup.id,
            slug: pmg.modifierGroup.slug,
            name: pmg.modifierGroup.name,
            nameDE: pmg.modifierGroup.nameDE,
            nameGR: pmg.modifierGroup.nameGR,
            minSelected: pmg.modifierGroup.minSelected,
            maxSelected: pmg.modifierGroup.maxSelected,
            isRequired: pmg.modifierGroup.isRequired,
            sortOrder: pmg.sortOrder,
            modifiers: pmg.modifierGroup.modifiers.map((m) => ({
              id: m.id,
              modifierGroupId: m.modifierGroupId,
              slug: m.slug,
              name: m.name,
              nameDE: m.nameDE,
              nameGR: m.nameGR,
              priceAdjustment: m.priceAdjustment,
              isDefault: m.isDefault,
              isAvailable: m.isAvailable,
              calories: m.calories,
              sortOrder: m.sortOrder,
            })),
          })),
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        slug: location.slug,
        name: location.name,
        currency: location.currency,
        vatRate: location.vatRate,
      },
      categories: formattedCategories,
    });
  } catch (error) {
    console.error("Error fetching menu catalog:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching menu" },
      { status: 500 }
    );
  }
}

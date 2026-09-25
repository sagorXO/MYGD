import { NextRequest, NextResponse } from "next/server";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET recipe and BOM for a product, along with all available master ingredients
export async function GET(req: NextRequest) {
  try {
    await initializeDatabasePragmas();
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
      // Return all ingredients if no productId specified
      const allIngredients = await prisma.ingredient.findMany({
        include: { supplier: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ success: true, ingredients: allIngredients });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        recipes: {
          include: {
            ingredients: {
              include: { ingredient: { include: { supplier: true } } },
            },
          },
        },
        recipeBoms: {
          include: {
            ingredient: { include: { supplier: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const allIngredients = await prisma.ingredient.findMany({
      include: { supplier: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        basePrice: product.basePrice,
      },
      recipe: product.recipes[0] || null,
      bom: product.recipeBoms,
      allIngredients,
    });
  } catch (error: any) {
    console.error("Admin recipe GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}

// POST to add an ingredient to a product's recipe & BOM
export async function POST(req: NextRequest) {
  try {
    await initializeDatabasePragmas();
    const body = await req.json();
    const { productId, ingredientId, amountGrams, isOptional = false } = body;

    if (!productId || !ingredientId || typeof amountGrams !== "number" || amountGrams <= 0) {
      return NextResponse.json(
        { success: false, error: "productId, ingredientId, and positive amountGrams are required" },
        { status: 400 }
      );
    }

    // 1. Ensure Recipe container exists
    let recipe = await prisma.recipe.findFirst({ where: { productId } });
    if (!recipe) {
      recipe = await prisma.recipe.create({
        data: {
          productId,
          variantName: "STANDARD",
          yieldServings: 1,
          prepTimeSec: 180,
        },
      });
    }

    // 2. Upsert RecipeIngredient
    await prisma.recipeIngredient.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: recipe.id,
          ingredientId,
        },
      },
      update: {
        amountUnits: parseFloat(amountGrams.toString()),
        isOptional: Boolean(isOptional),
      },
      create: {
        recipeId: recipe.id,
        ingredientId,
        amountUnits: parseFloat(amountGrams.toString()),
        isOptional: Boolean(isOptional),
      },
    });

    // 3. Upsert RecipeBOM
    const bomItem = await prisma.recipeBOM.upsert({
      where: {
        productId_ingredientId: {
          productId,
          ingredientId,
        },
      },
      update: {
        amountGrams: parseFloat(amountGrams.toString()),
        isOptional: Boolean(isOptional),
      },
      create: {
        productId,
        ingredientId,
        amountGrams: parseFloat(amountGrams.toString()),
        isOptional: Boolean(isOptional),
      },
      include: {
        ingredient: { include: { supplier: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "RECIPE_INGREDIENT_ADDED",
        details: JSON.stringify({ productId, ingredientId, amountGrams }),
        severity: "INFO",
      },
    });

    return NextResponse.json({ success: true, bomItem });
  } catch (error: any) {
    console.error("Admin recipe POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add ingredient to recipe" },
      { status: 500 }
    );
  }
}

// PUT to update an ingredient portion amount in a recipe
export async function PUT(req: NextRequest) {
  try {
    await initializeDatabasePragmas();
    const body = await req.json();
    const { productId, ingredientId, amountGrams, isOptional } = body;

    if (!productId || !ingredientId || typeof amountGrams !== "number" || amountGrams <= 0) {
      return NextResponse.json(
        { success: false, error: "productId, ingredientId, and positive amountGrams are required" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findFirst({ where: { productId } });
    if (recipe) {
      await prisma.recipeIngredient.updateMany({
        where: { recipeId: recipe.id, ingredientId },
        data: {
          amountUnits: parseFloat(amountGrams.toString()),
          isOptional: isOptional !== undefined ? Boolean(isOptional) : undefined,
        },
      });
    }

    const updatedBOM = await prisma.recipeBOM.update({
      where: {
        productId_ingredientId: { productId, ingredientId },
      },
      data: {
        amountGrams: parseFloat(amountGrams.toString()),
        isOptional: isOptional !== undefined ? Boolean(isOptional) : undefined,
      },
      include: { ingredient: { include: { supplier: true } } },
    });

    return NextResponse.json({ success: true, updatedBOM });
  } catch (error: any) {
    console.error("Admin recipe PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update recipe ingredient" },
      { status: 500 }
    );
  }
}

// DELETE to remove an ingredient from a product's recipe & BOM
export async function DELETE(req: NextRequest) {
  try {
    await initializeDatabasePragmas();
    const url = new URL(req.url);
    let productId = url.searchParams.get("productId");
    let ingredientId = url.searchParams.get("ingredientId");

    if (!productId || !ingredientId) {
      try {
        const body = await req.json();
        productId = body.productId;
        ingredientId = body.ingredientId;
      } catch (_) {}
    }

    if (!productId || !ingredientId) {
      return NextResponse.json(
        { success: false, error: "productId and ingredientId are required" },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.findFirst({ where: { productId } });
    if (recipe) {
      await prisma.recipeIngredient.deleteMany({
        where: { recipeId: recipe.id, ingredientId },
      });
    }

    await prisma.recipeBOM.deleteMany({
      where: { productId, ingredientId },
    });

    await prisma.auditLog.create({
      data: {
        action: "RECIPE_INGREDIENT_DELETED",
        details: JSON.stringify({ productId, ingredientId }),
        severity: "INFO",
      },
    });

    return NextResponse.json({ success: true, message: "Ingredient removed from recipe" });
  } catch (error: any) {
    console.error("Admin recipe DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete recipe ingredient" },
      { status: 500 }
    );
  }
}

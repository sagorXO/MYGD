// MY GERMAN DÖNER — Module M3 Gram-Precision BOM & Inventory Engine
// Computes dynamic product availability from ingredient stocks & yields

import { prisma } from "./prisma";
import { eventBroker } from "./events";

export interface RecipeIngredientInput {
  ingredientId: string;
  amountUnits: number;
  isOptional?: boolean;
}

export interface RecipeInput {
  productId: string;
  productName?: string;
  ingredients: RecipeIngredientInput[];
}

export interface ProductYieldResult {
  productId: string;
  isAvailable: boolean;
  maxYieldPortions: number;
  limitingIngredientId?: string;
  limitingIngredientStock?: number;
}

export interface LowStockAlert {
  itemId: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  severity: "CRITICAL" | "WARNING";
  message: string;
}

/**
 * Calculate portion yield for a single product from recipe BOM and stock levels
 * If any non-optional ingredient stock is 0 or less, product is unavailable (isAvailable = false)
 */
export function calculateProductYield(
  recipe: RecipeInput,
  stockMap: Map<string, number>
): ProductYieldResult {
  let maxPortions = Number.POSITIVE_INFINITY;
  let limitingIngredientId: string | undefined = undefined;
  let limitingIngredientStock: number | undefined = undefined;

  for (const ing of recipe.ingredients) {
    if (ing.isOptional) continue; // Optional garnishes/sauces do not block availability

    const currentStock = stockMap.get(ing.ingredientId) ?? 0;
    const portionsForThisIngredient = Math.floor(currentStock / ing.amountUnits);

    if (portionsForThisIngredient < maxPortions) {
      maxPortions = portionsForThisIngredient;
      limitingIngredientId = ing.ingredientId;
      limitingIngredientStock = currentStock;
    }
  }

  // If no required ingredients, treat as infinite
  if (maxPortions === Number.POSITIVE_INFINITY) {
    maxPortions = 999;
  }

  const isAvailable = maxPortions > 0;

  return {
    productId: recipe.productId,
    isAvailable,
    maxYieldPortions: Math.max(0, maxPortions),
    limitingIngredientId,
    limitingIngredientStock,
  };
}

/**
 * Deduct order BOM from inventory stock map
 */
export function deductOrderBOM(
  currentStock: Map<string, number>,
  deductions: { ingredientId: string; amountToDeduct: number }[]
): Map<string, number> {
  const updated = new Map(currentStock);

  for (const d of deductions) {
    const existing = updated.get(d.ingredientId) ?? 0;
    const newStock = Math.max(0, existing - d.amountToDeduct);
    updated.set(d.ingredientId, newStock);
  }

  return updated;
}

/**
 * Check for ingredients dipping below minimum thresholds
 */
export function checkLowStockAlerts(
  items: { id: string; name: string; currentStock: number; minThreshold: number; unit?: string }[]
): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];

  for (const item of items) {
    const unit = item.unit || "units";
    if (item.currentStock <= 0) {
      alerts.push({
        itemId: item.id,
        name: item.name,
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        unit,
        severity: "CRITICAL",
        message: `${item.name} is completely SOLD OUT (0 ${unit})`,
      });
    } else if (item.currentStock <= item.minThreshold) {
      alerts.push({
        itemId: item.id,
        name: item.name,
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        unit,
        severity: "WARNING",
        message: `${item.name} (${item.currentStock}${unit}) is below minimum threshold of ${item.minThreshold}${unit}`,
      });
    }
  }

  return alerts;
}

/**
 * Recompute product availability across all products in a given store location
 */
export async function recomputeLocationAvailability(locationId: string) {
  // 1. Fetch all inventory stocks for this location
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { locationId },
    include: { ingredient: true },
  });

  const stockMap = new Map<string, number>();
  inventoryItems.forEach((item) => {
    stockMap.set(item.ingredientId, item.currentStock);
  });

  // 2. Fetch all products with recipes
  const products = await prisma.product.findMany({
    include: {
      recipes: {
        include: {
          ingredients: true,
        },
      },
      locationPrices: {
        where: { locationId },
      },
    },
  });

  const availabilityResults: ProductYieldResult[] = [];

  for (const product of products) {
    if (product.recipes.length === 0) {
      // Products without recipes (e.g. packaged drinks) depend on direct inventory or base availability
      continue;
    }

    const primaryRecipe = product.recipes[0];
    const yieldResult = calculateProductYield(
      {
        productId: product.id,
        productName: product.name,
        ingredients: primaryRecipe.ingredients.map((i) => ({
          ingredientId: i.ingredientId,
          amountUnits: i.amountUnits,
          isOptional: i.isOptional,
        })),
      },
      stockMap
    );

    availabilityResults.push(yieldResult);

    // Update Product and LocationPrice availability in Prisma
    if (product.isAvailable !== yieldResult.isAvailable) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isAvailable: yieldResult.isAvailable },
      });

      // Broadcast real-time stock change
      eventBroker.publish("all", {
        type: "STOCK_CHANGED",
        productId: product.id,
        productName: product.name,
        isAvailable: yieldResult.isAvailable,
        maxPortions: yieldResult.maxYieldPortions,
      });
    }
  }

  return {
    locationId,
    results: availabilityResults,
    alerts: checkLowStockAlerts(
      inventoryItems.map((item) => ({
        id: item.id,
        name: item.ingredient.name,
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        unit: item.ingredient.unit,
      }))
    ),
  };
}

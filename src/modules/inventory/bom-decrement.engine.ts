// MY GERMAN DÖNER — Atomic BOM Inventory Decrement Engine
import { prisma } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import { POSCartLine } from "../pos/pos.schema";

export interface StockDeductionReport {
  ingredientId: string;
  sku: string;
  name: string;
  deductedUnits: number;
  remainingStock: number;
  isAvailableNow: boolean;
}

/**
 * Executes atomic BOM inventory decrements for POS cart lines
 */
export async function deductOrderBOMAsync(
  locationId: string,
  lines: POSCartLine[]
): Promise<StockDeductionReport[]> {
  const reports: StockDeductionReport[] = [];

  // 1. Gather all recipe ingredients for the ordered products
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      recipeBoms: {
        include: { ingredient: true },
      },
      recipes: {
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
      },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // 2. Aggregate required deductions by ingredientId
  const requiredDeductions = new Map<string, number>();

  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) continue;

    // Check recipeBoms first (gram level), fallback to recipes
    if (product.recipeBoms && product.recipeBoms.length > 0) {
      for (const bom of product.recipeBoms) {
        const totalAmount = bom.amountGrams * line.quantity;
        const current = requiredDeductions.get(bom.ingredientId) || 0;
        requiredDeductions.set(bom.ingredientId, current + totalAmount);
      }
    } else if (product.recipes && product.recipes[0]?.ingredients) {
      for (const recIng of product.recipes[0].ingredients) {
        const totalAmount = recIng.amountUnits * line.quantity;
        const current = requiredDeductions.get(recIng.ingredientId) || 0;
        requiredDeductions.set(recIng.ingredientId, current + totalAmount);
      }
    }
  }

  // 3. Atomically decrement InventoryItem records in a transaction
  const ingredientIds = Array.from(requiredDeductions.keys());
  if (ingredientIds.length === 0) return [];

  await prisma.$transaction(async (tx) => {
    for (const [ingredientId, amountToDeduct] of requiredDeductions.entries()) {
      const existing = await tx.inventoryItem.findUnique({
        where: {
          locationId_ingredientId: {
            locationId,
            ingredientId,
          },
        },
        include: { ingredient: true },
      });

      if (!existing) continue;

      const newStock = Math.max(0, existing.currentStock - amountToDeduct);

      const updated = await tx.inventoryItem.update({
        where: { id: existing.id },
        data: {
          currentStock: newStock,
          lastRestockedAt: existing.lastRestockedAt,
        },
        include: { ingredient: true },
      });

      // If stock reached 0, dynamically mark linked products as unavailable
      let isAvailableNow = true;
      if (newStock <= 0) {
        isAvailableNow = false;

        // Find products relying on this ingredient
        const linkedProducts = await tx.product.findMany({
          where: {
            OR: [
              { recipeBoms: { some: { ingredientId } } },
              { recipes: { some: { ingredients: { some: { ingredientId } } } } },
            ],
          },
        });

        for (const p of linkedProducts) {
          await tx.product.update({
            where: { id: p.id },
            data: { isAvailable: false },
          });

          // Broadcast instant "Sold Out" state to Menu Boards and POS
          eventBroker.publish("all", {
            type: "STOCK_CHANGED",
            productId: p.id,
            isAvailable: false,
            ingredientSku: existing.ingredient.sku,
            locationId,
          });
        }
      }

      reports.push({
        ingredientId,
        sku: existing.ingredient.sku,
        name: existing.ingredient.name,
        deductedUnits: amountToDeduct,
        remainingStock: newStock,
        isAvailableNow,
      });
    }
  });

  return reports;
}

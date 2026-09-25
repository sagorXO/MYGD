// MY GERMAN DÖNER — Module M8 McDonald's-Style Visual SOP Build Sheets API
// GET: Returns all products with sequential RecipeStep assembly instructions.
// Seeds canonical build sheets into Prisma database if table is empty.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatProductBuildSheet,
  CANONICAL_BUILD_SHEETS,
} from "@/lib/timeclock-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Check if products with recipe steps exist
    let products = await prisma.product.findMany({
      include: {
        buildSheets: {
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const totalStepsCount = products.reduce((acc, p) => acc + (p.buildSheets?.length || 0), 0);

    // 2. If no products or no recipe steps exist, seed canonical build sheets
    if (products.length === 0 || totalStepsCount === 0) {
      // Ensure default category exists
      let defaultCategory = await prisma.category.findFirst({
        where: { slug: "doner-kebab" },
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.upsert({
          where: { slug: "doner-kebab" },
          update: {},
          create: {
            slug: "doner-kebab",
            name: "Classic Doner Kebab",
            nameDE: "Klassischer Döner Kebab",
            nameGR: "Κλασικό Ντονέρ Κεμπάπ",
            sortOrder: 1,
          },
        });
      }

      for (const sheet of CANONICAL_BUILD_SHEETS) {
        const prod = await prisma.product.upsert({
          where: { sku: sheet.product.sku },
          update: {
            name: sheet.product.name,
            basePrice: sheet.product.basePrice,
            imageUrl: sheet.product.imageUrl,
            sortOrder: sheet.product.sortOrder,
          },
          create: {
            categoryId: defaultCategory.id,
            sku: sheet.product.sku,
            name: sheet.product.name,
            description: sheet.product.description,
            basePrice: sheet.product.basePrice,
            imageUrl: sheet.product.imageUrl,
            sortOrder: sheet.product.sortOrder,
          },
        });

        // Insert or update recipe steps
        for (const step of sheet.steps) {
          await prisma.recipeStep.upsert({
            where: {
              productId_stepNumber: {
                productId: prod.id,
                stepNumber: step.stepNumber,
              },
            },
            update: {
              instruction: step.instruction,
              instructionDE: step.instructionDE,
              targetSec: step.targetSec,
              qualityCheck: step.qualityCheck,
              imageUrl: step.imageUrl || prod.imageUrl,
            },
            create: {
              productId: prod.id,
              stepNumber: step.stepNumber,
              instruction: step.instruction,
              instructionDE: step.instructionDE,
              targetSec: step.targetSec,
              qualityCheck: step.qualityCheck,
              imageUrl: step.imageUrl || prod.imageUrl,
            },
          });
        }
      }

      // Re-fetch products with freshly seeded steps
      products = await prisma.product.findMany({
        include: {
          buildSheets: {
            orderBy: { stepNumber: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    }

    // 3. Normalize & Format using formatProductBuildSheet
    const formattedBuildSheets = products.map((prod) => {
      // Find metadata from canonical definition if available
      const canonical = CANONICAL_BUILD_SHEETS.find(
        (c) => c.product.sku === prod.sku || c.product.name === prod.name
      );

      return formatProductBuildSheet(
        {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          meatWeight: canonical?.product.meatWeight,
          breadType: canonical?.product.breadType,
          sauceSequence: canonical?.product.sauceSequence,
          imageUrl: prod.imageUrl,
        },
        prod.buildSheets
      );
    });

    return NextResponse.json({
      success: true,
      count: formattedBuildSheets.length,
      buildSheets: formattedBuildSheets,
    });
  } catch (err: any) {
    console.error("[Build Sheets GET Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch build sheets" },
      { status: 500 }
    );
  }
}

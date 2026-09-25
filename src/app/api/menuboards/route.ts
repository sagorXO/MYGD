// MY GERMAN DÖNER — Module M10: Digital Menu Boards CMS API Route
// GET: Fetch active MenuBoardConfig records (seeds canonical 7 slot configs if empty)
// PATCH: Updates screen layout, products, or daypart and dispatches MENU_BOARD_UPDATED event

import { NextRequest, NextResponse } from "next/server";
import { prisma, initializeDatabasePragmas } from "@/lib/prisma";
import { eventBroker } from "@/lib/events";
import {
  CANONICAL_SCREEN_CONFIGS,
  validateLayoutType,
} from "@/lib/menuboard-engine";

export const dynamic = "force-dynamic";

/**
 * Seeds the canonical 7 screen configurations into the database if empty.
 */
async function ensureSeedConfigs() {
  const count = await prisma.menuBoardConfig.count();
  if (count === 0) {
    for (let screenNum = 1; screenNum <= 7; screenNum++) {
      const canonical = CANONICAL_SCREEN_CONFIGS[screenNum];
      if (canonical) {
        await prisma.menuBoardConfig.create({
          data: {
            screenNumber: screenNum,
            title: canonical.title,
            layoutType: canonical.layoutType,
            activeDaypart: canonical.activeDaypart || "AUTO",
            itemsJson: JSON.stringify(canonical.items),
            isOnline: true,
            lastPing: new Date(),
          },
        });
      }
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    await initializeDatabasePragmas();
    await ensureSeedConfigs();

    const { searchParams } = new URL(req.url);
    const screenParam = searchParams.get("screen") || searchParams.get("screenNumber");

    if (screenParam) {
      const screenNum = parseInt(screenParam, 10);
      if (isNaN(screenNum) || screenNum < 1 || screenNum > 7) {
        return NextResponse.json(
          { success: false, error: "Invalid screen parameter. Must be 1 to 7." },
          { status: 400 }
        );
      }

      const config = await prisma.menuBoardConfig.findUnique({
        where: { screenNumber: screenNum },
      });

      if (!config) {
        return NextResponse.json(
          { success: false, error: `Config for screen ${screenNum} not found.` },
          { status: 404 }
        );
      }

      const formatted = {
        ...config,
        items:
          typeof config.itemsJson === "string"
            ? JSON.parse(config.itemsJson)
            : config.itemsJson || [],
      };

      return NextResponse.json({
        success: true,
        config: formatted,
        screen: formatted,
      });
    }

    const configs = await prisma.menuBoardConfig.findMany({
      orderBy: { screenNumber: "asc" },
    });

    const formattedConfigs = configs.map((c) => ({
      ...c,
      items:
        typeof c.itemsJson === "string"
          ? JSON.parse(c.itemsJson)
          : c.itemsJson || [],
    }));

    return NextResponse.json({
      success: true,
      configs: formattedConfigs,
      count: formattedConfigs.length,
    });
  } catch (error) {
    console.error("[GET /api/menuboards] Error fetching configs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching menu boards" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await initializeDatabasePragmas();
    const body = await req.json();

    const rawScreen = body.screenNumber ?? body.screen ?? body.slotId;
    const screenNumber = parseInt(String(rawScreen), 10);

    if (isNaN(screenNumber) || screenNumber < 1 || screenNumber > 7) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid screenNumber (1-7) is required for PATCH /api/menuboards",
        },
        { status: 400 }
      );
    }

    if (body.layoutType !== undefined && !validateLayoutType(body.layoutType)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid layoutType. Must be exact string 'PROMO_HERO', 'PRICE_MATRIX', or 'SPLIT_COMBO'.",
        },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = String(body.title);
    if (body.layoutType !== undefined) updateData.layoutType = body.layoutType;
    if (body.activeDaypart !== undefined) updateData.activeDaypart = body.activeDaypart;
    if (body.isOnline !== undefined) updateData.isOnline = Boolean(body.isOnline);
    if (body.items !== undefined) {
      updateData.itemsJson =
        typeof body.items === "string" ? body.items : JSON.stringify(body.items);
    } else if (body.itemsJson !== undefined) {
      updateData.itemsJson =
        typeof body.itemsJson === "string"
          ? body.itemsJson
          : JSON.stringify(body.itemsJson);
    }

    const canonicalFallback = CANONICAL_SCREEN_CONFIGS[screenNumber];

    const updated = await prisma.menuBoardConfig.upsert({
      where: { screenNumber },
      update: updateData,
      create: {
        screenNumber,
        title: updateData.title || canonicalFallback?.title || `SCREEN ${screenNumber}`,
        layoutType: updateData.layoutType || canonicalFallback?.layoutType || "PRICE_MATRIX",
        activeDaypart: updateData.activeDaypart || canonicalFallback?.activeDaypart || "AUTO",
        itemsJson:
          updateData.itemsJson ||
          JSON.stringify(canonicalFallback?.items || []),
        isOnline: updateData.isOnline ?? true,
      },
    });

    const formatted = {
      ...updated,
      items:
        typeof updated.itemsJson === "string"
          ? JSON.parse(updated.itemsJson)
          : updated.itemsJson || [],
    };

    // Dispatch real-time SSE event for zero-refresh dynamic 4K physical screens
    eventBroker.publish("all", {
      type: "MENU_BOARD_UPDATED",
      screenNumber,
      layoutType: updated.layoutType,
      config: formatted,
    });
    eventBroker.publish("boards", {
      type: "MENU_BOARD_UPDATED",
      screenNumber,
      layoutType: updated.layoutType,
      config: formatted,
    });

    return NextResponse.json({
      success: true,
      config: formatted,
    });
  } catch (error) {
    console.error("[PATCH /api/menuboards] Error updating config:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error updating menu board" },
      { status: 500 }
    );
  }
}

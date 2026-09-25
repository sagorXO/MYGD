// MY GERMAN DÖNER — Module M1 Checklist Templates API
// GET /api/checklists/template?shiftType=OPENING|CLOSING|HACCP

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseChecklistTasks } from "@/lib/haccp-validator";

export const dynamic = "force-dynamic";

const CANONICAL_TEMPLATES = [
  {
    title: "Morning Opening & Equipment Activation Routine",
    shiftType: "OPENING",
    tasks: [
      { id: "op-1", title: "Unlock store & disarm security alarm system", isTempCheck: false },
      { id: "op-2", title: "Power on rotisserie skewer burners (Beef/Lamb & Chicken)", isTempCheck: false },
      { id: "op-3", title: "Inspect Turkish Fladenbrot bakery delivery (150 pcs)", isTempCheck: false },
      { id: "op-4", title: "Calibrate potato fryers to 175°C", isTempCheck: false },
      { id: "op-5", title: "Power on physical Kiosks & KDS kitchen line screens", isTempCheck: false },
    ],
  },
  {
    title: "EU HACCP Critical Temperature Audit (EC 852/2004)",
    shiftType: "HACCP",
    tasks: [
      { id: "hac-1", title: "Walk-in Raw Spit Meat Chilled Storage (0°C – 5°C)", isTempCheck: true, tempType: "CHILLED", target: "0.0°C – 5.0°C" },
      { id: "hac-2", title: "Sauce & Salad Cold Well Prep Counter (0°C – 5°C)", isTempCheck: true, tempType: "CHILLED", target: "0.0°C – 5.0°C" },
      { id: "hac-3", title: "Deep Freeze Meat Reserve (-18°C – -22°C)", isTempCheck: true, tempType: "FROZEN", target: "-18.0°C – -22.0°C" },
      { id: "hac-4", title: "Rotisserie Cooked Core Meat Temperature (≥ 63°C)", isTempCheck: true, tempType: "HOT_HOLDING", target: "≥ 63.0°C" },
    ],
  },
  {
    title: "Afternoon Prep & Sauce Station Setup",
    shiftType: "LUNCH_PREP",
    tasks: [
      { id: "pr-1", title: "Fill squeeze bottles with Kräuter, Knoblauch & Scharf sauces", isTempCheck: false },
      { id: "pr-2", title: "Slice 5kg fresh red cabbage, tomatoes, cucumbers & parsley", isTempCheck: false },
      { id: "pr-3", title: "Restock French Fries seasoning blend & wooden forks", isTempCheck: false },
    ],
  },
  {
    title: "Night Closing, Sanitization & Z-Report",
    shiftType: "CLOSING",
    tasks: [
      { id: "cl-1", title: "Deep clean rotisserie skewer drip pans & scraper burners", isTempCheck: false },
      { id: "cl-2", title: "Sanitize all stainless prep counters & cutting boards", isTempCheck: false },
      { id: "cl-3", title: "Store leftover vegetables in sealed containers inside walk-in fridge", isTempCheck: false },
      { id: "cl-4", title: "Print POS Daily Z-Report & lock cash drawer in safe", isTempCheck: false },
      { id: "cl-5", title: "Arm store alarm & lock exterior shutters", isTempCheck: false },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const shiftType = url.searchParams.get("shiftType");

    // Query DB templates
    let templates = await prisma.checklistTemplate.findMany({
      where: shiftType ? { shiftType, isActive: true } : { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    // Seed defaults if empty
    if (templates.length === 0) {
      for (const tpl of CANONICAL_TEMPLATES) {
        await prisma.checklistTemplate.create({
          data: {
            title: tpl.title,
            shiftType: tpl.shiftType,
            tasksJson: JSON.stringify(tpl.tasks),
            isActive: true,
          },
        });
      }

      templates = await prisma.checklistTemplate.findMany({
        where: shiftType ? { shiftType, isActive: true } : { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    const formattedTemplates = templates.map((t) => ({
      id: t.id,
      title: t.title,
      shiftType: t.shiftType,
      tasks: parseChecklistTasks(t.tasksJson),
    }));

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
    });
  } catch (err: any) {
    console.error("[Checklist Template GET Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch checklist templates" },
      { status: 500 }
    );
  }
}

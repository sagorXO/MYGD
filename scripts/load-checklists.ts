// Loads Oliver's tasks and stock list into the database. Safe to re-run: tasks are matched by their text,
// so past records stay under the right words. Removed or reworded tasks retire, and it never touches
// what staff recorded, the opening time once set, or LOW levels.
//   npm run checklists:load
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { planItemSync } from "../src/modules/checklists/item-sync";

const DIR = join(process.cwd(), "data", "checklists");

const ChecklistFile = z.object({
  suggestedSettings: z.object({ openingTime: z.string(), closingTime: z.string(), timeZone: z.string() }),
  quietPeriod: z.record(z.string(), z.array(z.string())),
  checklists: z.array(
    z.object({
      station: z.string(),
      stationName: z.string(),
      phase: z.enum(["OPENING", "DURING_SHIFT", "CLOSING"]),
      group: z.string(),
      mode: z.enum(["TICK", "COUNT", "CHECK_IN", "REFERENCE_PER_ORDER"]),
      items: z.array(
        z.object({
          position: z.number().int(),
          label: z.string().min(1),
          kind: z.enum(["CHECK", "TEMPERATURE", "COUNT"]),
          critical: z.boolean(),
          sourcePage: z.number().int(),
          haccpTarget: z.enum(["CHILLED", "FROZEN", "HOT_HOLDING"]).optional(),
          needsReview: z.string().optional(),
        })
      ),
    })
  ),
});

const StockFile = z.object({
  items: z.array(z.object({ category: z.string(), product: z.string(), snapshot: z.string(), needsReview: z.string().optional() })),
});

const read = (file: string): unknown => JSON.parse(readFileSync(join(DIR, file), "utf8"));

async function main(): Promise<void> {
  const data = ChecklistFile.parse(read("mygd-station-checklists.v1.json"));
  const stock = StockFile.parse(read("inventory-snapshot.v1.json"));
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(
      async (tx) => {
        const liveSections: string[] = [];
        let tasks = 0;
        for (const [index, g] of data.checklists.entries()) {
          const section = await tx.checklistSection.upsert({
            where: { station_phase_title: { station: g.station, phase: g.phase, title: g.group } },
            update: { stationName: g.stationName, mode: g.mode, position: index, isActive: true },
            create: { station: g.station, stationName: g.stationName, phase: g.phase, title: g.group, mode: g.mode, position: index },
          });
          liveSections.push(section.id);
          const existing = await tx.checklistItem.findMany({ where: { sectionId: section.id }, select: { id: true, label: true, position: true, isActive: true } });
          const plan = planItemSync(existing, g.items.map((i) => ({ label: i.label, position: i.position })));
          const fieldsByLabel = new Map(
            g.items.map((i) => [i.label, { label: i.label, kind: i.kind, isCritical: i.critical, haccpTarget: i.haccpTarget ?? null, needsReview: i.needsReview ?? null, sourcePage: i.sourcePage, isActive: true }])
          );
          for (const { id, position } of plan.moveAside) await tx.checklistItem.update({ where: { id }, data: { position } });
          if (plan.retire.length > 0) await tx.checklistItem.updateMany({ where: { id: { in: plan.retire } }, data: { isActive: false } });
          for (const { id, label, position } of plan.update) await tx.checklistItem.update({ where: { id }, data: { ...fieldsByLabel.get(label)!, position } });
          for (const { label, position } of plan.create) await tx.checklistItem.create({ data: { ...fieldsByLabel.get(label)!, sectionId: section.id, position } });
          tasks += g.items.length;
        }
        await tx.checklistSection.updateMany({ where: { id: { notIn: liveSections } }, data: { isActive: false } });

        const liveStock: string[] = [];
        for (const [position, r] of stock.items.entries()) {
          const row = await tx.stockItem.upsert({
            where: { category_product: { category: r.category, product: r.product } },
            update: { position, snapshot: r.snapshot, needsReview: r.needsReview ?? null, isActive: true },
            create: { category: r.category, product: r.product, position, snapshot: r.snapshot, needsReview: r.needsReview ?? null },
          });
          liveStock.push(row.id);
        }
        await tx.stockItem.updateMany({ where: { id: { notIn: liveStock } }, data: { isActive: false } });

        await tx.operationalSetting.upsert({ where: { key: "store.hours" }, update: {}, create: { key: "store.hours", value: data.suggestedSettings } });
        await tx.operationalSetting.upsert({ where: { key: "checklists.quietPeriod" }, update: { value: data.quietPeriod }, create: { key: "checklists.quietPeriod", value: data.quietPeriod } });
        console.log(`Loaded ${tasks} tasks in ${liveSections.length} sections and ${liveStock.length} stock lines.`);
      },
      { timeout: 120_000 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

// MY GERMAN DÖNER — Shift checklist storage. Rules live in rules.ts; this file only reads and writes.
import { NextResponse } from "next/server";
import { Prisma, type ChecklistPhase, type PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { eventBroker } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import type { Board, BoardEntry, StockRow } from "./board.types";
import { canFinish, ChecklistRuleError, entrySnapshot, minutesToOpening, missingTasks, nextEntry, shiftDateString, stockStatus, verifyEntry, type EntryInput, type Operator, type StockStatusValue } from "./rules";

export const HOURS_KEY = "store.hours";
export const QUIET_PERIOD_KEY = "checklists.quietPeriod";
const STORE_SLUG = "EMBA";

type Tx = Prisma.TransactionClient | PrismaClient;

interface Hours {
  openingTime: string;
  closingTime: string;
  timeZone: string;
}

function isHours(v: unknown): v is Hours {
  const h = v as Partial<Hours> | null;
  return typeof h?.openingTime === "string" && typeof h.closingTime === "string" && typeof h.timeZone === "string";
}

async function readHours(db: Tx): Promise<Hours | null> {
  const row = await db.operationalSetting.findUnique({ where: { key: HOURS_KEY } });
  return row && isHours(row.value) ? row.value : null;
}

async function requireContext(db: Tx, now: Date) {
  const [hours, location] = await Promise.all([readHours(db), db.location.findUnique({ where: { slug: STORE_SLUG } })]);
  if (!hours || !location) throw new ChecklistRuleError("Checklists aren't set up on this server yet.", 503);
  const date = shiftDateString(now, hours.timeZone);
  return { hours, location, shiftDate: new Date(`${date}T00:00:00Z`), date };
}

const toEntry = (e: Prisma.ChecklistEntryGetPayload<object>): BoardEntry => ({
  status: e.status,
  temperature: e.temperature,
  isCompliant: e.isCompliant,
  correctiveAction: e.correctiveAction,
  note: e.note,
  recordedByName: e.recordedByName,
  recordedAt: e.recordedAt?.toISOString() ?? null,
  verifiedByName: e.verifiedByName,
  verifiedAt: e.verifiedAt?.toISOString() ?? null,
});

export async function getBoard(operator: Operator | null, now: Date = new Date()): Promise<Board> {
  const hours = await readHours(prisma);
  const location = await prisma.location.findUnique({ where: { slug: STORE_SLUG } });
  const timeZone = hours?.timeZone ?? "UTC";
  const date = shiftDateString(now, timeZone);
  const empty: Board = { loaded: false, shiftDate: date, timeZone, openingTime: hours?.openingTime ?? "", closingTime: hours?.closingTime ?? "", minutesToOpening: 0, sections: [], runs: [], quietPeriod: {}, operator };
  if (!hours || !location) return empty;

  const shiftDate = new Date(`${date}T00:00:00Z`);
  const [sections, runs, quiet] = await Promise.all([
    prisma.checklistSection.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      include: { items: { where: { isActive: true }, orderBy: { position: "asc" } } },
    }),
    prisma.checklistRun.findMany({
      where: { locationId: location.id, shiftDate },
      include: { entries: true, checkIns: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.operationalSetting.findUnique({ where: { key: QUIET_PERIOD_KEY } }),
  ]);
  const entries = new Map(runs.flatMap((r) => r.entries.map((e) => [e.itemId, e] as const)));
  const checkIns = new Map<string, { name: string; at: string }>();
  for (const c of runs.flatMap((r) => r.checkIns).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    checkIns.set(c.sectionId, { name: c.recordedByName, at: c.createdAt.toISOString() });
  }

  return {
    ...empty,
    loaded: sections.length > 0,
    minutesToOpening: minutesToOpening(hours.openingTime, now, timeZone),
    quietPeriod: (quiet?.value ?? {}) as Record<string, string[]>,
    runs: runs.map((r) => ({ station: r.station, phase: r.phase, status: r.status, completedByName: r.completedByName, completedAt: r.completedAt?.toISOString() ?? null })),
    sections: sections.map((s) => ({
      id: s.id,
      station: s.station,
      stationName: s.stationName,
      phase: s.phase,
      title: s.title,
      mode: s.mode,
      lastCheckIn: checkIns.get(s.id) ?? null,
      items: s.items.map((i) => {
        const e = entries.get(i.id);
        return { id: i.id, label: i.label, kind: i.kind, isCritical: i.isCritical, haccpTarget: i.haccpTarget, needsReview: i.needsReview, mode: s.mode, entry: e ? toEntry(e) : null };
      }),
    })),
  };
}

/** One run per station, phase and day. Starting twice resumes the same run. Locks it until the transaction ends. */
async function openRun(tx: Prisma.TransactionClient, locationId: string, station: string, phase: ChecklistPhase, shiftDate: Date) {
  const run = await tx.checklistRun.upsert({
    where: { locationId_station_phase_shiftDate: { locationId, station, phase, shiftDate } },
    update: {},
    create: { locationId, station, phase, shiftDate },
  });
  await tx.$queryRaw`SELECT id FROM "ChecklistRun" WHERE id = ${run.id} FOR UPDATE`;
  return tx.checklistRun.findUniqueOrThrow({ where: { id: run.id } });
}

const audit = (tx: Prisma.TransactionClient, locationId: string, operator: Operator, action: string, details: object, severity = "INFO") =>
  tx.auditLog.create({ data: { locationId, adminUserId: operator.id, action, severity, details: JSON.stringify(details) } });

const loadItem = async (tx: Prisma.TransactionClient, itemId: string) => {
  const item = await tx.checklistItem.findUnique({ where: { id: itemId }, include: { section: true } });
  if (!item?.isActive || !item.section.isActive) throw new ChecklistRuleError("That task no longer exists. Reload the list.", 404);
  return item;
};

export async function saveEntry(itemId: string, input: EntryInput, operator: Operator, now: Date = new Date()) {
  const { entry, breachAlert } = await prisma.$transaction(async (tx) => {
    const { location, shiftDate } = await requireContext(tx, now);
    const item = await loadItem(tx, itemId);
    const run = await openRun(tx, location.id, item.section.station, item.section.phase, shiftDate);
    if (run.status === "COMPLETED") throw new ChecklistRuleError("This checklist is already finished for today.", 409);

    const current = await tx.checklistEntry.findUnique({ where: { runId_itemId: { runId: run.id, itemId } } });
    const next = nextEntry({ item: { ...item, mode: item.section.mode }, current, input, operator, now });
    const saved = await tx.checklistEntry.upsert({
      where: { runId_itemId: { runId: run.id, itemId } },
      update: next,
      create: { ...next, runId: run.id, itemId },
    });

    // A reading also goes in the HACCP log, so the food-safety record stays complete in one place.
    if (input.action === "DONE" && next.temperature !== null && next.isCompliant !== null && item.haccpTarget) {
      await tx.haccpLog.create({
        data: { locationId: location.id, equipmentName: item.label.slice(0, 120), targetType: item.haccpTarget, temperature: next.temperature, isCompliant: next.isCompliant, correctiveAction: next.correctiveAction, loggedBy: operator.name },
      });
    }
    const breach = next.isCompliant === false && input.action === "DONE";
    if (current || breach) {
      await audit(tx, location.id, operator, breach ? "CHECKLIST_TEMPERATURE_BREACH" : "CHECKLIST_ENTRY_CHANGED", { itemId, task: item.label, action: input.action, from: entrySnapshot(current), to: next.status, temperature: next.temperature, correctiveAction: next.correctiveAction }, breach ? "CRITICAL" : "INFO");
    }
    return { entry: toEntry(saved), breachAlert: breach ? `${item.label} at ${next.temperature}°C` : null };
  });
  if (breachAlert) eventBroker.publish("admin", { type: "HEARTBEAT", severity: "CRITICAL", message: `HACCP DANGER ALERT: ${breachAlert}` });
  return entry;
}

export async function verifyItem(itemId: string, operator: Operator, now: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const { location, shiftDate } = await requireContext(tx, now);
    const item = await loadItem(tx, itemId);
    const run = await openRun(tx, location.id, item.section.station, item.section.phase, shiftDate);
    const current = await tx.checklistEntry.findUnique({ where: { runId_itemId: { runId: run.id, itemId } } });
    const next = verifyEntry({ item, current, operator, now });
    const saved = await tx.checklistEntry.update({ where: { runId_itemId: { runId: run.id, itemId } }, data: next });
    await audit(tx, location.id, operator, "CHECKLIST_TASK_VERIFIED", { itemId, recordedBy: current?.recordedByName });
    return toEntry(saved);
  });
}

export async function checkIn(sectionId: string, operator: Operator, now: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const { location, shiftDate } = await requireContext(tx, now);
    const section = await tx.checklistSection.findUnique({ where: { id: sectionId } });
    if (!section?.isActive) throw new ChecklistRuleError("That section no longer exists. Reload the list.", 404);
    if (section.mode !== "CHECK_IN") throw new ChecklistRuleError("This section doesn't use check-ins.");
    const run = await openRun(tx, location.id, section.station, section.phase, shiftDate);
    await tx.checklistCheckIn.create({ data: { runId: run.id, sectionId, recordedById: operator.id, recordedByName: operator.name, createdAt: now } });
  });
}

export async function finishRun(station: string, phase: ChecklistPhase, operator: Operator, now: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const { location, shiftDate } = await requireContext(tx, now);
    const sections = await tx.checklistSection.findMany({ where: { station, phase, isActive: true }, include: { items: { where: { isActive: true } } } });
    if (sections.length === 0) throw new ChecklistRuleError("Unknown station or phase.", 404);
    const run = await openRun(tx, location.id, station, phase, shiftDate);
    if (run.status === "COMPLETED") return;

    const entries = await tx.checklistEntry.findMany({ where: { runId: run.id } });
    const statusOf = new Map(entries.map((e) => [e.itemId, e.status]));
    const items = sections.flatMap((s) => s.items.map((i) => ({ id: i.id, label: i.label, mode: s.mode, isCritical: i.isCritical, entry: statusOf.has(i.id) ? { status: statusOf.get(i.id)! } : null })));
    if (!canFinish(items)) {
      const missing = missingTasks(items).map((i) => i.label);
      throw new ChecklistRuleError(missing.length ? `Still open: ${missing.join("; ")}` : "This phase has nothing to finish.", 409);
    }
    await tx.checklistRun.update({ where: { id: run.id }, data: { status: "COMPLETED", completedById: operator.id, completedByName: operator.name, completedAt: now } });
    await audit(tx, location.id, operator, "CHECKLIST_RUN_FINISHED", { station, phase });
  });
}

export async function setOpeningTime(openingTime: string, operator: Operator) {
  return prisma.$transaction(async (tx) => {
    const hours = await readHours(tx);
    if (!hours) throw new ChecklistRuleError("Checklists aren't set up on this server yet.", 503);
    const location = await tx.location.findUnique({ where: { slug: STORE_SLUG } });
    const value: Hours = { ...hours, openingTime };
    await tx.operationalSetting.update({ where: { key: HOURS_KEY }, data: { value: { ...value }, updatedBy: operator.name } });
    await tx.auditLog.create({ data: { locationId: location?.id, adminUserId: operator.id, action: "OPENING_TIME_CHANGED", details: JSON.stringify({ from: hours.openingTime, to: openingTime }) } });
  });
}

export async function getStock(now: Date = new Date()): Promise<StockRow[]> {
  const { location, shiftDate } = await requireContext(prisma, now);
  const items = await prisma.stockItem.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: { counts: { where: { locationId: location.id }, orderBy: { shiftDate: "desc" }, take: 2 } },
  });
  return items.map((i) => {
    const today = i.counts.find((c) => c.shiftDate.getTime() === shiftDate.getTime());
    const previous = i.counts.find((c) => c.shiftDate.getTime() < shiftDate.getTime() && c.count !== null);
    const snapshotOut = i.snapshot === "OUT";
    return {
      id: i.id,
      category: i.category,
      product: i.product,
      lowAt: i.lowAt,
      needsReview: i.needsReview,
      lastLabel: previous ? String(previous.count) : i.snapshot,
      lastDate: previous ? previous.shiftDate.toISOString().slice(0, 10) : null,
      count: today?.count ?? null,
      status: today?.status ?? previous?.status ?? (snapshotOut ? "OUT" : null),
      counted: today?.count != null,
    };
  });
}

export async function saveStockCount(input: { stockItemId: string; count?: number | null; status?: StockStatusValue | null }, operator: Operator, now: Date = new Date()) {
  return prisma.$transaction(async (tx) => {
    const { location, shiftDate } = await requireContext(tx, now);
    const item = await tx.stockItem.findUnique({ where: { id: input.stockItemId } });
    if (!item?.isActive) throw new ChecklistRuleError("That product no longer exists. Reload the list.", 404);
    // Typing a count then tapping the status sends two saves at once. The lock stops the second erasing the first.
    await tx.$queryRaw`SELECT id FROM "StockItem" WHERE id = ${item.id} FOR UPDATE`;
    const key = { stockItemId_locationId_shiftDate: { stockItemId: item.id, locationId: location.id, shiftDate } };
    const current = await tx.stockCount.findUnique({ where: key });
    const count = input.count !== undefined ? input.count : (current?.count ?? null);
    const chosen = input.status !== undefined ? input.status : (current?.status ?? null);
    const status = stockStatus({ count, lowAt: item.lowAt, chosen });
    const who = { recordedById: operator.id, recordedByName: operator.name };
    await tx.stockCount.upsert({ where: key, update: { count, status, ...who }, create: { stockItemId: item.id, locationId: location.id, shiftDate, count, status, ...who } });
    if (current) await audit(tx, location.id, operator, "STOCK_COUNT_CHANGED", { stockItemId: item.id, from: current.count, to: count });
  });
}

export function checklistErrorResponse(err: unknown, label: string): NextResponse {
  if (err instanceof ZodError) return NextResponse.json({ success: false, error: "Check what you entered and try again." }, { status: 422 });
  if (err instanceof ChecklistRuleError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
  if (err instanceof SyntaxError) return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return NextResponse.json({ success: false, error: "Someone else saved this at the same moment. Try again." }, { status: 409 });
  }
  console.error(`[checklists] ${label} failed:`, err instanceof Error ? err.message : err);
  return NextResponse.json({ success: false, error: `Could not ${label}.` }, { status: 500 });
}

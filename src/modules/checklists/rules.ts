// MY GERMAN DÖNER — Shift checklist rules (pure, used by the server and the tablet).
import { hasRole, type Role } from "@/lib/auth/roles";
import { evaluateTemperature, isHaccpTarget } from "@/modules/haccp/temperature";
import { zonedDateString } from "@/modules/signage/ads/zoned";

export type EntryStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED" | "ISSUE_BLOCKED";
export type StockStatusValue = "OK" | "LOW" | "OUT";
export type SectionMode = "TICK" | "COUNT" | "CHECK_IN" | "REFERENCE_PER_ORDER";

export interface Operator {
  id: string;
  name: string;
  role: Role;
}

export interface EntryState {
  status: EntryStatus;
  temperature: number | null;
  isCompliant: boolean | null;
  correctiveAction: string | null;
  note: string | null;
  recordedById: string | null;
  recordedByName: string | null;
  recordedAt: Date | null;
  verifiedById: string | null;
  verifiedByName: string | null;
  verifiedAt: Date | null;
}

export type EntryInput =
  | { action: "DONE"; temperature?: number; correctiveAction?: string }
  | { action: "UNDO" }
  | { action: "ISSUE"; note?: string }
  | { action: "CLEAR_ISSUE" }
  | { action: "NOTE"; note: string };

export interface RuleItem {
  kind: string;
  isCritical: boolean;
  haccpTarget: string | null;
  mode: SectionMode;
}

/** A rule was broken. The message is written for staff and is safe to show them. */
export class ChecklistRuleError extends Error {
  constructor(
    message: string,
    public readonly status: number = 422
  ) {
    super(message);
    this.name = "ChecklistRuleError";
  }
}

const NOT_VERIFIED = { verifiedById: null, verifiedByName: null, verifiedAt: null };

function blankEntry(): EntryState {
  return {
    status: "NOT_STARTED",
    temperature: null,
    isCompliant: null,
    correctiveAction: null,
    note: null,
    recordedById: null,
    recordedByName: null,
    recordedAt: null,
    ...NOT_VERIFIED,
  };
}

function reading(item: RuleItem, input: Extract<EntryInput, { action: "DONE" }>) {
  if (item.kind !== "TEMPERATURE") return { temperature: null, isCompliant: null, correctiveAction: null };
  if (!isHaccpTarget(item.haccpTarget)) throw new ChecklistRuleError("This task has no temperature target set up.");
  if (input.temperature === undefined) throw new ChecklistRuleError("Enter the temperature reading first.");
  const { isCompliant } = evaluateTemperature(item.haccpTarget, input.temperature);
  const correctiveAction = input.correctiveAction?.trim() || null;
  if (!isCompliant && !correctiveAction) {
    throw new ChecklistRuleError("That reading is out of range. Say what you did about it.");
  }
  return { temperature: input.temperature, isCompliant, correctiveAction: isCompliant ? null : correctiveAction };
}

/** The entry after a staff action. Throws ChecklistRuleError when the action isn't allowed. */
export function nextEntry(args: {
  item: RuleItem;
  current: Partial<EntryState> | null;
  input: EntryInput;
  operator: Operator;
  now: Date;
}): EntryState {
  const { item, input, operator, now } = args;
  const base: EntryState = { ...blankEntry(), ...args.current };
  if (item.mode !== "TICK") throw new ChecklistRuleError("This task isn't ticked one by one.");
  if (base.status === "VERIFIED" && input.action !== "NOTE" && !hasRole(operator.role, "STORE_MANAGER")) {
    throw new ChecklistRuleError("A Shift Leader has signed this off. Only a Shift Leader can change it.", 403);
  }
  const stamp = { recordedById: operator.id, recordedByName: operator.name, recordedAt: now };

  switch (input.action) {
    case "DONE":
      return { ...base, ...reading(item, input), ...stamp, ...NOT_VERIFIED, status: "COMPLETED" };
    case "UNDO":
      return { ...blankEntry(), note: base.note };
    case "ISSUE":
      return { ...base, ...stamp, ...NOT_VERIFIED, status: "ISSUE_BLOCKED", note: input.note?.trim() || base.note };
    case "CLEAR_ISSUE":
      if (base.status !== "ISSUE_BLOCKED") throw new ChecklistRuleError("This task has no open issue.", 409);
      return blankEntry();
    case "NOTE":
      return { ...base, note: input.note.trim() };
  }
}

type EntrySnapshotFields = Pick<EntryState, "status" | "temperature" | "correctiveAction" | "note" | "recordedByName" | "verifiedByName">;

/** What an entry said before a change, for the audit log. */
export function entrySnapshot(entry: EntrySnapshotFields | null): EntrySnapshotFields | null {
  if (!entry) return null;
  const { status, temperature, correctiveAction, note, recordedByName, verifiedByName } = entry;
  return { status, temperature, correctiveAction, note, recordedByName, verifiedByName };
}

/** Shift Leader sign-off of a finished critical task. */
export function verifyEntry(args: {
  item: Pick<RuleItem, "isCritical">;
  current: Partial<EntryState> | null;
  operator: Operator;
  now: Date;
}): EntryState {
  const { item, current, operator, now } = args;
  if (!hasRole(operator.role, "STORE_MANAGER")) {
    throw new ChecklistRuleError("Only a Shift Leader can sign off. Enter a Shift Leader's PIN.", 403);
  }
  if (!item.isCritical) throw new ChecklistRuleError("This task doesn't need sign-off.");
  if (current?.status !== "COMPLETED") throw new ChecklistRuleError("Only a finished task can be signed off.", 409);
  return {
    ...blankEntry(),
    ...current,
    status: "VERIFIED",
    verifiedById: operator.id,
    verifiedByName: operator.name,
    verifiedAt: now,
  };
}

export interface ProgressItem {
  id: string;
  label: string;
  mode: SectionMode;
  isCritical: boolean;
  entry: { status: EntryStatus } | null;
}

export function isDone(status: EntryStatus | undefined | null): boolean {
  return status === "COMPLETED" || status === "VERIFIED";
}

function tickItems<T extends ProgressItem>(items: T[]): T[] {
  return items.filter((i) => i.mode === "TICK");
}

export function missingTasks<T extends ProgressItem>(items: T[]): T[] {
  return tickItems(items).filter((i) => !isDone(i.entry?.status));
}

export function canFinish(items: ProgressItem[]): boolean {
  return tickItems(items).length > 0 && missingTasks(items).length === 0;
}

export interface Progress {
  total: number;
  done: number;
  critOpen: number;
  signoff: number;
  issues: number;
}

export function progress(items: ProgressItem[]): Progress {
  const ticks = tickItems(items);
  return {
    total: ticks.length,
    done: ticks.filter((i) => isDone(i.entry?.status)).length,
    critOpen: ticks.filter((i) => i.isCritical && !isDone(i.entry?.status)).length,
    signoff: ticks.filter((i) => i.isCritical && i.entry?.status === "COMPLETED").length,
    issues: ticks.filter((i) => i.entry?.status === "ISSUE_BLOCKED").length,
  };
}

export function stationStatus(p: Progress): EntryStatus {
  if (p.issues > 0) return "ISSUE_BLOCKED";
  if (p.total > 0 && p.done === p.total) return p.signoff > 0 ? "COMPLETED" : "VERIFIED";
  return p.done > 0 ? "IN_PROGRESS" : "NOT_STARTED";
}

function localMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return get("hour") * 60 + get("minute");
}

/** Minutes until the opening time today; negative once it has passed. */
export function minutesToOpening(openingTime: string, now: Date, timeZone: string): number {
  const [h, m] = openingTime.split(":").map(Number);
  return h * 60 + m - localMinutes(now, timeZone);
}

// [ADR] Context: closing can run past midnight, and a new calendar date would start a second closing checklist.
// Decision: the shift day changes four hours after local midnight, long after any closing and before any opening.
// Consequence: work at 00:30 belongs to the day before. On a clock-change night the switch moves by an hour,
// which is harmless because the store is shut then.
const SHIFT_DAY_ROLLOVER_MS = 4 * 60 * 60_000;

export function shiftDateString(now: Date, timeZone: string): string {
  return zonedDateString(new Date(now.getTime() - SHIFT_DAY_ROLLOVER_MS), timeZone);
}

/** With a LOW level set the count decides; without one staff choose. A count of zero is always OUT. */
export function stockStatus(args: { count: number | null; lowAt: number | null; chosen: StockStatusValue | null }): StockStatusValue | null {
  const { count, lowAt, chosen } = args;
  if (count === 0) return "OUT";
  if (count !== null && lowAt !== null) return count <= lowAt ? "LOW" : "OK";
  return chosen;
}

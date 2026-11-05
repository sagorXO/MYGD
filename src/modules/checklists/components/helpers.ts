import { progress, type Progress } from "../rules";
import type { Board, BoardItem, BoardSection, Phase } from "../board.types";

export const PHASE_LABEL: Record<Phase, string> = { OPENING: "Opening", DURING_SHIFT: "During shift", CLOSING: "Closing" };
export const PHASES: Phase[] = ["OPENING", "DURING_SHIFT", "CLOSING"];

export function stations(board: Board): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const s of board.sections) if (!seen.has(s.station)) seen.set(s.station, s.stationName);
  return [...seen].map(([id, name]) => ({ id, name }));
}

export const sectionsFor = (board: Board, station: string, phase: Phase): BoardSection[] =>
  board.sections.filter((s) => s.station === station && s.phase === phase);

export const itemsFor = (board: Board, station: string, phase: Phase): BoardItem[] => sectionsFor(board, station, phase).flatMap((s) => s.items);

export const progressFor = (board: Board, station: string, phase: Phase): Progress => progress(itemsFor(board, station, phase));

export function clock(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}

export function runFor(board: Board, station: string, phase: Phase) {
  return board.runs.find((r) => r.station === station && r.phase === phase) ?? null;
}

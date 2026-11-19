// Shapes the checklist API returns to the tablet. No server imports, so client code can use them.
import type { EntryStatus, Operator, SectionMode, StockStatusValue } from "./rules";

export type Phase = "OPENING" | "DURING_SHIFT" | "CLOSING";

export interface BoardEntry {
  status: EntryStatus;
  temperature: number | null;
  isCompliant: boolean | null;
  correctiveAction: string | null;
  note: string | null;
  recordedByName: string | null;
  recordedAt: string | null;
}

export interface BoardItem {
  id: string;
  label: string;
  kind: "CHECK" | "TEMPERATURE" | "COUNT";
  haccpTarget: string | null;
  needsReview: string | null;
  mode: SectionMode;
  entry: BoardEntry | null;
}

export interface BoardSection {
  id: string;
  station: string;
  stationName: string;
  phase: Phase;
  title: string;
  mode: SectionMode;
  items: BoardItem[];
  lastCheckIn: { name: string; at: string } | null;
}

export interface BoardRun {
  station: string;
  phase: Phase;
  status: "OPEN" | "COMPLETED";
  completedByName: string | null;
  completedAt: string | null;
}

export interface Board {
  loaded: boolean;
  shiftDate: string;
  timeZone: string;
  openingTime: string;
  closingTime: string;
  minutesToOpening: number;
  sections: BoardSection[];
  runs: BoardRun[];
  quietPeriod: Record<string, string[]>;
  stationGuide: StationGuide;
  operator: Operator | null;
}

// Oliver's non-task guidance from the PDF, keyed by station id plus "general".
export type GuideKind = "RESPONSIBILITY" | "IMPORTANT" | "STANDARD" | "RULE" | "FLOW" | "EXAMPLE";

// A type alias (not an interface) so it stays assignable to Prisma's JSON input type.
export type GuideLine = {
  kind: GuideKind;
  title?: string;
  text: string;
  sourcePage: number;
};

export type StationGuide = Record<string, GuideLine[]>;

export interface StockRow {
  id: string;
  category: string;
  product: string;
  lowAt: number | null;
  needsReview: string | null;
  lastLabel: string;
  lastDate: string | null;
  count: number | null;
  status: StockStatusValue | null;
  counted: boolean;
}

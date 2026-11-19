import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/ui";
import type { EntryStatus } from "../rules";
import type { BoardItem } from "../board.types";

/** Colour always comes with an icon and words. */
export function ItemChips({ item }: { item: BoardItem }) {
  const e = item.entry;
  return (
    <>
      {e?.status === "ISSUE_BLOCKED" && <Badge tone="critical" icon={AlertTriangle}>Issue</Badge>}
      {item.needsReview && <Badge tone="warning">Oliver to confirm</Badge>}
    </>
  );
}

const STATION: Record<EntryStatus, { tone: "success" | "info" | "critical" | "neutral"; label: string; icon?: typeof Check }> = {
  NOT_STARTED: { tone: "neutral", label: "Not started" },
  IN_PROGRESS: { tone: "info", label: "In progress" },
  COMPLETED: { tone: "success", label: "Completed", icon: Check },
  // Rows saved under the old approval flow still read as done.
  VERIFIED: { tone: "success", label: "Completed", icon: Check },
  ISSUE_BLOCKED: { tone: "critical", label: "Issue / Blocked", icon: AlertTriangle },
};

export function StationChip({ status }: { status: EntryStatus }) {
  const s = STATION[status];
  return <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge>;
}

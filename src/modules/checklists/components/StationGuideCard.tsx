// Oliver's guidance from the PDF for the open station, plus the rules for everyone. Collapsed by default
// so the tasks stay at the top of the screen.
import { BookOpen } from "lucide-react";
import { Badge } from "@/ui";
import type { GuideKind, GuideLine } from "../board.types";

const KIND_LABEL: Record<GuideKind, string> = {
  RESPONSIBILITY: "Main responsibility",
  IMPORTANT: "Important",
  STANDARD: "Performance standard",
  RULE: "Rules",
  FLOW: "Flow",
  EXAMPLE: "Examples",
};

interface Group {
  label: string;
  kind: GuideKind;
  lines: GuideLine[];
}

// Next to each other, lines with the same heading are shown under one heading.
function groupLines(lines: GuideLine[]): Group[] {
  return lines.reduce<Group[]>((groups, line) => {
    const label = line.title ?? KIND_LABEL[line.kind];
    const last = groups[groups.length - 1];
    if (last && last.label === label) return [...groups.slice(0, -1), { ...last, lines: [...last.lines, line] }];
    return [...groups, { label, kind: line.kind, lines: [line] }];
  }, []);
}

function GuideGroups({ lines }: { lines: GuideLine[] }) {
  return (
    <div className="flex flex-col gap-3">
      {groupLines(lines).map((g, i) => (
        <div key={`${g.label}-${i}`} className={g.kind === "IMPORTANT" ? "rounded-md border-l-4 border-warning bg-warning-subtle px-3 py-2" : undefined}>
          <h4 className="text-sm font-semibold">{g.label}</h4>
          {g.lines.length === 1 && g.kind !== "RULE" && g.kind !== "STANDARD" ? (
            <p className={g.kind === "FLOW" ? "text-[15px] font-semibold tracking-wide" : "text-[15px] text-text-secondary"}>{g.lines[0].text}</p>
          ) : (
            <ul className="list-disc pl-5 text-[15px] text-text-secondary">{g.lines.map((l) => <li key={l.text}>{l.text}</li>)}</ul>
          )}
        </div>
      ))}
    </div>
  );
}

interface StationGuideCardProps {
  lines: GuideLine[];
  general: GuideLine[];
}

export function StationGuideCard({ lines, general }: StationGuideCardProps) {
  if (lines.length === 0 && general.length === 0) return null;
  return (
    <details className="group overflow-hidden rounded-lg border border-border bg-surface">
      <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 bg-canvas px-3.5 py-2.5">
        <BookOpen size={18} aria-hidden className="text-text-secondary" />
        <h2 className="text-base font-semibold">Station guide</h2>
        <Badge>From the operations manual</Badge>
        <span className="ml-auto text-sm text-text-secondary group-open:hidden">Tap to open</span>
        <span className="ml-auto hidden text-sm text-text-secondary group-open:inline">Tap to close</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-border px-3.5 py-3">
        {lines.length > 0 && <GuideGroups lines={lines} />}
        {general.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="border-b border-border pb-1 text-base font-semibold">General rules</h3>
            <GuideGroups lines={general} />
          </section>
        )}
      </div>
    </details>
  );
}

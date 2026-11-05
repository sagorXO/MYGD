"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/ui";
import { cn } from "@/lib/cn";
import { evaluateTemperature, isHaccpTarget, limitText } from "@/modules/haccp/temperature";
import { isDone, type EntryInput } from "../rules";
import type { BoardItem } from "../board.types";
import { ItemChips } from "./StatusChips";
import { clock } from "./helpers";

const FIELD = "min-h-hit flex-1 basis-60 rounded-md border border-border bg-surface px-3 text-base text-text";

function parseReading(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && Number.isFinite(value) ? value : null;
}

interface TaskRowProps {
  item: BoardItem;
  locked: boolean;
  timeZone: string;
  /** Goes up when a save fails, so a note that didn't save goes back to what is stored. */
  failedSaves: number;
  onAct: (itemId: string, input: EntryInput) => void;
}

export function TaskRow({ item, locked, timeZone, failedSaves, onAct }: TaskRowProps) {
  const id = useId();
  const e = item.entry;
  const done = isDone(e?.status);
  const issue = e?.status === "ISSUE_BLOCKED";
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(e?.note ?? "");
  const [temp, setTemp] = useState(e?.temperature != null ? String(e.temperature) : "");
  const [fix, setFix] = useState(e?.correctiveAction ?? "");

  // Keep up with changes saved on another tablet, without overwriting someone mid-typing.
  useEffect(() => { if (document.activeElement?.id !== `${id}-note`) setNote(e?.note ?? ""); }, [e?.note, id, failedSaves]);
  useEffect(() => { if (document.activeElement?.id !== `${id}-temp`) setTemp(e?.temperature != null ? String(e.temperature) : ""); }, [e?.temperature, id]);
  useEffect(() => { if (document.activeElement?.id !== `${id}-fix`) setFix(e?.correctiveAction ?? ""); }, [e?.correctiveAction, id]);

  const isTemp = item.kind === "TEMPERATURE" && isHaccpTarget(item.haccpTarget);
  const reading = parseReading(temp);
  const compliant = isTemp && reading !== null && isHaccpTarget(item.haccpTarget) ? evaluateTemperature(item.haccpTarget, reading).isCompliant : null;
  const blockedByReading = !done && isTemp && (reading === null || (compliant === false && !fix.trim()));

  const tick = () => {
    if (done) return onAct(item.id, { action: "UNDO" });
    onAct(item.id, isTemp && reading !== null ? { action: "DONE", temperature: reading, correctiveAction: fix.trim() || undefined } : { action: "DONE" });
  };
  const saveNote = () => { if (note.trim() !== (e?.note ?? "")) onAct(item.id, { action: "NOTE", note: note.trim() }); };

  return (
    <div className={cn("grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-2 border-b border-border py-1.5 pl-2 pr-3.5 last:border-b-0", issue && "bg-danger-subtle")}>
      <button
        type="button"
        onClick={tick}
        disabled={locked || blockedByReading}
        aria-pressed={done}
        aria-label={`${done ? "Undo" : "Mark done"}: ${item.label}`}
        title={blockedByReading ? "Enter the reading first" : undefined}
        className="grid h-14 w-14 place-items-center disabled:cursor-not-allowed"
      >
        <span className={cn("grid h-8 w-8 place-items-center rounded-md border-2", done ? "border-success bg-success text-surface" : "border-border bg-surface", blockedByReading && "opacity-50")}>
          {done && <Check size={20} strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <div className={cn("min-w-0 flex-[1_1_280px] text-[17px] font-medium leading-6", done ? "text-text-secondary" : "text-text")}>{item.label}</div>
        <ItemChips item={item} />
        {done && e?.recordedByName && <span className="whitespace-nowrap text-[13px] text-text-secondary tabular-nums">{e.recordedByName} {clock(e.recordedAt, timeZone)}</span>}
        {!locked && (
          <>
            <button type="button" onClick={() => setShowNote((v) => !v)} className="min-h-11 px-2 text-[13px] font-semibold text-text-secondary underline underline-offset-4">Note</button>
            <button type="button" onClick={() => onAct(item.id, issue ? { action: "CLEAR_ISSUE" } : { action: "ISSUE", note: note.trim() || undefined })} className="min-h-11 px-2 text-[13px] font-semibold text-text-secondary underline underline-offset-4">
              {issue ? "Clear issue" : "Issue"}
            </button>
          </>
        )}
      </div>
      {isTemp && isHaccpTarget(item.haccpTarget) && (
        <div className="col-start-2 flex flex-wrap items-center gap-2 pb-1.5">
          <label htmlFor={`${id}-temp`} className="text-[13px] text-text-secondary">Reading</label>
          <input id={`${id}-temp`} value={temp} onChange={(ev) => setTemp(ev.target.value)} disabled={locked || done} inputMode="decimal" aria-label="Temperature in Celsius" className="min-h-[52px] w-28 rounded-md border border-border bg-surface px-3 text-xl font-bold tabular-nums text-text disabled:bg-surface-hover" />
          <span className="text-[13px] text-text-secondary">°C</span>
          {compliant === true && <Badge tone="success" icon={Check}>In range {limitText(item.haccpTarget)}</Badge>}
          {compliant === false && <Badge tone="critical" icon={AlertTriangle}>Out of range {limitText(item.haccpTarget)}</Badge>}
          {compliant === null && <span className="text-[13px] text-text-secondary">Must be {limitText(item.haccpTarget)}</span>}
          {compliant === false && (
            <input id={`${id}-fix`} value={fix} onChange={(ev) => setFix(ev.target.value)} disabled={locked || done} maxLength={500} placeholder="What did you do about it? (required)" aria-label="What did you do about it?" className={FIELD} />
          )}
        </div>
      )}
      {(showNote || issue || e?.note) && (
        <div className="col-start-2 flex flex-wrap gap-2 pb-1.5">
          <input id={`${id}-note`} value={note} onChange={(ev) => setNote(ev.target.value)} onBlur={saveNote} disabled={locked} maxLength={500} placeholder={issue ? "What is the problem?" : "Add a note"} aria-label={issue ? "What is the problem?" : "Note"} className={FIELD} />
        </div>
      )}
    </div>
  );
}

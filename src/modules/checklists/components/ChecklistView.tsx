"use client";

import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { Badge, Button, ProgressBar } from "@/ui";
import { cn } from "@/lib/cn";
import { canFinish, isDone, type EntryInput } from "../rules";
import type { Board, BoardSection, Phase } from "../board.types";
import { TaskRow } from "./TaskRow";
import { clock, itemsFor, PHASE_LABEL, PHASES, progressFor, runFor, sectionsFor, stations } from "./helpers";

const CARD = "overflow-hidden rounded-lg border border-border bg-surface";
const HEADER = "flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-canvas px-3.5 py-2.5";

interface ChecklistViewProps {
  board: Board;
  station: string;
  phase: Phase;
  onStation: (id: string) => void;
  onPhase: (phase: Phase) => void;
  onAct: (itemId: string, input: EntryInput) => void;
  onCheckIn: (sectionId: string) => void;
  onFinish: () => void;
  onOpenStock: () => void;
  failedSaves: number;
}

function GuideSection({ section, timeZone, onCheckIn }: { section: BoardSection; timeZone: string; onCheckIn: (id: string) => void }) {
  const perOrder = section.mode === "REFERENCE_PER_ORDER";
  return (
    <section className={CARD}>
      <header className={HEADER}>
        <h2 className="text-base font-semibold">{section.title}</h2>
        {perOrder && <Badge>Every order</Badge>}
        {!perOrder && section.lastCheckIn && <Badge tone="success" icon={Check}>Checked {section.lastCheckIn.name} {clock(section.lastCheckIn.at, timeZone)}</Badge>}
        <span className="ml-auto text-sm text-text-secondary">{section.items.length} tasks</span>
      </header>
      {!perOrder && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-3.5 py-2.5">
          <span className="flex-[1_1_240px]">Confirm this section is on track.</span>
          <Button variant={section.lastCheckIn ? "secondary" : "primary"} size="lg" onClick={() => onCheckIn(section.id)}>{section.lastCheckIn ? "Check in again" : "Check in"}</Button>
        </div>
      )}
      <details className="px-3.5 pb-2.5" open={perOrder}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-text-secondary">{perOrder ? "Check these on every order" : "Show the tasks"}</summary>
        <ul className="list-disc pl-5 text-[15px] text-text-secondary">{section.items.map((i) => <li key={i.id}>{i.label}</li>)}</ul>
      </details>
    </section>
  );
}

export function ChecklistView({ board, station, phase, onStation, onPhase, onAct, onCheckIn, onFinish, onOpenStock, failedSaves }: ChecklistViewProps) {
  const sections = sectionsFor(board, station, phase);
  const items = itemsFor(board, station, phase);
  const p = progressFor(board, station, phase);
  const run = runFor(board, station, phase);
  const finished = run?.status === "COMPLETED";
  const open = p.total - p.done;
  const quiet = phase === "DURING_SHIFT" ? board.quietPeriod[station] : undefined;

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 p-4 md:grid-cols-[232px_minmax(0,1fr)]">
      <nav aria-label="Stations" className="flex gap-1 self-start overflow-x-auto pb-1 md:sticky md:top-2 md:flex-col md:overflow-visible">
        {stations(board).map((s) => {
          const has = sectionsFor(board, s.id, phase).length > 0;
          const x = progressFor(board, s.id, phase);
          return (
            <button key={s.id} type="button" disabled={!has} aria-current={s.id === station} onClick={() => onStation(s.id)} className={cn("flex min-h-[60px] min-w-[150px] shrink-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-[15px] font-semibold leading-5 disabled:opacity-40 md:min-w-0", s.id === station ? "border-accent bg-accent-subtle" : "border-transparent")}>
              <span>{s.name}{x.critOpen > 0 && <small className="block text-xs font-medium text-text-secondary">{x.critOpen} critical open</small>}</span>
              <span className="whitespace-nowrap text-sm text-text-secondary tabular-nums">{has && x.total > 0 ? (x.done === x.total ? <Check size={18} className="text-success" aria-label="All done" /> : `${x.done}/${x.total}`) : "–"}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="text-[28px] font-bold leading-9">{stations(board).find((s) => s.id === station)?.name}</h1>
        <div role="tablist" aria-label="Phase" className="flex flex-wrap gap-1 border-b border-border">
          {PHASES.filter((ph) => sectionsFor(board, station, ph).length > 0).map((ph) => (
            <button key={ph} role="tab" type="button" aria-selected={ph === phase} onClick={() => onPhase(ph)} className={cn("-mb-px min-h-[52px] border-b-[3px] px-4 font-semibold", ph === phase ? "border-accent text-text" : "border-transparent text-text-secondary")}>{PHASE_LABEL[ph]}</button>
          ))}
        </div>

        {p.total > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary">
              <b className="text-text tabular-nums">{p.done} of {p.total} done</b>
              {p.critOpen > 0 && <Badge tone="critical" icon={ShieldCheck}>{p.critOpen} critical open</Badge>}
              {p.issues > 0 && <Badge tone="critical" icon={AlertTriangle}>{p.issues} issue{p.issues > 1 ? "s" : ""}</Badge>}
            </div>
            <ProgressBar value={(p.done / p.total) * 100} label={`${p.done} of ${p.total} tasks done`} tone="success" />
          </div>
        )}

        {sections.map((s) => {
          if (s.mode === "TICK") {
            const d = s.items.filter((i) => isDone(i.entry?.status)).length;
            return (
              <section key={s.id} className={CARD}>
                <header className={HEADER}><h2 className="text-base font-semibold">{s.title}</h2><span className="ml-auto text-sm text-text-secondary tabular-nums">{d}/{s.items.length}</span></header>
                {s.items.map((i) => <TaskRow key={i.id} item={i} locked={finished} timeZone={board.timeZone} failedSaves={failedSaves} onAct={onAct} />)}
              </section>
            );
          }
          if (s.mode === "COUNT") {
            return (
              <section key={s.id} className={CARD}>
                <header className={HEADER}><h2 className="text-base font-semibold">{s.title}</h2><span className="ml-auto text-sm text-text-secondary">{s.items.length} checks</span></header>
                <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                  <span className="flex-[1_1_240px]">Enter a number for each product. Choose OK, LOW or OUT.</span>
                  <Button variant="secondary" size="lg" onClick={onOpenStock}>Open stock count</Button>
                </div>
              </section>
            );
          }
          return <GuideSection key={s.id} section={s} timeZone={board.timeZone} onCheckIn={onCheckIn} />;
        })}

        {quiet && (
          <section className={CARD}>
            <header className={HEADER}><h2 className="text-base font-semibold">Quiet period, in this order</h2><Badge>No active orders</Badge></header>
            <ul className="list-disc py-2.5 pl-8 pr-3.5 text-[15px] text-text-secondary">{quiet.map((q) => <li key={q}>{q}</li>)}</ul>
          </section>
        )}

        {p.total > 0 && (
          <div className="sticky bottom-0 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
            <span className="flex-[1_1_200px] text-sm text-text-secondary">
              {finished ? `Finished by ${run?.completedByName} at ${clock(run?.completedAt, board.timeZone)}` : open > 0 ? `${open} task${open > 1 ? "s" : ""} still open${p.critOpen ? `, ${p.critOpen} critical` : ""}` : "All tasks done"}
            </span>
            <Button variant="primary" size="xl" disabled={finished || !canFinish(items)} onClick={onFinish}>Finish {PHASE_LABEL[phase]}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

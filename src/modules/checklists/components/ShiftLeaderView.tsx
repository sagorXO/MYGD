"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Banner, Badge, Button, ProgressBar } from "@/ui";
import { cn } from "@/lib/cn";
import { hasRole } from "@/lib/auth/roles";
import { isHaccpTarget, limitText } from "@/modules/haccp/temperature";
import { stationStatus } from "../rules";
import type { Board, Phase, StockRow } from "../board.types";
import { StationChip } from "./StatusChips";
import { clock, itemsFor, PHASE_LABEL, PHASES, progressFor, sectionsFor, stations } from "./helpers";

interface ShiftLeaderViewProps {
  board: Board;
  phase: Phase;
  stock: StockRow[] | null;
  onPhase: (phase: Phase) => void;
  onOpenStation: (id: string) => void;
  onOpenStock: () => void;
  onVerify: (itemId: string) => void;
  onResolve: (itemId: string) => void;
  onOpeningTime: (time: string) => void;
}

const CARD = "overflow-hidden rounded-lg border border-border bg-surface";
const HEADER = "flex items-center gap-3 border-b border-border bg-canvas px-3.5 py-2.5";

function Tile({ value, label, tone }: { value: string | number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-3">
      <b className={cn("block text-3xl font-bold leading-9 tabular-nums", tone)}>{value}</b>
      <span className="text-[13px] text-text-secondary">{label}</span>
    </div>
  );
}

export function ShiftLeaderView({ board, phase, stock, onPhase, onOpenStation, onOpenStock, onVerify, onResolve, onOpeningTime }: ShiftLeaderViewProps) {
  const [opening, setOpening] = useState(board.openingTime);
  useEffect(() => setOpening(board.openingTime), [board.openingTime]);

  const list = stations(board).filter((s) => sectionsFor(board, s.id, phase).length > 0);
  const rows = list.map((s) => ({ ...s, p: progressFor(board, s.id, phase) }));
  const sum = (key: "done" | "total" | "critOpen") => rows.reduce((a, r) => a + r.p[key], 0);
  const withStation = list.flatMap((s) => itemsFor(board, s.id, phase).map((item) => ({ item, name: s.name })));
  const signoff = withStation.filter(({ item }) => item.isCritical && item.entry?.status === "COMPLETED");
  const issues = withStation.filter(({ item }) => item.entry?.status === "ISSUE_BLOCKED");
  const isLeader = board.operator ? hasRole(board.operator.role, "STORE_MANAGER") : false;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-3 p-4">
      <h1 className="text-[28px] font-bold leading-9">Shift Leader dashboard</h1>
      <div role="tablist" aria-label="Phase" className="flex flex-wrap gap-1 border-b border-border">
        {PHASES.map((ph) => <button key={ph} role="tab" type="button" aria-selected={ph === phase} onClick={() => onPhase(ph)} className={cn("-mb-px min-h-[52px] border-b-[3px] px-4 font-semibold", ph === phase ? "border-accent text-text" : "border-transparent text-text-secondary")}>{PHASE_LABEL[ph]}</button>)}
      </div>
      {!isLeader && <Banner tone="info" title="Enter a Shift Leader's PIN to sign off tasks or change the opening time." />}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        <Tile value={`${sum("done")} / ${sum("total")}`} label="Tasks done" />
        <Tile value={sum("critOpen")} label="Critical tasks open" tone="text-danger" />
        <Tile value={signoff.length} label="Waiting for my sign-off" tone="text-info" />
        <Tile value={issues.length} label="Issues" tone="text-warning" />
      </div>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <section className={CARD}>
            <header className={HEADER}><h2 className="text-base font-semibold">Stations</h2></header>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="text-left text-xs text-text-secondary"><th className="px-3 py-2 font-semibold">Station</th><th className="px-3 py-2 font-semibold">Progress</th><th className="px-3 py-2 font-semibold">Critical open</th><th className="px-3 py-2 font-semibold">Status</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-1.5"><button type="button" onClick={() => onOpenStation(r.id)} className="min-h-11 text-left font-semibold">{r.name}</button></td>
                      <td className="min-w-28 px-3 py-1.5"><div className="text-[13px] tabular-nums text-text-secondary">{r.p.done}/{r.p.total}</div><ProgressBar value={r.p.total ? (r.p.done / r.p.total) * 100 : 0} label={`${r.name} progress`} tone="success" /></td>
                      <td className="px-3 py-1.5 tabular-nums">{r.p.critOpen}</td>
                      <td className="px-3 py-1.5"><StationChip status={stationStatus(r.p)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className={CARD}>
            <header className={HEADER}><h2 className="text-base font-semibold">Stock</h2></header>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
              {stock ? (
                <>
                  <span>{stock.filter((r) => r.counted).length} of {stock.length} counted</span>
                  <Badge tone="warning">LOW {stock.filter((r) => r.status === "LOW").length}</Badge>
                  <Badge tone="critical">OUT {stock.filter((r) => r.status === "OUT").length}</Badge>
                </>
              ) : <span className="text-text-secondary">Loading stock</span>}
              <Button className="ml-auto" variant="secondary" size="lg" onClick={onOpenStock}>See stock list</Button>
            </div>
          </section>
          <section className={CARD}>
            <header className={HEADER}><h2 className="text-base font-semibold">Opening time</h2></header>
            <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 text-sm">
              <label htmlFor="opening-time">Opening time</label>
              <input id="opening-time" type="time" value={opening} onChange={(e) => setOpening(e.target.value)} onBlur={() => { if (opening && opening !== board.openingTime) onOpeningTime(opening); }} className="min-h-12 rounded-md border border-border bg-surface px-2.5 tabular-nums text-text" />
              <span className="text-[13px] text-text-secondary">Opening deadlines follow this setting.</span>
            </div>
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <section className={CARD}>
            <header className={HEADER}><h2 className="text-base font-semibold">Needs my sign-off</h2><span className="ml-auto text-sm tabular-nums text-text-secondary">{signoff.length}</span></header>
            {signoff.length === 0 && <p className="px-3.5 py-4 text-sm text-text-secondary">Nothing is waiting for you.</p>}
            {signoff.map(({ item, name }) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 border-t border-border px-3.5 py-2.5 first:border-t-0">
                <div className="min-w-0 flex-[1_1_180px]"><p className="font-medium">{item.label}</p><small className="text-[13px] tabular-nums text-text-secondary">{name} · {item.entry?.recordedByName} {clock(item.entry?.recordedAt, board.timeZone)}{item.entry?.temperature != null ? ` · ${item.entry.temperature} °C` : ""}</small>
                  {item.entry?.isCompliant === false && (
                    <div className="mt-1 flex flex-col items-start gap-1">
                      <Badge tone="critical" icon={AlertTriangle}>Out of range{isHaccpTarget(item.haccpTarget) ? `: must be ${limitText(item.haccpTarget)}` : ""}</Badge>
                      <span className="text-[13px] text-text">Action taken: {item.entry.correctiveAction}</span>
                    </div>
                  )}
                </div>
                <Button variant="primary" size="lg" onClick={() => onVerify(item.id)}>Verify</Button>
              </div>
            ))}
          </section>
          <section className={CARD}>
            <header className={HEADER}><h2 className="text-base font-semibold">Issues</h2><span className="ml-auto text-sm tabular-nums text-text-secondary">{issues.length}</span></header>
            {issues.length === 0 && <p className="px-3.5 py-4 text-sm text-text-secondary">No open issues.</p>}
            {issues.map(({ item, name }) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 border-t border-border px-3.5 py-2.5 first:border-t-0">
                <div className="min-w-0 flex-[1_1_180px]"><p className="font-medium">{item.label}</p><small className="text-[13px] text-text-secondary">{name} · {item.entry?.recordedByName} {clock(item.entry?.recordedAt, board.timeZone)}{item.entry?.note ? ` · ${item.entry.note}` : ""}</small></div>
                <Button variant="secondary" size="lg" onClick={() => onResolve(item.id)}>Resolve</Button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

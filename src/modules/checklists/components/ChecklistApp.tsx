"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Badge, Banner, Button, EmptyState, ErrorState, SegmentedControl, Skeleton } from "@/ui";
import type { EntryInput, Operator, StockStatusValue } from "../rules";
import type { Board, Phase, StockRow } from "../board.types";
import * as api from "./checklistApi";
import { ChecklistView } from "./ChecklistView";
import { OperatorPad } from "./OperatorPad";
import { ShiftLeaderView } from "./ShiftLeaderView";
import { StockView } from "./StockView";
import { PHASE_LABEL, sectionsFor, stations } from "./helpers";

type View = "list" | "dash" | "stock";

const REFRESH_MS = 20_000;

function LoadingShell() {
  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 p-4 md:grid-cols-[232px_minmax(0,1fr)]" aria-busy="true">
      <div className="flex flex-col gap-1">{[0, 1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-[60px] w-full" />)}</div>
      <div className="flex flex-col gap-3"><Skeleton className="h-9 w-72" /><Skeleton className="h-[52px] w-full" /><Skeleton variant="block" className="h-96" /></div>
    </div>
  );
}

function shiftDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function ChecklistApp() {
  const [board, setBoard] = useState<Board | null>(null);
  const [stock, setStock] = useState<StockRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [view, setView] = useState<View>("list");
  const [station, setStation] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("OPENING");
  const [padOpen, setPadOpen] = useState(false);
  // Goes up whenever a save didn't happen, so typed values go back to what is stored instead of looking saved.
  const [failedSaves, setFailedSaves] = useState(0);
  const pending = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    const [b, s] = await Promise.all([api.fetchBoard(), api.fetchStock()]);
    if (b.ok) { setBoard(b.data.board); setLoadError(null); } else setLoadError(b.error);
    if (s.ok) setStock(s.data.stock);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  /** Saves, then reloads the board. If nobody has entered a PIN, asks for one and carries on afterwards. */
  const perform = useCallback(async (call: () => Promise<api.ApiResult<unknown>>) => {
    setActionError(null);
    setSaveState("saving");
    const res = await call();
    if (!res.ok) {
      setSaveState("idle");
      if (res.code === "OPERATOR_REQUIRED") {
        pending.current = () => void perform(call);
        setPadOpen(true);
        return;
      }
      setActionError(res.status === 401 ? "You've been signed out. Reload the page and sign in." : res.error);
      setFailedSaves((n) => n + 1);
      await refresh();
      return;
    }
    await refresh();
    setSaveState("saved");
  }, [refresh]);

  const signedIn = (operator: Operator) => {
    setBoard((b) => (b ? { ...b, operator } : b));
    setActionError(null);
    setPadOpen(false);
    const next = pending.current;
    pending.current = null;
    next?.();
  };

  if (!board) {
    if (loadError) return <div className="p-4"><ErrorState title="Couldn't load the checklists" description={loadError} onRetry={() => void refresh()} /></div>;
    return <LoadingShell />;
  }
  if (!board.loaded) return <div className="p-4"><EmptyState title="No checklists on this server yet" description="An administrator needs to run npm run checklists:load." /></div>;

  const all = stations(board);
  const currentStation = station ?? all[0]?.id ?? "";
  const left = board.minutesToOpening;
  const act = (itemId: string, input: EntryInput) => void perform(() => api.saveEntry(itemId, input));
  const saveCount = (stockItemId: string, patch: { count?: number | null; status?: StockStatusValue | null }) => void perform(() => api.saveStock({ stockItemId, ...patch }));
  const chooseStation = (id: string) => {
    setStation(id);
    if (sectionsFor(board, id, phase).length === 0) setPhase("OPENING");
  };

  return (
    <div className="min-h-screen bg-canvas text-text">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-4 py-2.5">
        <div className="font-bold tracking-wide">MY <span className="text-accent">GERMAN</span> DÖNER</div>
        <div className="text-sm text-text-secondary">{shiftDateLabel(board.shiftDate)} · {PHASE_LABEL[phase]}</div>
        <div className="flex-1" />
        <SegmentedControl
          label="Screen"
          value={view}
          onChange={(v: string) => setView(v as View)}
          options={[{ value: "list", label: "Checklist" }, { value: "dash", label: "Shift Leader" }, { value: "stock", label: "Stock count" }]}
        />
        {phase === "OPENING" && <Badge tone={left < 0 ? "critical" : "warning"} icon={Clock}>Due by {board.openingTime} · {left < 0 ? `${-left} min late` : `${left} min left`}</Badge>}
        <span role="status" className="min-w-14 text-[13px] text-text-secondary">{saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : ""}</span>
        <Button variant="secondary" size="lg" onClick={() => setPadOpen(true)}>{board.operator ? `${board.operator.name} · Switch` : "Enter PIN"}</Button>
      </div>

      {actionError && <div className="sticky top-0 z-20 px-4 pt-3"><Banner tone="critical" title={actionError} onDismiss={() => setActionError(null)} /></div>}
      {loadError && <div className="px-4 pt-3"><Banner tone="warning" title={`Showing the last saved list. ${loadError}`} /></div>}

      {view === "list" && (
        <ChecklistView
          board={board}
          station={currentStation}
          phase={phase}
          onStation={chooseStation}
          onPhase={setPhase}
          onAct={act}
          onCheckIn={(id) => void perform(() => api.checkIn(id))}
          onFinish={() => void perform(() => api.finishRun(currentStation, phase))}
          onOpenStock={() => setView("stock")}
          failedSaves={failedSaves}
        />
      )}
      {view === "dash" && (
        <ShiftLeaderView
          key={failedSaves}
          board={board}
          phase={phase}
          stock={stock}
          onPhase={setPhase}
          onOpenStation={(id) => { chooseStation(id); setView("list"); }}
          onOpenStock={() => setView("stock")}
          onVerify={(id) => void perform(() => api.verifyItem(id))}
          onResolve={(id) => act(id, { action: "CLEAR_ISSUE" })}
          onOpeningTime={(t) => void perform(() => api.setOpeningTime(t))}
        />
      )}
      {view === "stock" && <StockView key={failedSaves} stock={stock} onSave={saveCount} />}

      <OperatorPad open={padOpen} onClose={() => { if (pending.current) setFailedSaves((n) => n + 1); pending.current = null; setPadOpen(false); }} onSignedIn={signedIn} />
    </div>
  );
}

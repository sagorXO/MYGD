"use client";

import { useEffect, useState } from "react";
import { Badge, Skeleton } from "@/ui";
import type { StockStatusValue } from "../rules";
import type { StockRow } from "../board.types";

const CONTROL = "min-h-12 rounded-md border border-border bg-surface px-2.5 text-text";

function Row({ row, onSave }: { row: StockRow; onSave: (id: string, patch: { count?: number | null; status?: StockStatusValue | null }) => void }) {
  const [draft, setDraft] = useState(row.count != null ? String(row.count) : "");
  useEffect(() => setDraft(row.count != null ? String(row.count) : ""), [row.count]);
  const commit = () => {
    const text = draft.trim().replace(",", ".");
    const value = text === "" ? null : Number(text);
    if (value !== null && (!Number.isFinite(value) || value < 0)) return setDraft(row.count != null ? String(row.count) : "");
    if (value !== row.count) onSave(row.id, { count: value });
  };
  return (
    <tr>
      <td className="border-b border-border px-3 py-2 font-medium">
        {row.product}
        {row.needsReview && <div><Badge tone="warning">{row.needsReview}</Badge></div>}
      </td>
      <td className="border-b border-border px-3 py-2 tabular-nums">{row.lastLabel}</td>
      <td className="border-b border-border px-3 py-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} inputMode="decimal" aria-label={`Current count for ${row.product}`} className={`${CONTROL} w-24 tabular-nums`} />
      </td>
      <td className="border-b border-border px-3 py-2">
        <select value={row.status ?? ""} onChange={(e) => onSave(row.id, { status: (e.target.value || null) as StockStatusValue | null })} aria-label={`Status for ${row.product}`} className={CONTROL}>
          <option value="">Not set</option><option value="OK">OK</option><option value="LOW">LOW</option><option value="OUT">OUT</option>
        </select>
      </td>
    </tr>
  );
}

interface StockViewProps {
  stock: StockRow[] | null;
  onSave: (id: string, patch: { count?: number | null; status?: StockStatusValue | null }) => void;
}

export function StockView({ stock, onSave }: StockViewProps) {
  if (!stock) return <div className="mx-auto flex max-w-[1280px] flex-col gap-3 p-4"><Skeleton variant="block" /><Skeleton variant="block" /><Skeleton variant="block" /></div>;
  const categories = [...new Set(stock.map((r) => r.category))];
  const counted = stock.filter((r) => r.counted).length;
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-3 p-4">
      <h1 className="text-[28px] font-bold leading-9">Stock count</h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary">
        <b className="text-text tabular-nums">{counted} of {stock.length} counted</b>
        <Badge tone="critical">OUT {stock.filter((r) => r.status === "OUT").length}</Badge>
        <Badge tone="warning">LOW {stock.filter((r) => r.status === "LOW").length}</Badge>
        <span>Choose the status yourself until LOW levels are set.</span>
      </div>
      {categories.map((c) => (
        <section key={c} className="overflow-hidden rounded-lg border border-border bg-surface">
          <header className="border-b border-border bg-canvas px-3.5 py-2.5"><h2 className="text-base font-semibold">{c}</h2></header>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="text-left text-xs text-text-secondary"><th className="px-3 py-2 font-semibold">Product</th><th className="px-3 py-2 font-semibold">Last count</th><th className="px-3 py-2 font-semibold">Current count</th><th className="px-3 py-2 font-semibold">Status</th></tr></thead>
              <tbody>{stock.filter((r) => r.category === c).map((r) => <Row key={r.id} row={r} onSave={onSave} />)}</tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

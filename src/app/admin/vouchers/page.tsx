"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatEuro } from "@/lib/i18n";
import { Ticket, Gift, Percent, Euro, Power, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

type Kind = "PERCENT" | "FIXED" | "GIFT_CARD";

interface VoucherRow {
  id: string;
  code: string;
  kind: Kind;
  value: number;
  minSubtotal: number;
  validFrom: string | null;
  validUntil: string | null;
  maxRedemptions: number | null;
  redemptions: number;
  balance: number | null;
  isActive: boolean;
  note: string | null;
}

interface PromotionRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

const KIND_LABEL: Record<Kind, string> = { PERCENT: "% off", FIXED: "€ off", GIFT_CARD: "Gift card" };

function describe(v: VoucherRow): string {
  if (v.kind === "PERCENT") return `${v.value}% off`;
  if (v.kind === "FIXED") return `${formatEuro(v.value)} off`;
  return `Balance ${formatEuro(v.balance ?? 0)}`;
}

const emptyForm = { code: "", kind: "PERCENT" as Kind, value: "10", balance: "20", minSubtotal: "0", maxRedemptions: "", validUntil: "", note: "" };

export default function VouchersAdminPage() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setVouchers(data.vouchers);
      setPromotions(data.promotions);
      setStatus("ready");
    } catch (err) {
      console.error("[Vouchers] load failed", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        code: form.code,
        kind: form.kind,
        minSubtotal: Number(form.minSubtotal) || 0,
      };
      if (form.kind === "GIFT_CARD") body.balance = Number(form.balance);
      else body.value = Number(form.value);
      if (form.maxRedemptions) body.maxRedemptions = Number(form.maxRedemptions);
      if (form.validUntil) body.validUntil = new Date(`${form.validUntil}T23:59:59`).toISOString();
      if (form.note.trim()) body.note = form.note.trim();

      const res = await fetch("/api/admin/vouchers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const issue = data.issues?.[0]?.message;
        throw new Error(issue || data.error || `HTTP ${res.status}`);
      }
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the voucher");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (v: VoucherRow) => {
    const res = await fetch("/api/admin/vouchers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: v.code, isActive: !v.isActive }) });
    if (res.ok) await load();
    else setFormError("Could not change the voucher");
  };

  const input = "w-full bg-[#1F1F21] border border-[#3A3A3E] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50D7E]";

  return (
    <div className="min-h-screen bg-[#121214] text-white font-sans p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between border-b-2 border-[#3A3A3E] pb-4">
        <div className="flex items-center gap-3">
          <Ticket className="text-[#E50D7E]" />
          <h1 className="font-display font-black text-2xl uppercase tracking-tight">Vouchers & Offers</h1>
        </div>
        <Link href="/admin" className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1">
          <ArrowLeft size={14} /> HQ portal
        </Link>
      </header>

      <section aria-labelledby="offers" className="space-y-2">
        <h2 id="offers" className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-wider">Automatic offers (always applied at the till)</h2>
        {status === "loading" ? (
          <div className="h-14 rounded-xl bg-[#1A1A1E] animate-pulse" />
        ) : promotions.length === 0 ? (
          <p className="text-xs text-zinc-500">No offers set up.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {promotions.map((p) => (
              <li key={p.id} className="rounded-xl bg-[#1A1A1E] border border-[#27272A] px-3 py-2.5 text-sm flex items-center justify-between">
                <span>{p.name}</span>
                <span className={`text-[10px] font-mono font-bold ${p.isActive ? "text-[#10B981]" : "text-zinc-500"}`}>{p.isActive ? "ON" : "OFF"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="new" className="rounded-2xl bg-[#1A1A1E] border border-[#27272A] p-4">
        <h2 id="new" className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-wider mb-3">New voucher or gift card</h2>
        <form onSubmit={create} className="grid sm:grid-cols-3 gap-3">
          <label className="text-[11px] text-zinc-400 space-y-1">Code
            <input className={input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" required minLength={3} />
          </label>
          <label className="text-[11px] text-zinc-400 space-y-1">Type
            <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Euro amount off</option>
              <option value="GIFT_CARD">Gift card (balance)</option>
            </select>
          </label>
          {form.kind === "GIFT_CARD" ? (
            <label className="text-[11px] text-zinc-400 space-y-1">Starting balance (€)
              <input className={input} type="number" min="0.01" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required />
            </label>
          ) : (
            <label className="text-[11px] text-zinc-400 space-y-1">{form.kind === "PERCENT" ? "Percent (1–100)" : "Amount (€)"}
              <input className={input} type="number" min="0.01" max={form.kind === "PERCENT" ? 100 : undefined} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </label>
          )}
          <label className="text-[11px] text-zinc-400 space-y-1">Minimum spend (€)
            <input className={input} type="number" min="0" step="0.01" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
          </label>
          <label className="text-[11px] text-zinc-400 space-y-1">Max uses (blank = unlimited)
            <input className={input} type="number" min="1" step="1" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} />
          </label>
          <label className="text-[11px] text-zinc-400 space-y-1">Valid until (optional)
            <input className={input} type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
          </label>
          <label className="text-[11px] text-zinc-400 space-y-1 sm:col-span-2">Note (optional)
            <input className={input} value={form.note} maxLength={200} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Newsletter signup" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg bg-[#E50D7E] hover:bg-[#d00b72] disabled:opacity-50 text-white font-display font-black text-xs uppercase flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Create
            </button>
          </div>
        </form>
        {formError && (
          <p role="alert" className="mt-3 text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={14} /> {formError}</p>
        )}
      </section>

      <section aria-labelledby="list" className="space-y-2">
        <h2 id="list" className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-wider">All vouchers</h2>
        {status === "loading" && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-[#1A1A1E] animate-pulse" />)}
        {status === "error" && (
          <div className="rounded-xl border border-red-900/60 bg-[#1A1A1E] p-4 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle size={16} className="text-red-500" /> Could not load vouchers.</span>
            <button onClick={() => void load()} className="px-3 py-1.5 rounded-lg bg-[#E50D7E] text-xs font-bold uppercase">Try again</button>
          </div>
        )}
        {status === "ready" && vouchers.length === 0 && <p className="text-xs text-zinc-500">No vouchers yet.</p>}
        {status === "ready" &&
          vouchers.map((v) => (
            <div key={v.id} className={`rounded-xl bg-[#1A1A1E] border border-[#27272A] px-4 py-3 flex items-center justify-between gap-3 ${v.isActive ? "" : "opacity-50"}`}>
              <div className="min-w-0">
                <p className="font-mono font-black text-sm flex items-center gap-2">
                  {v.kind === "GIFT_CARD" ? <Gift size={14} className="text-[#00FCED]" /> : v.kind === "PERCENT" ? <Percent size={14} className="text-[#E5A93C]" /> : <Euro size={14} className="text-[#E5A93C]" />}
                  {v.code}
                  <span className="text-[10px] text-zinc-500 font-bold">{KIND_LABEL[v.kind]}</span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {describe(v)} · used {v.redemptions}{v.maxRedemptions ? ` / ${v.maxRedemptions}` : ""}
                  {v.minSubtotal > 0 ? ` · min ${formatEuro(v.minSubtotal)}` : ""}
                  {v.validUntil ? ` · until ${new Date(v.validUntil).toLocaleDateString("en-GB")}` : ""}
                  {v.note ? ` · ${v.note}` : ""}
                </p>
              </div>
              <button
                onClick={() => void toggle(v)}
                aria-label={v.isActive ? `Switch off ${v.code}` : `Switch on ${v.code}`}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${v.isActive ? "border-emerald-800 text-[#10B981]" : "border-[#3A3A3E] text-zinc-400"}`}
              >
                <Power size={12} /> {v.isActive ? "ON" : "OFF"}
              </button>
            </div>
          ))}
      </section>
    </div>
  );
}

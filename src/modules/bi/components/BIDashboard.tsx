"use client";

import React, { useState, useEffect } from "react";
import { formatVatPercent } from "@/lib/tax";
import { formatEuro } from "@/lib/i18n";
import { CrossStoreReport } from "../bi.schema";
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Clock,
  Store,
  RefreshCw,
  Layers,
  Percent,
} from "lucide-react";

export const BIDashboard: React.FC = () => {
  const [report, setReport] = useState<CrossStoreReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBI = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error("[BIDashboard] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBI();
  }, []);

  return (
    <div className="space-y-6 font-sans text-[#171719]">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white border border-[#DFDFE3] p-4 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#E50D7E]" />
            <h2 className="font-display font-black text-lg text-zinc-900 uppercase tracking-tight">
              EXECUTIVE BUSINESS INTELLIGENCE & CROSS-STORE CORE (M8 / M9)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            VAT fiscal audit • Card vs Cash split • Speed of service analytics
          </p>
        </div>

        <button
          onClick={fetchBI}
          className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {report && (
        <>
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DFDFE3] rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                Total Gross Revenue
              </span>
              <span className="font-mono font-black text-2xl text-[#E50D7E] block mt-1">
                {formatEuro(report.totalGrossEUR)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                Net: {formatEuro(report.totalNetEUR)}
              </span>
            </div>

            <div className="bg-white border border-[#DFDFE3] rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                VAT ({formatVatPercent()})
              </span>
              <span className="font-mono font-black text-2xl text-cyan-700 block mt-1">
                {formatEuro(report.totalVatEUR)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                Statutory CY Inland Revenue
              </span>
            </div>

            <div className="bg-white border border-[#DFDFE3] rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                Total Orders Placed
              </span>
              <span className="font-mono font-black text-2xl text-zinc-900 block mt-1">
                {report.totalOrders}
              </span>
              <span className="text-[10px] text-amber-700 font-mono mt-0.5 block">
                Avg Ticket: {formatEuro(report.totalOrders > 0 ? report.totalGrossEUR / report.totalOrders : 0)}
              </span>
            </div>

            <div className="bg-white border border-[#DFDFE3] rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                Speed of Service (Avg)
              </span>
              <span className="font-mono font-black text-2xl text-emerald-700 block mt-1">
                ~{report.overallAvgTurnaroundMinutes}m
              </span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                Ticket to Ready
              </span>
            </div>
          </div>

          {/* Cross-Store Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.stores.map((store) => (
              <div
                key={store.locationSlug}
                className="bg-white border border-[#DFDFE3] rounded-3xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#DFDFE3] pb-3">
                  <div className="flex items-center gap-2">
                    <Store size={18} className="text-[#E50D7E]" />
                    <h3 className="font-display font-black text-base text-zinc-900 uppercase">
                      {store.storeName}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-cyan-700 font-bold">
                    {store.orderCount} Orders
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block">Gross Sales</span>
                    <span className="font-black text-base text-zinc-900">
                      {formatEuro(store.grossRevenueEUR)}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block">{formatVatPercent()} VAT Collected</span>
                    <span className="font-black text-base text-cyan-700">
                      {formatEuro(store.vatAmountEUR)}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Link4Pay Card/NFC</span>
                      <span className="font-black text-zinc-900">
                        {formatEuro(store.cardRevenueEUR)}
                      </span>
                    </div>
                    <CreditCard size={16} className="text-cyan-700" />
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Cash Tendered</span>
                      <span className="font-black text-zinc-900">
                        {formatEuro(store.cashRevenueEUR)}
                      </span>
                    </div>
                    <Banknote size={16} className="text-emerald-700" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#DFDFE3] text-zinc-500">
                  <span>Speed of Service Turnaround:</span>
                  <span className="text-emerald-700 font-bold">
                    ~{store.avgSpeedOfServiceMinutes} mins/ticket
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

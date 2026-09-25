"use client";

import React, { useState, useEffect } from "react";
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
    <div className="space-y-6 font-sans text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-[#1F1F21] border border-[#3A3A3E] p-4 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#00FCED]" />
            <h2 className="font-display font-black text-lg uppercase tracking-tight">
              EXECUTIVE BUSINESS INTELLIGENCE & CROSS-STORE CORE (M8 / M9)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cyprus 19% VAT fiscal audit • Card vs Cash split • Speed of service analytics
          </p>
        </div>

        <button
          onClick={fetchBI}
          className="p-2 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-zinc-400 hover:text-white"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {report && (
        <>
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl p-4 shadow">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                Total Gross Revenue
              </span>
              <span className="font-mono font-black text-2xl text-[#E50D7E] block mt-1">
                {formatEuro(report.totalGrossEUR)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                Net: {formatEuro(report.totalNetEUR)}
              </span>
            </div>

            <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl p-4 shadow">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                Cyprus VAT (19%)
              </span>
              <span className="font-mono font-black text-2xl text-[#00FCED] block mt-1">
                {formatEuro(report.totalVatEUR)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                Statutory CY Inland Revenue
              </span>
            </div>

            <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl p-4 shadow">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                Total Orders Placed
              </span>
              <span className="font-mono font-black text-2xl text-white block mt-1">
                {report.totalOrders}
              </span>
              <span className="text-[10px] text-[#E5A93C] font-mono mt-0.5 block">
                Avg Ticket: {formatEuro(report.totalOrders > 0 ? report.totalGrossEUR / report.totalOrders : 0)}
              </span>
            </div>

            <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl p-4 shadow">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
                Speed of Service (Avg)
              </span>
              <span className="font-mono font-black text-2xl text-[#10B981] block mt-1">
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
                className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-3">
                  <div className="flex items-center gap-2">
                    <Store size={18} className="text-[#E5A93C]" />
                    <h3 className="font-display font-black text-base uppercase">
                      {store.storeName}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[#00FCED] font-bold">
                    {store.orderCount} Orders
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#2B2B2E] rounded-xl border border-[#3A3A3E]">
                    <span className="text-[10px] text-zinc-400 block">Gross Sales</span>
                    <span className="font-black text-base text-white">
                      {formatEuro(store.grossRevenueEUR)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#2B2B2E] rounded-xl border border-[#3A3A3E]">
                    <span className="text-[10px] text-zinc-400 block">19% VAT Collected</span>
                    <span className="font-black text-base text-[#00FCED]">
                      {formatEuro(store.vatAmountEUR)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#2B2B2E] rounded-xl border border-[#3A3A3E] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Link4Pay Card/NFC</span>
                      <span className="font-black text-white">
                        {formatEuro(store.cardRevenueEUR)}
                      </span>
                    </div>
                    <CreditCard size={16} className="text-[#00FCED]" />
                  </div>

                  <div className="p-3 bg-[#2B2B2E] rounded-xl border border-[#3A3A3E] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Cash Tendered</span>
                      <span className="font-black text-white">
                        {formatEuro(store.cashRevenueEUR)}
                      </span>
                    </div>
                    <Banknote size={16} className="text-[#10B981]" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#3A3A3E] text-zinc-400">
                  <span>Speed of Service Turnaround:</span>
                  <span className="text-[#10B981] font-bold">
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

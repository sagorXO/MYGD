"use client";

import React from "react";
import { formatEuro } from "@/lib/i18n";
import type { SignageItem } from "../signage.schema";

interface Group {
  readonly heading: string;
  readonly note?: string;
  readonly items: readonly SignageItem[];
}

/** Items arrive in menu order; consecutive items with the same section form one group. */
export function groupBySection(items: readonly SignageItem[]): Group[] {
  const groups: { heading: string; note?: string; items: SignageItem[] }[] = [];
  for (const item of items) {
    const heading = item.section ?? "";
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(item);
    else groups.push({ heading, note: item.sectionNote, items: [item] });
  }
  return groups;
}

/**
 * Price board drawn from live data, so a price change or a sold-out toggle shows on the screen at once.
 * (The old poster images had prices baked in and went stale.)
 */
export const LivePriceBoard: React.FC<{ items: readonly SignageItem[]; banner?: string }> = ({ items, banner }) => {
  const groups = groupBySection(items);
  return (
    <div className="w-full h-full overflow-hidden flex flex-col gap-3 py-5 px-14 bg-[#0B0B0C]">
      {banner && (
        <div className="shrink-0 text-center font-mono font-black text-sm tracking-widest uppercase text-[#00FCED] border border-[#00FCED]/30 rounded-xl py-1.5">
          {banner}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
        {groups.map((group) => (
          <section key={group.heading} className="break-inside-avoid mb-5">
            <h2 className="font-display font-black text-[clamp(1.1rem,2vw,1.9rem)] uppercase tracking-tight text-[#E50D7E] leading-none">
              {group.heading}
            </h2>
            {group.note && (
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#E5A93C] mt-1">{group.note}</p>
            )}
            <ul className="mt-2 space-y-1.5 border-t border-[#2B2B2E] pt-2">
              {group.items.map((item) => (
                <li key={item.id} className={item.isAvailable ? "" : "opacity-40"}>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-display font-bold text-[clamp(0.95rem,1.4vw,1.35rem)] text-white uppercase ${item.isAvailable ? "" : "line-through"}`}>
                      {item.name}
                    </span>
                    <span className="flex-1 border-b border-dotted border-zinc-600 translate-y-[-3px]" aria-hidden />
                    {item.isAvailable ? (
                      <span className="font-mono font-black text-[clamp(0.95rem,1.4vw,1.35rem)] text-[#00FCED]">{formatEuro(item.priceEUR)}</span>
                    ) : (
                      <span className="font-mono font-black text-xs text-red-400 uppercase">Sold out</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[clamp(0.7rem,0.95vw,0.9rem)] text-zinc-400 leading-snug">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        </div>
      </div>
    </div>
  );
};

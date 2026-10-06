"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { formatEuro } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { generateVectorPlaceholder } from "@/lib/menu-assets";
import { CANONICAL_4K_SCREENS } from "../signage.engine";
import { LivePriceBoard } from "./LivePriceBoard";
import { toSignageItem } from "@/lib/menu/boards";
import { MYGD_MODIFIER_GROUPS } from "@/lib/menu/mygd-menu";
import { SignageScreenConfig } from "../signage.schema";

// TV menu board. The stage is a fixed 1920x1080 canvas scaled to fit any display.
// TV mode shows no operator chrome: controls appear on pointer move or key press and fade after 4s.

const SCREEN_COUNT = 7;
const CYCLE_MS = 12000;
const CONTROLS_MS = 4000;
const STAGE_W = 1920;
const STAGE_H = 1080;

const ctlBtn =
  "h-14 rounded-md border-2 border-border bg-surface px-5 font-display text-xl font-semibold uppercase tracking-wide text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const MENU_PRICES = (MYGD_MODIFIER_GROUPS.find((g) => g.slug === "make-it-a-menu")?.options ?? [])
  .map((o) => `${o.name.replace(" Menu", "")} +€${o.price.toFixed(2)}`)
  .join(" · ");

export const MenuBoard4K: React.FC = () => {
  const [screenNo, setScreenNo] = useState(1);
  // Starts from the offline fallback (derived from the menu source) and is replaced by the
  // database screens from GET /api/menuboards as soon as they load; SSE keeps it live afterwards.
  const [configs, setConfigs] = useState<Record<number, SignageScreenConfig>>(CANONICAL_4K_SCREENS);
  const [viewMode, setViewMode] = useState<"GRID" | "GRAPHIC">("GRID");
  const [auto, setAuto] = useState(true);
  const [controls, setControls] = useState(false);
  const [time, setTime] = useState("");
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleStart = useRef(0);

  const cfg = configs[screenNo] || configs[1];
  const soldOut = cfg.items.filter((i) => !i.isAvailable).length;

  const go = useCallback((delta: number) => {
    setScreenNo((n) => ((n - 1 + delta + SCREEN_COUNT) % SCREEN_COUNT) + 1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const reveal = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), CONTROLS_MS);
  }, []);

  const applyRemoteScreen = useCallback((raw: any) => {
    const screenNumber = Number(raw?.screenNumber);
    if (!Number.isInteger(screenNumber) || !Array.isArray(raw?.items)) return;
    setConfigs((prev) => ({
      ...prev,
      [screenNumber]: {
        ...(prev[screenNumber] ?? CANONICAL_4K_SCREENS[screenNumber]),
        screenNumber,
        title: raw.title ?? prev[screenNumber]?.title ?? `SCREEN ${screenNumber}`,
        layoutType: raw.layoutType ?? prev[screenNumber]?.layoutType ?? "PRICE_MATRIX",
        updatedAt: new Date().toISOString(),
        items: raw.items.map(toSignageItem),
      },
    }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/menuboards", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        for (const screen of data.configs ?? []) applyRemoteScreen(screen);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[MenuBoard4K] Could not load screens from the database; showing the offline copy.", err);
        }
      }
    })();
    return () => controller.abort();
  }, [applyRemoteScreen]);


  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "boards",
    onEvent: (type, data: any) => {
      if (type === "MENU_BOARD_UPDATED" && data?.config) {
        applyRemoteScreen(data.config);
      } else if (type === "STOCK_CHANGED" && data?.productId) {
        setConfigs((prev) => {
          const next: Record<number, SignageScreenConfig> = {};
          for (const key of Object.keys(prev)) {
            const n = Number(key);
            next[n] = {
              ...prev[n],
              items: prev[n].items.map((item) =>
                item.id === data.productId || item.sku === data.sku ? { ...item, isAvailable: data.isAvailable } : item,
              ),
            };
          }
          return next;
        });
      }
    },
  });

  // Fit the 1920x1080 stage to the display.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Clock in store time.
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Nicosia" }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-cycle with a progress line. Restarts whenever the screen changes.
  useEffect(() => {
    cycleStart.current = performance.now();
    setProgress(0);
    if (!auto) return;
    const id = setInterval(() => {
      const p = (performance.now() - cycleStart.current) / CYCLE_MS;
      if (p >= 1) go(1);
      else setProgress(p);
    }, 100);
    return () => clearInterval(id);
  }, [auto, screenNo, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      reveal();
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "a" || e.key === "A") setAuto((v) => !v);
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "v" || e.key === "V") setViewMode((m) => (m === "GRID" ? "GRAPHIC" : "GRID"));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", reveal);
    window.addEventListener("touchstart", reveal);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("touchstart", reveal);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [go, reveal, toggleFullscreen]);

  const link = connectionTier === "EDGE" ? "LAN edge" : isConnected ? "Live" : "Offline";

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-canvas text-text select-none">
      <div
        className="relative grid shrink-0 grid-rows-[84px_1fr_108px] overflow-hidden bg-canvas"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
      >
        <header className="flex items-center gap-6 border-b-2 border-border px-14">
          <div className="font-display text-[40px] font-bold uppercase leading-none tracking-wide">
            My German <span className="text-accent-text">Döner</span>
          </div>
          <div className="font-display text-[26px] font-medium uppercase leading-none tracking-[0.12em] text-warning">
            Screen {cfg.screenNumber} of {SCREEN_COUNT}
          </div>
          <div className="ml-auto flex items-center gap-7 tabular-nums">
            <div className={cn("flex items-center gap-2.5 text-[22px] font-semibold", isConnected ? "text-success" : "text-warning")}>
              <span aria-hidden className="h-3 w-3 rounded-full bg-current" />
              {link}
            </div>
            <div className="font-display text-[40px] font-semibold leading-none tracking-wider">{time || "--:--:--"}</div>
          </div>
        </header>

        <main className="grid min-h-0 grid-rows-[auto_1fr] gap-6 px-14 pb-5 pt-9">
          <div>
            <h1 className="font-display text-[72px] font-bold uppercase leading-none">{cfg.title}</h1>
            {cfg.subtitle && (
              <p className="mt-2 font-display text-[26px] font-medium uppercase leading-none tracking-[0.14em] text-accent-text">
                {cfg.subtitle}
              </p>
            )}
          </div>

          {viewMode === "GRAPHIC" ? (
            <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-canvas">
              <LivePriceBoard items={cfg.items} banner={cfg.bannerMessage} />
              {soldOut > 0 && (
                <div className="absolute right-4 top-4 rounded-pill bg-danger-subtle px-5 py-2 font-display text-2xl font-semibold uppercase tracking-wide text-danger">
                  {soldOut} sold out
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-0 auto-rows-fr grid-cols-3 gap-6">
              {cfg.items.slice(0, 9).map((item) => (
                <article
                  key={item.id}
                  className="relative grid grid-cols-[230px_1fr] overflow-hidden rounded-xl border-2 border-border bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || generateVectorPlaceholder(item.name, "MYGD MENU")}
                    alt=""
                    className={cn("h-full w-full object-cover", !item.isAvailable && "opacity-35 grayscale")}
                    onError={(e) => {
                      e.currentTarget.src = generateVectorPlaceholder(item.name, "MYGD MENU");
                    }}
                  />
                  {item.badge && (
                    <span className="absolute left-3.5 top-3.5 h-[34px] rounded-pill bg-accent px-3.5 font-display text-lg font-semibold uppercase leading-[34px] tracking-wider text-on-accent">
                      {item.badge.replace("_", " ")}
                    </span>
                  )}
                  <div className={cn("grid min-w-0 content-between gap-2 px-6 py-5", !item.isAvailable && "opacity-55")}>
                    <div>
                      <h2 className="font-display text-4xl font-bold uppercase leading-[1.05]">{item.name}</h2>
                      {item.description && (
                        <p className="mt-1.5 line-clamp-3 text-xl leading-snug text-text-secondary">{item.description}</p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex items-baseline gap-4 font-display text-[54px] font-bold leading-none tabular-nums",
                        !item.isAvailable && "line-through decoration-4",
                      )}
                    >
                      {formatEuro(item.priceEUR)}
                      {item.largePriceEUR && (
                        <span className="font-body text-[22px] font-medium text-text-secondary">
                          Large {formatEuro(item.largePriceEUR)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!item.isAvailable && (
                    <span className="absolute right-5 top-4 rounded-pill bg-danger-subtle px-4 py-2 font-display text-2xl font-semibold uppercase leading-none tracking-wide text-danger">
                      Sold out · Ausverkauft
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>

        <footer className="flex items-center gap-8 border-t-2 border-border bg-surface px-14">
          <div>
            <h3 className="font-display text-[40px] font-bold uppercase leading-none">Make it a menu</h3>
            <p className="mt-1 text-[22px] text-text-secondary">Fries or rice + 0.4L drink · {MENU_PRICES}</p>
          </div>
          <div className="ml-auto text-right font-display text-2xl font-medium uppercase leading-tight tracking-[0.1em] text-warning">
            Emba · Paphos
            <br />
            Limassol
          </div>
        </footer>

        {/* Cycle progress and screen dots */}
        <div aria-hidden className="absolute inset-x-0 bottom-[108px] h-1.5 bg-border">
          <div className="h-full bg-accent" style={{ width: auto ? `${progress * 100}%` : 0 }} />
        </div>
        <div aria-hidden className="absolute bottom-[124px] right-14 flex gap-2.5">
          {Array.from({ length: SCREEN_COUNT }, (_, i) => (
            <span key={i} className={cn("h-4 w-4 rounded-full", i + 1 === screenNo ? "bg-accent" : "bg-border")} />
          ))}
        </div>

        {/* Operator controls: hidden until the pointer moves or a key is pressed */}
        <div
          role="toolbar"
          aria-label="Board controls"
          className={cn(
            "absolute left-1/2 top-24 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border-2 border-border bg-canvas p-2.5 transition-opacity duration-300",
            controls ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <button type="button" className={ctlBtn} aria-label="Previous screen" onClick={() => go(-1)}>
            ←
          </button>
          <span className="px-3 font-display text-xl font-semibold tabular-nums">
            {screenNo} / {SCREEN_COUNT}
          </span>
          <button type="button" className={ctlBtn} aria-label="Next screen" onClick={() => go(1)}>
            →
          </button>
          <button type="button" className={cn(ctlBtn, auto && "border-accent bg-accent text-on-accent hover:bg-accent-hover")} aria-pressed={auto} onClick={() => setAuto((v) => !v)}>
            Auto-cycle
          </button>
          <button type="button" className={ctlBtn} onClick={() => setViewMode((m) => (m === "GRID" ? "GRAPHIC" : "GRID"))}>
            {viewMode === "GRID" ? "Official board" : "Digital grid"}
          </button>
          <button type="button" className={ctlBtn} onClick={toggleFullscreen}>
            Fullscreen
          </button>
        </div>
        <p className={cn("absolute bottom-[124px] left-14 text-xl text-text-secondary transition-opacity duration-300", controls ? "opacity-100" : "opacity-0")}>
          ← → switch · A auto-cycle · V view · F fullscreen
        </p>
      </div>
    </div>
  );
};

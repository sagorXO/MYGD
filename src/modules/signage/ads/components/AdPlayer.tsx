"use client";
// MY GERMAN DÖNER — Screen player (portrait 1080 × 1920 or landscape 1920 × 1080 stage, chrome-free).
// [ADR] Context: screens must keep playing through network loss and come back on their own.
// Decision: the screen receives the whole schedule and decides locally (playlist.ts); the feed is
// kept in localStorage and media in a service worker cache; SSE pushes changes, a 60 s poll is the backstop.
// Consequence: a screen offline for days keeps a correct schedule from its last feed.

import { useCallback, useEffect, useRef, useState } from "react";
import { defaultOrientation, FeedResponseSchema, ScreenFeedSchema } from "../ads.schema";
import { playableItems, type ScreenFeed } from "../feed";
import { afterPlaybackFailure, itemDurationMs, nextItem } from "../playlist";
import { AdSlate } from "./AdSlate";

const REFRESH_MS = 60_000;
const FADE_MS = 400;
const VIDEO_STALL_MS = 5_000;
const VIDEO_LOAD_GRACE_MS = 60_000; // first play of a new file waits for the whole download
const EMPTY_RECHECK_MS = 30_000;
const BAD_ITEM_SKIP_MS = 1_000;
const STAGE = {
  PORTRAIT: { aspectRatio: "9 / 16", height: "min(100vh, calc(100vw * 16 / 9))" },
  LANDSCAPE: { aspectRatio: "16 / 9", height: "min(100vh, calc(100vw * 9 / 16))" },
} as const;
const WATCHDOG_MS = 10 * 60_000; // no new item for this long → reload the page

type Playable = ReturnType<typeof playableItems>[number];

function cacheKey(screen: number) {
  return `mygd.ads.feed.${screen}`;
}

function readCachedFeed(screen: number): ScreenFeed | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(screen));
    if (!raw) return null;
    const parsed = ScreenFeedSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.screenNumber === screen ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCachedFeed(screen: number, feed: ScreenFeed) {
  try {
    window.localStorage.setItem(cacheKey(screen), JSON.stringify(feed));
  } catch {
    // Storage full or blocked: the service worker cache still covers the feed.
  }
}

function tellServiceWorkerWhatToKeep(feed: ScreenFeed) {
  const urls = feed.items.map((i) => i.mediaUrl);
  navigator.serviceWorker?.controller?.postMessage({ type: "KEEP_MEDIA", urls });
  // Warm the cache one file at a time so a screen holds every file before it goes offline.
  urls.reduce<Promise<unknown>>((chain, url) => chain.then(() => fetch(url).catch(() => undefined)), Promise.resolve());
}

function durationOf(item: Playable): number | null {
  try {
    return itemDurationMs(item);
  } catch {
    return null;
  }
}

export function AdPlayer({ screen }: { screen: number }) {
  const [feed, setFeed] = useState<ScreenFeed | null>(null);
  const [current, setCurrent] = useState<Playable | null>(null);
  const [previous, setPrevious] = useState<Playable | null>(null);
  const [playToken, setPlayToken] = useState(0); // bumps on every advance, even to the same item
  const feedRef = useRef<ScreenFeed | null>(null);
  const currentRef = useRef<Playable | null>(null);
  const lastAdvanceRef = useRef(Date.now());
  const lastProgressRef = useRef(Date.now());
  const startedRef = useRef(false); // the current item has actually begun showing
  const failuresRef = useRef(0); // items that failed in a row
  const skipTimerRef = useRef<number | null>(null);

  feedRef.current = feed;
  currentRef.current = current;

  const clearSkipTimer = () => {
    if (skipTimerRef.current !== null) window.clearTimeout(skipTimerRef.current);
    skipTimerRef.current = null;
  };

  const advance = useCallback(() => {
    clearSkipTimer();
    startedRef.current = false;
    const f = feedRef.current;
    const list = f ? playableItems(f, new Date()) : [];
    const next = nextItem(list, currentRef.current?.id ?? null);
    lastAdvanceRef.current = Date.now();
    lastProgressRef.current = Date.now();
    setPrevious(currentRef.current);
    setCurrent(next);
    setPlayToken((t) => t + 1);
  }, []);

  // Media that will not load must never become a hot loop: wait, then try the next item. When the
  // whole list has failed in a row, show the slate; the empty-screen timer below tries again later.
  const fail = useCallback(() => {
    if (skipTimerRef.current !== null) return;
    failuresRef.current += 1;
    const f = feedRef.current;
    const count = f ? playableItems(f, new Date()).length : 0;
    if (afterPlaybackFailure(failuresRef.current, count) === "REST") {
      failuresRef.current = 0;
      lastAdvanceRef.current = Date.now();
      setPrevious(null);
      setCurrent(null);
      setPlayToken((t) => t + 1);
      return;
    }
    skipTimerRef.current = window.setTimeout(advance, BAD_ITEM_SKIP_MS);
  }, [advance]);

  const started = useCallback(() => {
    startedRef.current = true;
    failuresRef.current = 0;
    lastProgressRef.current = Date.now();
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/signage/ads/${screen}`, { cache: "no-store" });
      if (!res.ok) return;
      const parsed = FeedResponseSchema.safeParse(await res.json());
      if (!parsed.success) return;
      setFeed(parsed.data.feed);
      writeCachedFeed(screen, parsed.data.feed);
      tellServiceWorkerWhatToKeep(parsed.data.feed);
    } catch {
      // Offline: keep playing the cached feed.
    }
  }, [screen]);

  // Start: cached feed first (instant, works offline), then the network.
  useEffect(() => {
    const cached = readCachedFeed(screen);
    if (cached) setFeed(cached);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/signage/sw.js", { scope: "/signage/" }).catch(() => undefined);
    }
    void load();
    const poll = window.setInterval(() => void load(), REFRESH_MS);
    const events = new EventSource("/api/events?channel=signage");
    events.addEventListener("ADS_UPDATED", () => void load());
    window.addEventListener("online", load);
    return () => {
      window.clearInterval(poll);
      events.close();
      window.removeEventListener("online", load);
    };
  }, [screen, load]);

  // A new feed: start playing, or move on if the current item was removed or is no longer scheduled.
  useEffect(() => {
    if (!feed) return;
    const list = playableItems(feed, new Date());
    const cur = currentRef.current;
    if (!cur || !list.some((i) => i.id === cur.id)) advance();
  }, [feed, advance]);

  // Timed items (images, or videos with a set duration). Nothing to play: look again later.
  useEffect(() => {
    if (!current) {
      const t = window.setTimeout(advance, EMPTY_RECHECK_MS);
      return () => window.clearTimeout(t);
    }
    const ms = durationOf(current);
    if (current.mediaType === "VIDEO" && current.durationSeconds === null && ms !== null) return; // video ends itself
    const t = window.setTimeout(advance, ms ?? BAD_ITEM_SKIP_MS);
    return () => window.clearTimeout(t);
  }, [current, playToken, advance]);

  // Fade out the previous item, then drop it.
  useEffect(() => {
    if (!previous) return;
    const t = window.setTimeout(() => setPrevious(null), FADE_MS);
    return () => window.clearTimeout(t);
  }, [previous, playToken]);

  // Stalled video → skip it. Player stuck for any reason → reload the whole page.
  useEffect(() => {
    const t = window.setInterval(() => {
      const cur = currentRef.current;
      const limit = startedRef.current ? VIDEO_STALL_MS : VIDEO_LOAD_GRACE_MS;
      if (cur?.mediaType === "VIDEO" && Date.now() - lastProgressRef.current > limit) fail();
      if (Date.now() - lastAdvanceRef.current > WATCHDOG_MS) window.location.reload();
    }, 1_000);
    return () => {
      window.clearInterval(t);
      clearSkipTimer();
    };
  }, [fail]);

  const status = feed?.status ?? "UNASSIGNED";
  const slateNote = feed && status === "UNASSIGNED" ? `Screen ${screen}\nnot linked to a playlist` : undefined;

  return (
    <div className="fixed inset-0 flex cursor-none items-center justify-center overflow-hidden bg-black" aria-hidden="true">
      <div
        className="relative overflow-hidden bg-[var(--mygd-neutral-950)] [container-type:size]"
        style={STAGE[feed?.orientation ?? defaultOrientation(screen)]}
      >
        {previous ? <Layer key={`prev-${previous.id}-${playToken}`} item={previous} fading /> : null}
        {current ? (
          <Layer
            key={`cur-${current.id}-${playToken}`}
            item={current}
            onEnded={advance}
            onFailed={fail}
            onStarted={started}
            onProgress={() => {
              lastProgressRef.current = Date.now();
            }}
          />
        ) : (
          <AdSlate note={slateNote} />
        )}
      </div>
    </div>
  );
}

interface LayerProps {
  item: Playable;
  fading?: boolean;
  onEnded?: () => void;
  onFailed?: () => void;
  onStarted?: () => void;
  onProgress?: () => void;
}

function Layer({ item, fading = false, onEnded, onFailed, onStarted, onProgress }: LayerProps) {
  const style = { animation: `${fading ? "mygd-ad-out" : "mygd-ad-in"} ${FADE_MS}ms ease forwards` };
  return (
    <div className="absolute inset-0" style={style}>
      <style>{"@keyframes mygd-ad-in{from{opacity:0}to{opacity:1}}@keyframes mygd-ad-out{from{opacity:1}to{opacity:0}}"}</style>
      {item.mediaType === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element -- full-bleed signage, served from our own cache
        <img src={item.mediaUrl} alt="" className="h-full w-full object-contain" onLoad={fading ? undefined : onStarted} onError={fading ? undefined : onFailed} />
      ) : (
        <video
          src={item.mediaUrl}
          className="h-full w-full object-contain"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={fading ? undefined : onEnded}
          onError={fading ? undefined : onFailed}
          onTimeUpdate={fading ? undefined : onProgress}
          onPlaying={fading ? undefined : onStarted}
        />
      )}
    </div>
  );
}

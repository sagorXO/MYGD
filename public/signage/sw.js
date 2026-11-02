// MY GERMAN DÖNER — Portrait-screen service worker (scope /signage/).
// Keeps the player working offline: the page and its scripts, the latest feed, and every media file.
// Media is cached whole and Range requests are answered from the cache, so video still plays offline.
const VERSION = "v1";
const SHELL_CACHE = `mygd-signage-shell-${VERSION}`;
const FEED_CACHE = `mygd-signage-feed-${VERSION}`;
const MEDIA_CACHE = `mygd-signage-media-${VERSION}`;
const KEEP = new Set([SHELL_CACHE, FEED_CACHE, MEDIA_CACHE]);

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("mygd-signage-") && !KEEP.has(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

// The player says which media the current feed uses; anything else is removed to bound storage.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "KEEP_MEDIA" || !Array.isArray(data.urls)) return;
  const keep = new Set(data.urls.map((u) => new URL(u, self.location.origin).pathname));
  event.waitUntil(
    (async () => {
      const cache = await caches.open(MEDIA_CACHE);
      for (const req of await cache.keys()) {
        if (!keep.has(new URL(req.url).pathname)) await cache.delete(req);
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/signage/media/")) {
    event.respondWith(media(req, url));
  } else if (url.pathname.startsWith("/api/signage/ads/")) {
    event.respondWith(networkFirst(req, FEED_CACHE));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
  } else if (req.mode === "navigate" && url.pathname.startsWith("/signage/")) {
    event.respondWith(networkFirst(req, SHELL_CACHE));
  }
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    return cached || new Response(JSON.stringify({ success: false, error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function media(req, url) {
  const cache = await caches.open(MEDIA_CACHE);
  const key = url.pathname;
  let full = await cache.match(key);
  if (!full) {
    try {
      full = await fetch(key); // whole file, no Range, so it can be cached
    } catch {
      return new Response(null, { status: 504 });
    }
    if (full.status !== 200) return full;
    try {
      await cache.put(key, full.clone());
    } catch {
      // Storage full: still play this file from the network.
    }
  }
  const range = req.headers.get("range");
  if (!range) return full;
  return partial(full, range);
}

async function partial(full, header) {
  const blob = await full.blob();
  const size = blob.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return new Response(blob, { status: 200, headers: full.headers });
  let start;
  let end;
  if (m[1] === "") {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const headers = new Headers(full.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(blob.slice(start, end + 1), { status: 206, headers });
}

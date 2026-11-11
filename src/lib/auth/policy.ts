// Route access policy: which role each page and API route needs.
// Deny by default: anything not listed as PUBLIC needs at least a staff session.
import type { Role } from "./roles";

export type Access = "PUBLIC" | Role;

const PUBLIC_PAGES = new Set(["/", "/login"]);
const PUBLIC_GET_APIS = new Set(["/api/health"]);
// The ad screens listen for "playlist changed" on this channel.
const PUBLIC_SSE_CHANNELS = new Set(["signage"]);
// Ad screens: the player page, its service worker, its feed and its media files (read-only).
const PUBLIC_SIGNAGE_PAGES = "/signage";
const PUBLIC_SIGNAGE_GET_PREFIXES = ["/api/signage/ads", "/api/signage/media"];

function normalise(pathname: string): string {
  // Resolve "..", "//" and percent-encoding the same way the router does, then drop a trailing slash.
  const resolved = new URL(pathname, "http://local").pathname;
  return resolved.length > 1 && resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
}

function within(path: string, base: string): boolean {
  return path === base || path.startsWith(`${base}/`);
}

export function requiredRole(pathname: string, method: string, searchParams: URLSearchParams = new URLSearchParams()): Access {
  const path = normalise(pathname);
  const verb = method.toUpperCase() === "HEAD" ? "GET" : method.toUpperCase();

  if (PUBLIC_PAGES.has(path)) return "PUBLIC";
  if (path === "/api/auth/login" && verb === "POST") return "PUBLIC";
  if (verb === "GET" && PUBLIC_GET_APIS.has(path)) return "PUBLIC";
  if (verb === "GET" && within(path, PUBLIC_SIGNAGE_PAGES)) return "PUBLIC";
  if (verb === "GET" && PUBLIC_SIGNAGE_GET_PREFIXES.some((base) => within(path, base))) return "PUBLIC";
  if (path === "/api/events" && verb === "GET" && PUBLIC_SSE_CHANNELS.has(searchParams.get("channel") ?? "")) {
    return "PUBLIC";
  }

  if (within(path, "/admin") || within(path, "/api/admin")) return "STORE_MANAGER";

  return "STORE_STAFF";
}

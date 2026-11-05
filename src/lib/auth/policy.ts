// Route access policy: which role each page and API route needs.
// Deny by default: anything not listed as PUBLIC needs at least a staff session.
import type { Role } from "./roles";

export type Access = "PUBLIC" | Role;

const PUBLIC_PAGES = new Set(["/", "/order", "/display", "/boards", "/login"]);
// Read-only feeds used by the unattended guest screens (/display, /boards), the public site and the health check.
const PUBLIC_GET_APIS = new Set(["/api/menu", "/api/kds", "/api/menuboards", "/api/health"]);
const PUBLIC_SSE_CHANNELS = new Set(["display", "boards", "signage"]);
// Portrait ad screens: the player page, its service worker, its feed and its media files (read-only).
const PUBLIC_SIGNAGE_PAGES = "/signage";
const PUBLIC_SIGNAGE_GET_PREFIXES = ["/api/signage/ads", "/api/signage/media"];

// POS work is paused until the tax question is answered; its checkout is not fit for the internet yet
// (it trusts prices sent by the client). /order is a demo flow: online ordering comes from DM.
const POS_ROUTES = ["/pos", "/order", "/api/orders", "/api/pricing", "/api/terminal"];
const DEV_ROUTES = ["/dev"];

function normalise(pathname: string): string {
  // Resolve "..", "//" and percent-encoding the same way the router does, then drop a trailing slash.
  const resolved = new URL(pathname, "http://local").pathname;
  return resolved.length > 1 && resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
}

function within(path: string, base: string): boolean {
  return path === base || path.startsWith(`${base}/`);
}

/** Routes that do not exist on a production server (404, before any auth check). */
export function hiddenInProduction(pathname: string, env: Record<string, string | undefined>): boolean {
  if (env.NODE_ENV !== "production") return false;
  const path = normalise(pathname);
  if (DEV_ROUTES.some((base) => within(path, base))) return true;
  return env.POS_ENABLED !== "true" && POS_ROUTES.some((base) => within(path, base));
}

export function requiredRole(pathname: string, method: string, searchParams: URLSearchParams = new URLSearchParams()): Access {
  const path = normalise(pathname);
  const verb = method.toUpperCase() === "HEAD" ? "GET" : method.toUpperCase();

  if (PUBLIC_PAGES.has(path)) return "PUBLIC";
  if (within(path, "/dev")) return "PUBLIC"; // these pages return 404 in production themselves
  if (path === "/api/auth/login" && verb === "POST") return "PUBLIC";
  if (verb === "GET" && PUBLIC_GET_APIS.has(path)) return "PUBLIC";
  if (verb === "GET" && within(path, PUBLIC_SIGNAGE_PAGES)) return "PUBLIC";
  if (verb === "GET" && PUBLIC_SIGNAGE_GET_PREFIXES.some((base) => within(path, base))) return "PUBLIC";
  if (path === "/api/events" && verb === "GET" && PUBLIC_SSE_CHANNELS.has(searchParams.get("channel") ?? "")) {
    return "PUBLIC";
  }

  if (within(path, "/admin") || within(path, "/api/admin")) return "STORE_MANAGER";
  if (path === "/api/menuboards") return "STORE_MANAGER"; // non-GET (GET is public above)

  return "STORE_STAFF";
}

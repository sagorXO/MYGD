// Authentication gate for every page and API route (Phase 0.5).
// Deny by default; the route → role table lives in src/lib/auth/policy.ts.
// Fails closed: if SESSION_SECRET is missing or weak, protected routes are refused.
import { NextResponse, type NextRequest } from "next/server";
import { hiddenInProduction, requiredRole } from "@/lib/auth/policy";
import { hasRole } from "@/lib/auth/roles";
import { readSessionSecret, verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

function deny(req: NextRequest, status: 401 | 403 | 503, error: string) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ success: false, error }, { status });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", `${pathname}${search}`);
  if (status === 403) login.searchParams.set("denied", "1");
  if (status === 503) login.searchParams.set("config", "1");
  return NextResponse.redirect(login);
}

export async function middleware(req: NextRequest) {
  if (hiddenInProduction(req.nextUrl.pathname, process.env)) return new NextResponse(null, { status: 404 });

  const access = requiredRole(req.nextUrl.pathname, req.method, req.nextUrl.searchParams);
  if (access === "PUBLIC") return NextResponse.next();

  let secret: string;
  try {
    secret = readSessionSecret(process.env.SESSION_SECRET);
  } catch {
    console.error("[auth] SESSION_SECRET is missing or too weak; refusing protected routes.");
    return deny(req, 503, "Authentication is not configured on this server.");
  }

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, secret);
  if (!session) return deny(req, 401, "Authentication required.");
  if (!hasRole(session.role, access)) return deny(req, 403, "Not allowed for your role.");
  return NextResponse.next();
}

export const config = {
  // [ADR] Context: with runtime "nodejs", Next 15.5 loses multipart bodies larger than one network chunk
  // ("Response body object should not be disturbed"), found by testing the production image.
  // Decision: use the default Edge runtime; auth here only needs Web Crypto and process.env.
  // Consequence: nothing in this file may import Node-only modules.
  // Every API path, whatever it ends in (a ".png" suffix must never skip auth on a dynamic route),
  // and everything else except framework assets and static files.
  // [ADR] Context: Next copies a request body through middleware, 10 MB at most, which truncates video uploads.
  // Decision: the upload route alone skips middleware and checks the manager role itself first.
  // Consequence: anonymous requests cannot make the server buffer large bodies (tests/hosting-config).
  matcher: ["/api/((?!admin/ads/media$).*)", "/((?!api/|_next/static|_next/image|favicon.ico|assets/|.*\\.(?:png|jpe?g|svg|webp|gif|ico|txt|woff2?)$).*)"],
};

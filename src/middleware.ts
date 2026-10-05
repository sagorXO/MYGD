// Authentication gate for every page and API route (Phase 0.5).
// Deny by default; the route → role table lives in src/lib/auth/policy.ts.
// Fails closed: if SESSION_SECRET is missing or weak, protected routes are refused.
import { NextResponse, type NextRequest } from "next/server";
import { requiredRole } from "@/lib/auth/policy";
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
  // Node.js runtime: reads SESSION_SECRET at request time on the store server.
  runtime: "nodejs",
  // Everything except framework assets and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:png|jpe?g|svg|webp|gif|ico|txt|woff2?)$).*)"],
};

// Public health check for the container and the reverse proxy. Says only up or down, no details.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  } catch (err) {
    console.error("[health] database check failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}

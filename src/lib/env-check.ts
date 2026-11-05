// MY GERMAN DÖNER — Production settings check, run once at server start.
// Names what is wrong and never prints a value, so the message is safe in logs.
import { readSessionSecret } from "@/lib/auth/session";

type Env = Record<string, string | undefined>;

export function readProductionEnv(env: Env): string[] {
  if (env.NODE_ENV !== "production") return [];
  const problems: string[] = [];
  if (!env.DATABASE_URL?.trim()) problems.push("DATABASE_URL is not set.");
  if (!env.MEDIA_ROOT?.trim()) problems.push("MEDIA_ROOT is not set.");
  try {
    readSessionSecret(env.SESSION_SECRET);
  } catch {
    problems.push("SESSION_SECRET is missing or too weak (use: openssl rand -hex 32).");
  }
  return problems;
}

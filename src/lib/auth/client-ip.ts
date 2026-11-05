// The client's address for rate limits and audit logs.
// [ADR] Context: anyone can send their own X-Forwarded-For, so its first value is attacker-controlled.
// Decision: read the LAST value, the one our own reverse proxy added.
// Consequence: exactly one trusted proxy (Caddy) must sit in front of the app in production.
export function clientIp(headers: Headers): string {
  const hops = (headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops[hops.length - 1] ?? "unknown";
}

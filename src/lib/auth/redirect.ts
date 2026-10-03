// Post-login redirect target from ?next=. Only same-site absolute paths are
// allowed; anything that could resolve to another origin falls back.
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (decoded.startsWith("//") || decoded.includes("\\")) return fallback;
  const url = new URL(value, "http://same.origin");
  if (url.origin !== "http://same.origin") return fallback;
  if (url.pathname === "/login") return fallback;
  return `${url.pathname}${url.search}`;
}

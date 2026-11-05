// MY GERMAN DÖNER — HTTP security headers for production (used by next.config.mjs).
// [ADR] Context: Next.js injects inline bootstrap scripts, and the theme boot script is inline too.
// Decision: script-src allows 'unsafe-inline' but no other origin; nonces would force every page dynamic.
// Consequence: an injected inline script is not blocked, so React's escaping stays the XSS defence,
// while loading scripts, frames or plugins from elsewhere is blocked.
const edgeOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_MGD_EDGE_URL ? new URL(process.env.NEXT_PUBLIC_MGD_EDGE_URL).origin : "";
  } catch {
    return "";
  }
})();

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${edgeOrigin ? ` ${edgeOrigin}` : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { requiredRole } = await import("../src/lib/auth/policy.ts");
const { securityHeaders } = await import("../src/lib/security-headers.mjs");
const { readProductionEnv } = await import("../src/lib/env-check.ts");

const header = (name) => securityHeaders.find((h) => h.key === name)?.value;

test("the health check is public and read-only", () => {
  assert.equal(requiredRole("/api/health", "GET"), "PUBLIC");
  assert.notEqual(requiredRole("/api/health", "POST"), "PUBLIC");
});

test("security headers lock down the browser side", () => {
  assert.match(header("Strict-Transport-Security"), /max-age=\d{7,}/);
  assert.equal(header("X-Content-Type-Options"), "nosniff");
  assert.equal(header("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(header("Permissions-Policy"), /camera=\(\)/);
  const csp = header("Content-Security-Policy");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /worker-src 'self'/);
});

test("the Next.js X-Powered-By banner is off and images are limited to our host", () => {
  const config = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");
  assert.match(config, /poweredByHeader:\s*false/);
  assert.doesNotMatch(config, /images\.unsplash\.com/);
});

const good = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://u:p@db:5432/mygd",
  SESSION_SECRET: "x".repeat(64),
  MEDIA_ROOT: "/data/media",
};

test("a complete production environment passes", () => {
  assert.deepEqual(readProductionEnv(good), []);
});

test("missing or weak production settings are all named, without their values", () => {
  const problems = readProductionEnv({ NODE_ENV: "production", DATABASE_URL: "", SESSION_SECRET: "short-secret-value" });
  assert.ok(problems.some((p) => p.includes("DATABASE_URL")));
  assert.ok(problems.some((p) => p.includes("SESSION_SECRET")));
  assert.ok(problems.some((p) => p.includes("MEDIA_ROOT")));
  assert.ok(!problems.join(" ").includes("short-secret-value"));
});

test("development is not held to the production rules", () => {
  assert.deepEqual(readProductionEnv({ NODE_ENV: "development" }), []);
});

// --- production stack: guard the settings that keep it closed ------------------

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("only Caddy publishes ports; the database and app stay private", () => {
  const compose = read("deploy/docker-compose.yml");
  const portsBlocks = compose.match(/^\s+ports:/gm) ?? [];
  assert.equal(portsBlocks.length, 1);
  const caddy = compose.slice(compose.indexOf("\n  caddy:"), compose.indexOf("\n  # One-off jobs"));
  assert.match(caddy, /ports:/);
  assert.match(compose, /backend:\n\s+internal: true/);
});

test("secrets come from the environment and are required, with no fallback", () => {
  const compose = read("deploy/docker-compose.yml");
  assert.match(compose, /SESSION_SECRET: \$\{SESSION_SECRET:\?/);
  assert.match(compose, /DB_PASSWORD:\?/);
  assert.ok(!/POSTGRES_HOST_AUTH_METHOD/.test(compose));
});

test("the image runs as a non-root user on a supported Node line and ships no env files", () => {
  const docker = read("Dockerfile");
  assert.match(docker, /FROM node:22-alpine AS runner/);
  assert.ok(docker.trimEnd().split("\n").some((l) => l === "USER nextjs"));
  const ignore = read(".dockerignore").split("\n");
  assert.ok(ignore.includes(".env") && ignore.includes(".env.*"));
  assert.ok(ignore.includes("deploy") && ignore.includes("Old Data"));
});

test("the proxy sends SSE unbuffered and limits upload size", () => {
  const caddy = read("deploy/Caddyfile");
  assert.match(caddy, /flush_interval -1/);
  assert.match(caddy, /max_size 110MB/);
  assert.match(caddy, /not path \/api\/events/);
});

test("the upload route, which skips middleware, checks the manager role before reading the body", () => {
  const middleware = read("src/middleware.ts");
  assert.match(middleware, /\(\?!admin\/ads\/media\$\)/, "only this one API path may skip middleware");
  const route = read("src/app/api/admin/ads/media/route.ts");
  const guard = route.indexOf('requireRole(req, "STORE_MANAGER")');
  const body = route.indexOf("req.formData()");
  assert.ok(guard > 0 && body > guard, "guard must run before the body is read");
});

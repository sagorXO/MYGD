import test from "node:test";
import assert from "node:assert/strict";

const load = () => import("../src/lib/auth/policy.ts");

// requiredRole(pathname, method, searchParams?) -> "PUBLIC" | "STORE_STAFF" | "STORE_MANAGER" | "SYSTEM_ADMIN"
const cases = [
  // Public: the home page, sign-in, the health check and the ad screens
  ["/", "GET", "PUBLIC"],
  ["/login", "GET", "PUBLIC"],
  ["/api/auth/login", "POST", "PUBLIC"],
  ["/api/health", "GET", "PUBLIC"],
  ["/signage/ads", "GET", "PUBLIC"],
  ["/signage/sw.js", "GET", "PUBLIC"],
  ["/api/signage/ads/1", "GET", "PUBLIC"],
  ["/api/signage/media/abc.mp4", "GET", "PUBLIC"],
  // The ad feed is read-only for everyone
  ["/api/signage/ads/1", "POST", "STORE_STAFF"],
  // Staff screens and actions
  ["/staff", "GET", "STORE_STAFF"],
  ["/staff/checklists", "GET", "STORE_STAFF"],
  ["/api/checklists/board", "GET", "STORE_STAFF"],
  ["/api/checklists/operator", "POST", "STORE_STAFF"],
  ["/api/checklists/items/x/entry", "PUT", "STORE_STAFF"],
  ["/api/auth/me", "GET", "STORE_STAFF"],
  ["/api/auth/logout", "POST", "STORE_STAFF"],
  // Managers: screen ads
  ["/admin", "GET", "STORE_MANAGER"],
  ["/admin/ads", "GET", "STORE_MANAGER"],
  ["/api/admin/ads", "GET", "STORE_MANAGER"],
  ["/api/admin/ads/media", "POST", "STORE_MANAGER"],
  // Deny by default: anything unlisted needs at least a staff session
  ["/api/something-new", "GET", "STORE_STAFF"],
  ["/some-new-page", "GET", "STORE_STAFF"],
  ["/pos", "GET", "STORE_STAFF"],
  // Prefix tricks must not widen access
  ["/administrator", "GET", "STORE_STAFF"],
  ["/signagex", "GET", "STORE_STAFF"],
  ["/api/signage/../admin/ads", "GET", "STORE_MANAGER"],
  ["/api/auth/login", "GET", "STORE_STAFF"],
  // Trailing slashes behave like the bare path
  ["/admin/", "GET", "STORE_MANAGER"],
  ["/login/", "GET", "PUBLIC"],
];

for (const [path, method, expected] of cases) {
  test(`auth/policy: ${method} ${path} -> ${expected}`, async () => {
    const { requiredRole } = await load();
    assert.equal(requiredRole(path, method), expected);
  });
}

test("auth/policy: live updates are public only for the ad screens", async () => {
  const { requiredRole } = await load();
  const q = (channel) => new URLSearchParams(channel === undefined ? "" : `channel=${channel}`);
  assert.equal(requiredRole("/api/events", "GET", q("signage")), "PUBLIC");
  assert.equal(requiredRole("/api/events", "GET", q("admin")), "STORE_STAFF");
  assert.equal(requiredRole("/api/events", "GET", q("all")), "STORE_STAFF");
  assert.equal(requiredRole("/api/events", "GET", q(undefined)), "STORE_STAFF");
});

test("auth/roles: role ranking — owner > manager > staff", async () => {
  const { hasRole } = await import("../src/lib/auth/roles.ts");
  assert.equal(hasRole("SYSTEM_ADMIN", "STORE_MANAGER"), true);
  assert.equal(hasRole("STORE_MANAGER", "STORE_MANAGER"), true);
  assert.equal(hasRole("STORE_STAFF", "STORE_MANAGER"), false);
  assert.equal(hasRole("STORE_STAFF", "STORE_STAFF"), true);
  assert.equal(hasRole("NOBODY", "STORE_STAFF"), false);
  assert.equal(hasRole(undefined, "STORE_STAFF"), false);
});

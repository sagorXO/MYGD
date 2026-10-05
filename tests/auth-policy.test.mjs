import test from "node:test";
import assert from "node:assert/strict";

const load = () => import("../src/lib/auth/policy.ts");

// requiredRole(pathname, method, searchParams?) -> "PUBLIC" | "STORE_STAFF" | "STORE_MANAGER" | "SYSTEM_ADMIN"
const cases = [
  // Public pages and guest-facing screens
  ["/", "GET", "PUBLIC"],
  ["/order", "GET", "PUBLIC"],
  ["/display", "GET", "PUBLIC"],
  ["/boards", "GET", "PUBLIC"],
  ["/login", "GET", "PUBLIC"],
  // Public read-only feeds the guest screens need
  ["/api/menu", "GET", "PUBLIC"],
  ["/api/kds", "GET", "PUBLIC"],
  ["/api/menuboards", "GET", "PUBLIC"],
  ["/api/auth/login", "POST", "PUBLIC"],
  // Staff screens and actions
  ["/pos", "GET", "STORE_STAFF"],
  ["/kds", "GET", "STORE_STAFF"],
  ["/kds/grill", "GET", "STORE_STAFF"],
  ["/kds/indoor", "GET", "STORE_STAFF"],
  ["/staff", "GET", "STORE_STAFF"],
  ["/api/orders", "POST", "STORE_STAFF"],
  ["/api/kds", "PATCH", "STORE_STAFF"],
  ["/api/terminal/print", "POST", "STORE_STAFF"],
  ["/api/staff/timeclock", "POST", "STORE_STAFF"],
  ["/api/staff/build-sheets", "GET", "STORE_STAFF"],
  ["/api/checklists/log", "POST", "STORE_STAFF"],
  ["/api/auth/me", "GET", "STORE_STAFF"],
  ["/api/auth/logout", "POST", "STORE_STAFF"],
  // Manager / back office
  ["/admin", "GET", "STORE_MANAGER"],
  ["/admin/menu-boards", "GET", "STORE_MANAGER"],
  ["/admin/suppliers", "GET", "STORE_MANAGER"],
  ["/api/admin/menu", "PATCH", "STORE_MANAGER"],
  ["/api/admin/reports", "GET", "STORE_MANAGER"],
  ["/api/menuboards", "PATCH", "STORE_MANAGER"],
  // Deny by default: anything unlisted needs at least a staff session
  ["/api/something-new", "GET", "STORE_STAFF"],
  ["/some-new-page", "GET", "STORE_STAFF"],
  // Prefix tricks must not widen access
  ["/administrator", "GET", "STORE_STAFF"],
  ["/api/admin", "GET", "STORE_MANAGER"],
  ["/api/menu/../admin/menu", "PATCH", "STORE_MANAGER"],
  ["/orders", "GET", "STORE_STAFF"],
  ["/api/auth/login", "GET", "STORE_STAFF"],
  // Trailing slashes behave like the bare path
  ["/admin/", "GET", "STORE_MANAGER"],
  ["/display/", "GET", "PUBLIC"],
];

for (const [path, method, expected] of cases) {
  test(`auth/policy: ${method} ${path} -> ${expected}`, async () => {
    const { requiredRole } = await load();
    assert.equal(requiredRole(path, method), expected);
  });
}

test("auth/policy: SSE is public only for the guest channels", async () => {
  const { requiredRole } = await load();
  const q = (channel) => new URLSearchParams(channel === undefined ? "" : `channel=${channel}`);
  assert.equal(requiredRole("/api/events", "GET", q("display")), "PUBLIC");
  assert.equal(requiredRole("/api/events", "GET", q("boards")), "PUBLIC");
  assert.equal(requiredRole("/api/events", "GET", q("kds")), "STORE_STAFF");
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

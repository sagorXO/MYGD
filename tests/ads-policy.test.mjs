import test from "node:test";
import assert from "node:assert/strict";

const { requiredRole } = await import("../src/lib/auth/policy.ts");
const SHA = "c".repeat(64);

test("the portrait player, its feed, its media and its SSE channel are public (unattended screens)", () => {
  assert.equal(requiredRole("/signage/ads", "GET"), "PUBLIC");
  assert.equal(requiredRole("/signage/sw.js", "GET"), "PUBLIC");
  assert.equal(requiredRole("/api/signage/ads/1", "GET"), "PUBLIC");
  assert.equal(requiredRole(`/api/signage/media/${SHA}.mp4`, "GET"), "PUBLIC");
  assert.equal(requiredRole(`/api/signage/media/${SHA}.mp4`, "HEAD"), "PUBLIC");
  assert.equal(requiredRole("/api/events", "GET", new URLSearchParams("channel=signage")), "PUBLIC");
});

test("writes to the public signage paths are not public", () => {
  assert.notEqual(requiredRole("/api/signage/ads/1", "POST"), "PUBLIC");
  assert.notEqual(requiredRole(`/api/signage/media/${SHA}.mp4`, "PUT"), "PUBLIC");
});

test("the ads admin screen and API need a manager", () => {
  assert.equal(requiredRole("/admin/ads", "GET"), "STORE_MANAGER");
  assert.equal(requiredRole("/api/admin/ads", "GET"), "STORE_MANAGER");
  assert.equal(requiredRole("/api/admin/ads/media", "POST"), "STORE_MANAGER");
});

test("path tricks do not reach the public signage prefix", () => {
  assert.notEqual(requiredRole("/api/signage/../admin/ads", "GET"), "PUBLIC");
  assert.notEqual(requiredRole("/api/signage-x/ads/1", "GET"), "PUBLIC");
});

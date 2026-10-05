import test from "node:test";
import assert from "node:assert/strict";

const load = () => import("../src/lib/auth/redirect.ts");

test("auth/redirect: keeps same-site paths (with query)", async () => {
  const { safeNextPath } = await load();
  assert.equal(safeNextPath("/admin"), "/admin");
  assert.equal(safeNextPath("/pos?x=1"), "/pos?x=1");
  assert.equal(safeNextPath("/kds/grill"), "/kds/grill");
});

test("auth/redirect: anything that could leave the site falls back", async () => {
  const { safeNextPath } = await load();
  for (const bad of [
    "https://evil.example", "//evil.example", "/\\evil.example", "\\\\evil.example",
    "javascript:alert(1)", "evil.example", "", null, undefined, 42, "/login", "/login?next=/admin",
    "/%2F%2Fevil.example", " /admin",
  ]) {
    assert.equal(safeNextPath(bad), "/", String(bad));
  }
});

test("auth/redirect: custom fallback is used", async () => {
  const { safeNextPath } = await load();
  assert.equal(safeNextPath("//x", "/pos"), "/pos");
});

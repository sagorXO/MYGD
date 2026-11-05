import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const clientFiles = ["src/modules/haccp/components", "src/modules/checklists/components"].flatMap(walk).filter((f) => /\.tsx?$/.test(f));

function routeExists(apiPath) {
  // `${x}` segments in a client path match a [param] folder.
  const parts = apiPath.replace(/^\//, "").split("/");
  const go = (dir, i) => {
    if (i === parts.length) return existsSync(join(dir, "route.ts"));
    if (!parts[i].includes("${")) return existsSync(join(dir, parts[i])) && go(join(dir, parts[i]), i + 1);
    return readdirSync(dir).some((f) => f.startsWith("[") && go(join(dir, f), i + 1));
  };
  return go("src/app", 0);
}

test("every API path the staff screens call exists", () => {
  const paths = clientFiles.flatMap((f) => [...readFileSync(f, "utf8").matchAll(/["`](\/api\/[^"`?]+)/g)].map((m) => m[1]));
  assert.ok(paths.length >= 5, "expected the staff screens to call the API");
  const missing = paths.filter((p) => !routeExists(p));
  assert.deepEqual(missing, []);
});

test("the staff screens don't call the old checklist route or show its old message", () => {
  const hub = readFileSync("src/modules/haccp/components/StaffHaccpHub.tsx", "utf8");
  assert.equal(hub.includes('fetch("/api/checklists"'), false);
  assert.equal(hub.includes("HACCP Record logged"), false);
});

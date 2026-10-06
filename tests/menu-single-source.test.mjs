// Guard: the menu lives in src/lib/menu/mygd-menu.ts only. Old items must not return and
// new item names must not be typed anywhere else in source (the DB and derived views carry them).
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const MENU_FILE = join("src", "lib", "menu", "mygd-menu.ts");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|json|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

const sources = [...walk(join(root, "src")), ...walk(join(root, "prisma"))].filter((f) => relative(root, f) !== MENU_FILE);

const OLD_ITEMS = ["Falafel", "Currywurst", "Truffle", "Original German Döner", "Steak Döner", "Onion Rings", "Freddo", "MYGD-CL-DONER", "MYGD-B1-", "MYGD-B6-", "MYGD-COMBO-MYMEAL", "Berlin Fries", "330ml"];
const NEW_NAMES_ONLY_IN_MENU = ["Beefster", "Cheesy GD", "Chicken Hype", "Hollandaise Fries", "Latte Macchiato", "Five Cheese", "Lemongrass Unity"];

test("no item from the old menu is left anywhere in src/ or prisma/", () => {
  const hits = [];
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const old of OLD_ITEMS) if (text.includes(old)) hits.push(`${relative(root, file).split(sep).join("/")}: ${old}`);
  }
  assert.deepEqual(hits, []);
});

test("menu item names are not duplicated outside the single source", () => {
  const hits = [];
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const name of NEW_NAMES_ONLY_IN_MENU) if (text.includes(name)) hits.push(`${relative(root, file).split(sep).join("/")}: ${name}`);
  }
  assert.deepEqual(hits, []);
});

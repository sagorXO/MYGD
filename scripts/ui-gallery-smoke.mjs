// Usage: `npm run dev` (port 3000) in one terminal, then `npm run ui:smoke`.
// Loads /dev/ui in light and dark, fails on console errors or a wrong data-theme,
// and writes full-page screenshots to artifacts/ui-gallery/.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.UI_SMOKE_URL ?? "http://localhost:3000/dev/ui";
mkdirSync("artifacts/ui-gallery", { recursive: true });

const browser = await chromium.launch();
let failed = false;
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme });
    await context.addInitScript((t) => window.localStorage.setItem("mygd.theme.admin", t), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE, { waitUntil: "networkidle" });
    const applied = await page.getAttribute("[data-surface]", "data-theme");
    if (applied !== theme) {
      failed = true;
      console.error(`✗ ${theme}: data-theme is "${applied}"`);
    }
    await page.screenshot({ path: `artifacts/ui-gallery/admin-${theme}.png`, fullPage: true });
    if (errors.length) {
      failed = true;
      console.error(`✗ ${theme}: console errors\n  ${errors.join("\n  ")}`);
    } else {
      console.log(`✓ ${theme}: no console errors, screenshot saved`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);

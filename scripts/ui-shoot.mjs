import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const url = process.argv[2], name = process.argv[3], surface = process.argv[4];
mkdirSync("artifacts/preview", { recursive: true });
const b = await chromium.launch();
for (const [theme, w, h] of [["light", 1440, 900], ["dark", 1440, 900], ["light", 390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
  await ctx.addInitScript(([s, t]) => localStorage.setItem(`mygd.theme.${s}`, t), [surface, theme]);
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  await p.evaluate(() => { document.documentElement.style.height = "auto"; document.body.style.height = "auto"; document.body.style.overflow = "visible"; });
  const f = `artifacts/preview/${name}-${theme}-${w}.png`;
  await p.screenshot({ path: f, fullPage: true });
  console.log(f, "theme=", await p.getAttribute("[data-surface]", "data-theme"), errs.length ? "ERRORS: " + errs.join(" | ").slice(0, 300) : "no errors");
  await ctx.close();
}
await b.close();

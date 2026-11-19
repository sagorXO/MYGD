import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "./helpers/render.mjs";

const d = JSON.parse(readFileSync("data/checklists/mygd-station-checklists.v1.json", "utf8"));
// Text of Oliver's PDF (version 24 Oct 2026), taken out with macOS PDFKit.
const pdf = readFileSync("tests/fixtures/station-checklists-pdf.txt", "utf8");
const S = await import("../src/modules/checklists/checklists.schema.ts");
const { StationGuideCard } = await import("../src/modules/checklists/components/StationGuideCard.tsx");

const STATIONS = [...new Set(d.checklists.map((g) => g.station))];

// Pages 2-15, each as a list of trimmed lines without the running header and footer.
function pages() {
  const out = new Map();
  const parts = pdf.split(/=====PAGE (\d+)=====\n/);
  for (let i = 1; i < parts.length; i += 2) {
    const n = Number(parts[i]);
    if (n < 2 || n > 15) continue;
    out.set(n, parts[i + 1].split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("MYGD |")));
  }
  return out;
}

// A wrapped paragraph ends on the line that ends with a full stop.
function importantNotes() {
  const notes = [];
  for (const [page, lines] of pages()) {
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("IMPORTANT:")) continue;
      let text = lines[i].slice("IMPORTANT:".length).trim();
      while (!text.endsWith(".")) text += ` ${lines[++i]}`;
      notes.push({ page, text });
    }
  }
  return notes;
}

// Everything under a PERFORMANCE STANDARD heading up to the end of its page; bullets start new lines.
function standards() {
  const out = [];
  for (const [page, lines] of pages()) {
    const start = lines.indexOf("PERFORMANCE STANDARD");
    if (start < 0) continue;
    let cur = "";
    const flush = () => { if (cur) out.push({ page, text: cur }); cur = ""; };
    for (const line of lines.slice(start + 1)) {
      if (line.startsWith("• ")) { flush(); cur = line.slice(2); } else cur = cur ? `${cur} ${line}` : line;
      if (cur.endsWith(".")) flush();
    }
    flush();
  }
  return out;
}

const guideLines = Object.values(d.stationGuide ?? {}).flat();
const has = (kind, page, text) => guideLines.some((l) => l.kind === kind && l.sourcePage === page && l.text === text);

test("the PDF text yields the expected notes", () => {
  assert.equal(importantNotes().length, 8);
  assert.equal(standards().length, 12);
});

test("every IMPORTANT note from pages 2-15 is in the station guide, word for word", () => {
  for (const n of importantNotes()) assert.ok(has("IMPORTANT", n.page, n.text), `p${n.page}: ${n.text}`);
});

test("every PERFORMANCE STANDARD line is in the station guide, word for word", () => {
  for (const s of standards()) assert.ok(has("STANDARD", s.page, s.text), `p${s.page}: ${s.text}`);
});

test("every guide line appears in the PDF text", () => {
  const flat = pdf.replace(/\s+/g, " ");
  assert.ok(guideLines.length > 0);
  for (const l of guideLines) assert.ok(flat.includes(l.text), `${l.kind} p${l.sourcePage}: ${l.text}`);
});

test("the guide covers each station plus the general rules", () => {
  assert.deepEqual(Object.keys(d.stationGuide).sort(), ["general", ...STATIONS].sort());
  for (const s of ["SHIFT_LEADER", "MEAT_HOT", "KITCHEN_PREP", "ASSEMBLY"]) {
    assert.equal(d.stationGuide[s].filter((l) => l.kind === "RESPONSIBILITY").length, 1, s);
  }
  const general = d.stationGuide.general.map((l) => l.text);
  assert.ok(general.includes("ORDER → BREAD → SAUCE → SALAD → MEAT → PACKING / EXPEDITOR → CUSTOMER"));
  assert.ok(general.includes("CLEAN → RESTOCK → PREPARE → ORGANISE"));
  assert.equal(d.stationGuide.general.filter((l) => l.kind === "RULE" && l.sourcePage === 2).length, 5);
});

test("the loader schema accepts the guide and rejects bad lines", () => {
  assert.ok(S.StationGuideSchema.parse(d.stationGuide).general.length > 0);
  for (const bad of [
    { general: [{ kind: "NOPE", text: "x", sourcePage: 2 }] },
    { general: [{ kind: "RULE", text: "", sourcePage: 2 }] },
    { general: [{ kind: "RULE", text: "x", sourcePage: 1.5 }] },
    { general: "x" },
  ]) {
    assert.equal(S.StationGuideSchema.safeParse(bad).success, false, JSON.stringify(bad));
  }
});

test("the station guide card shows the station's lines and the general rules", () => {
  const guide = S.StationGuideSchema.parse(d.stationGuide);
  const html = render(StationGuideCard, { lines: guide.MEAT_HOT, general: guide.general });
  assert.match(html, /<details/);
  assert.match(html, /Station guide/);
  assert.match(html, /General rules/);
  assert.match(html, /must never run out of ready-to-serve meat during service/);
  assert.match(html, /ORDER → BREAD/);
});

test("the station guide card renders nothing when there is no guide", () => {
  assert.equal(render(StationGuideCard, { lines: [], general: [] }), "");
});

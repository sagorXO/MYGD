# MYGD — Contract Alignment & Cleanup Manifest

- **Date:** 2026-10-03
- **Branch:** `cleanup/phase0`
- **Sources:** `Documents/01. MSA.docx`, `02. SOW.docx`, `03. Payment Schedule.docx`, `04. Technical prerequisites.docx` (final), the client brief `Requirements/MYGD Control System Developer Brief EN.pdf` (Draft 1.9, 4 Aug 2026), and Sagar's operating brief of 2026-10-01.

---

## 1. Which contract is final (verified)

**Final = the `01. MSA / 02. SOW / 03. Payment Schedule / 04. Technical prerequisites` `.docx` set, Revision 3.1, effective 24 August 2026, €12,000 (€1,000 advance + 11 × €1,000).**

Evidence:

| Check | Result |
|---|---|
| On-disk `.docx` vs git (`2b40087`, 2026-09-25) | Identical, no uncommitted change. |
| Other `.docx` copies in history | The 15 Aug originals are earlier and shorter, with no revision, date or price. The `01_…MSA.docx` / `02_…SOW.docx` copies (added 25 Sep, deleted 28 Sep) have **text identical** to the final MSA and SOW. |
| Payment Schedule copies | The final differs from the deleted copy **only in the bank-details block** (see warning below). |
| `.md` files in `Documents/` | Drafts, **not** the contract. The MSA `.md` is 3× longer than the signed text, and the `.md` Schedule B was edited after the `.docx` was produced (`20:58` vs `19:57` on 8 Sep). Where they differ, the `.docx` wins. |
| Vault / session history | No later revision or amendment is recorded anywhere. |

> ⚠️ **Bank details in the final `03. Payment Schedule.docx` look like a placeholder.** The SEPA line reads "Revolut Bank UAB / Bank of Cyprus" (two banks) with an IBAN ending `…0000 0000 1234 5678`. The draft `.md` and the deleted copy carry a different, real-looking Eurobank account. Confirm which account the client actually pays into before the next invoice.

## 2. Roles (per Sagar, 2026-10-03)

- **Sagar (Contractor):** builds the whole system: all five systems, server, database, integrations.
- **DM Soft:** supplies the **touch-screen self-order kiosk** and a **bridge connection portal** that sends kiosk orders to MYGD. Card payment on the kiosk is Link4Pay, embedded by DM Soft.

## 3. Contract vs. reality: variances that need a written note to the client

The MSA has no change-control clause, so any departure from SOW Rev 3.1 should be agreed in a short signed addendum (or at least a written confirmation by email from Rico/Oliver). Otherwise UAT (MSA §4) is measured against the SOW text.

| # | SOW Rev 3.1 says | Current plan | Recommendation |
|---|---|---|---|
| V1 | **Register 2 = dedicated Shopify POS terminal**; local Shopify webhook into 192.168.1.50; Stage 0 includes "Shopify Development App provisioning"; SLA covers "Shopify API version compatibility" | No Shopify. Second order channel = **DM Soft kiosk** via their bridge; Shopify code already removed (`c83abc2`) | **Addendum:** replace "Register 2 (Shopify POS)" with "DM Soft self-order kiosk(s) via DM Soft bridge"; drop the Shopify SLA item. |
| V2 | Local Windows PC 192.168.1.50 with **SQLite WAL**, "100% offline autonomy"; cloud PostgreSQL sync | **New database** (engine TBD). Kiosk and card terminals are online-only (5G backup router planned) | The offline requirement stays contractual for till, printers and KDS. Choose the new DB with that in mind (local Postgres on the store PC + cloud sync satisfies the SOW's intent). Record the DB choice in the addendum only if it changes the "Hybrid Compute Model" (MSA §1). |
| V3 | Customer queue TV: "Preparing" / "Ready for Pickup" | "In preparation" / "Ready" | Wording only. No addendum needed. |
| V4 | Kitchen: **2 stations**: Station 1 Indoor Assembly, Station 2 Outdoor Charcoal Grill; `/kds/indoor`, `/kds/grill` | Stations **prep, grill, fryer, packing**; one multi-ticket board | The contract minimum is met if indoor/grill routing works; four stations is a superset. Keep `/kds/indoor` + `/kds/grill` as filtered views of the new board so UAT paths still exist. |
| V5 | **VAT fixed in the MSA §3.4: 9% food/dine-in/takeaway/soft drinks, 19% alcohol** | Previously "wait for accountant" | The contract now **answers Q-VAT-1**: implement 9/19 in the VAT config table, still flagged for accountant confirmation. Invoice fields (Q-INV-*) remain open. |
| V6 | 2 stores (Emba + Limassol Marina), Wolt/Foody bridges (Month 9) | Emba first | Keep `locationId` everywhere; nothing to change now. |
| V7 | 4 boards (`/boards?screen=1..4`), screen allocation given | Brief said "4 vs 7" | **Contract answers Q-UI-1: 4 screens** (the client brief says "up to 7"; the schema allows 7). |
| V8 | Languages EN/DE/GR | English first, extensible | Compatible; the `de`/`gr` locale files stay. |
| V9 | Kiosk not mentioned anywhere | DM Soft kiosk is the main sales channel | Covered by V1. |

## 4. SOW deliverables → code status (2026-10-03)

| SOW item (Schedule B stage) | Route / module | Status | Note |
|---|---|---|---|
| M1 Checklists & HACCP (Month 1) | `/staff`, `api/checklists/*` | ⚠️ Broken UI | The screen calls `/api/staff` and `/api/checklists` (404); the real routes exist but nothing calls them. |
| M2 Supplier ordering, >€250 approval (Month 1) | `/admin/suppliers` | ❌ Not wired | Static page; no route. |
| M3 BOM & spit depletion (Month 2) | `modules/inventory`, `api/admin/inventory*` | 🟡 Partial | Engine + tests; unauthenticated admin API. |
| iPad Web POS + Link4Pay + drawer kick (Month 2) | `/pos`, `api/orders` | 🟡 Partial | Trusts client prices; flat 19% VAT; drawer pulse never sent; no Link4Pay. |
| M9 Reporting + dual-VAT export (Month 3) | `/admin` BI, `api/admin/reports` | 🟡 Partial | No dual-VAT export. `lib/tax.ts` (9/19 split) exists but only tests use it. |
| M7 Shifts + PIN timeclock (Month 4) | `api/staff/timeclock` | 🟡 Backend only | No UI caller; PINs stored and compared in plaintext. |
| M8 Build sheets (Month 5) | `api/staff/build-sheets` | 🟡 Backend only | No UI caller. |
| System 2: 4×4K boards, dayparting, sold-out push (Month 6) | `/boards`, `/admin/menu-boards`, `api/menuboards` | 🟡 Partial | `/boards` renders hard-coded data (TODO added). |
| System 4: dual-station KDS + TCP spooler + `/display` (Month 7) | `/kds/{indoor,grill}`, `modules/printer`, `/display` | 🟡 Partial | One ticket per order; in-memory print queue; display driven by tickets. |
| System 1: public site + `/order` pre-order (Month 8) | `/`, `/order`, `features/home` | 🟡 Partial | `/order` static; new home only at `/dev/preview/home`. |
| Admin authentication (implied by "Owner Portal") | — | ❌ Missing | No session; the only login UI (`AdminModal`) was never mounted. |

## 5. Cleanup manifest (needs your approval: deletion was blocked by the permission classifier)

Everything below is tracked in git and recoverable from tag `backup/pre-cleanup-phase0`. Evidence comes from an import graph of all 36 Next.js entry points plus a reference search (`git grep`) across `src`, `tests`, `scripts` and configs.

### A. Dead code (unreachable from any page, route or test)
`src/components/kiosk/*` (10 files), `src/components/admin/AdminModal.tsx`, `src/store/{cartStore,kioskStore,localeStore}.ts`, `src/lib/price-validator.ts`, `src/lib/supplier-reorder.ts`, plus the routes only that UI called: `src/app/api/orders/create/route.ts`, `src/app/api/orders/[id]/route.ts`.
*Why it can go:* the in-house kiosk is not in the contract; DM Soft provides the kiosk.

### B. Dead legacy files
- Root `components/*` (6 files, no references).
- `src/lib/printer.service.ts` + `tests/printer-service.test.mjs` (test-only duplicate of `src/modules/printer`).

### C. Demo, pitch and sales media (~31 MB, no references from the app)
- `recordings/` (22).
- `public/demo/` (15) and `public/slides/` (11). These are **served publicly** by the app today, including the "financial ROI" slide.
- `assets/slides/` (11).
- Scripts `scripts/record-demo.ts`, `scripts/generate_pitch_pdf.js`.

### D. Old database and infra tooling ("new database")
- `supabase/` (old project link).
- `docker-compose.yml`: contains old Supabase URLs with passwords and references the archived `apps/*`.
- `scripts/docker-run.sh` and the `docker:start` / `docker:stop` scripts.
- `.agents/` + `skills-lock.json` (Supabase agent skills).
- `turbo.json` + the `turbo` devDependency (no workspaces left).
- Local only (untracked, cannot be restored from git): `prisma/data/kiosk_pos.db*` (old SQLite).

### E. Superseded documents
- `Documents/01_…MSA.md`, `02_…SOW.md`, `03_…Payment_Schedule.md`, `04_…Tooling.md`: drafts that contradict the signed `.docx` and contain bank details.
- `Documents/00_CLIENT_PRESENTATION_PACKAGE_INDEX.md` and `06_Executive_Pitch_Deck_Companion.md`: pre-signing sales collateral.
- Generator scripts `scripts/build_docx_contracts.py`, `scripts/build_invoice_pdf.js`: produced the signed docs; they contain bank details and the Shopify scope.
- **Keep:** the four final `.docx`; `Invoice 001_PAID.docx`; `MGD_INV_AI_tools.docx`; `MYGD_PRD.md` (the SOW §3 makes "Master PRD Rev 3.3" the UAT reference); `07_Hardware…`; `08_Staff…SOP`; `Requirements/…Brief EN.pdf`.

### F. Repo hygiene
- `gemini.md`: stale agent constitution (24 Aug architecture).
- `.brain/01_Projects/MYGD/*.md` (2 notes **not in the vault**): move to the vault, then remove from the repo.
- `.md-linker/graph.json`: 652 KB generated cache, rewritten by a plugin hook; untrack it and add it to `.gitignore`.

### G. Project file
- `package.json`: rename `my-german-doner-monorepo` (no longer a monorepo). After A and D, remove `turbo` and check whether `zustand` (only the deleted stores used it), `canvas-confetti`, `qrcode` and `pdf-lib` still have importers.
- Rewrite `README.md` to the contract scope and the current layout.

### Commands (run from the repo root on `cleanup/phase0`, one commit per group)
```bash
# A
git rm -r src/components/kiosk src/components/admin/AdminModal.tsx src/store src/lib/price-validator.ts src/lib/supplier-reorder.ts "src/app/api/orders/create" "src/app/api/orders/[id]"
# B
git rm -r components src/lib/printer.service.ts tests/printer-service.test.mjs
# C
git rm -r recordings public/demo public/slides assets/slides scripts/record-demo.ts scripts/generate_pitch_pdf.js
# D
git rm -r supabase docker-compose.yml scripts/docker-run.sh .agents skills-lock.json turbo.json
# E
git rm "Documents/01_Master_Software_Services_Agreement_MSA.md" "Documents/02_Statement_of_Work_SOW.md" "Documents/03_Commercial_Milestones_and_Payment_Schedule.md" "Documents/04_Client_Technical_Prerequisites_and_Tooling.md" "Documents/00_CLIENT_PRESENTATION_PACKAGE_INDEX.md" "Documents/06_Executive_Pitch_Deck_Companion.md" scripts/build_docx_contracts.py scripts/build_invoice_pdf.js
# F
git rm gemini.md && git rm --cached .md-linker/graph.json
```

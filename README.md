---
stale-refs:
  - source: docs/PRD.md
    changed_at: "2026-10-06T06:51:30"
    sections_changed: [⚙️ Configuration catalogue (v1.1)]
    summary: "Added: Every value below is **a setting or a table row, never a literal in code** (P.8). Scope: **G** global, **L** per location, **C** per channel. \"Initial\" is the value to seed; where the source is an open question the value is not guessed and the setting is required before the feature is enabled. Editors: **O** owner, **M** manager. Every change is audited.; | Key | Meaning | Scope | Initial / default | Editor | Source |; |---|---|---|---|---|---| (+34 more)"
  - source: docs/open-questions.md
    changed_at: "2026-10-06T06:51:51"
    sections_changed: ["PRD v1.1 additions (2026-10-06): order channels and day close", Legacy data (added 2026-10-03)]
    summary: "Added: Source: `docs/gladius-feature-extraction.md`. None of these may be guessed in code; each is a setting or a marked TODO (PRD P.8).; **Order channels (M12)**; - **Q-FOODY-1 (OPEN, blocking M12)** Does Foody (and Bolt, Wolt) give MYGD a direct API or webhook, or is the Softech bridge the only route? Who owns the credentials, and are platform orders paid to the platform (assumed) or sometimes collected in cash? (+19 more)"
  - source: DESIGN.md
    changed_at: "2026-10-06T00:37:14"
    sections_changed: []
    summary: externally modified
---

# MY GERMAN DÖNER (MYGD) — Operations System

A connected operations system for the MY GERMAN DÖNER restaurants in Cyprus (Emba / Paphos; Limassol Marina to follow):
- **Till** (`/pos`)
- **Kitchen display** (`/kds`) and **customer status screen** (`/display`)
- **Menu boards** (`/boards`)
- **Staff tablet** (`/staff`)
- **Owner dashboard** (`/admin`)
- **Public website / pre-order** (`/`, `/order`)

Our own PostgreSQL database is the single source of truth. Self-order kiosks are supplied by **DM Soft** and send orders to MYGD through their bridge.

> **Status (2026-10-03):** rebuild in progress. Read `docs/PRD.md` first.

## Documents

| Document | What it is |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Master product requirements, grouped by module (M1–M13). **Draft v1.1** (v1.0 approved 2026-10-03): order channel intake, day close, configuration rules |
| [`docs/hardcoded-values-register.md`](docs/hardcoded-values-register.md) | Hard-coded values found in the code and how each is fixed (PRD P.8) |
| [`docs/TRD.md`](docs/TRD.md) | Technical requirements: architecture, stack, schema (current + proposed), API, security |
| [`docs/open-questions.md`](docs/open-questions.md) | Everything unknown; code uses config values or marked TODOs for these |
| [`docs/contract-alignment.md`](docs/contract-alignment.md) | Signed contract vs current plan (variances needing client confirmation) |
| [`docs/audit-phase0.md`](docs/audit-phase0.md) | Phase 0 audit of the codebase (2026-10-01 snapshot) |
| [`docs/printing-inventory.md`](docs/printing-inventory.md) | Which print code the till uses |
| [`docs/gladius-feature-extraction.md`](docs/gladius-feature-extraction.md) | Everything usable from the old Gladius till: features with modern designs, Z-report layout, reference data, hardware facts, data model, switch-off checklist |
| [`DESIGN.md`](DESIGN.md) | Design system (tokens live in `src/ui/tokens.css`) |
| `Documents/` | Signed contract, Rev 3.1 (MSA, SOW, payment schedule, prerequisites) and issued invoices |
| `Requirements/` | Client's original developer brief (4 Aug 2026) |

## Stack

Next.js 15 (App Router, standalone output) · React 19 · TypeScript 5.7 · Prisma 6 → PostgreSQL · Zod · Tailwind 3.4 + in-house UI kit (`src/ui/`) · Server-Sent Events · ESC/POS over TCP 9100 · tests with `node:test` via `tsx`.

## Getting started

```bash
npm ci
cp .env.example .env    # then fill in DATABASE_URL / DIRECT_URL and the other values
npm run db:generate
npm run dev             # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm test` | Unit tests (`tests/*.test.mjs`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js ESLint |
| `npm run ui:smoke` | Playwright screenshots of the UI kit (writes `artifacts/`) |
| `npm run db:generate` / `db:push` / `db:seed` | Prisma client, schema push (until migrations exist), seed (`prisma/seed.ts`) |

Every change must pass `npm test`, `npm run typecheck` and `npm run build`.

## Project layout

```
src/
  app/            routes: /, /order, /pos, /kds(/indoor,/grill), /display, /boards, /staff, /admin(/menu-boards,/suppliers,/vouchers)
    api/          route handlers (menu, orders, pricing, kds, events [SSE], menuboards, terminal/print, admin/*, checklists/*, staff/*)
    dev/          UI kit gallery and home preview (404 in production)
  modules/        bi · cx-wait · haccp · inventory · kds · menu · pos · printer · signage
  features/home/  public homepage (served at /)
  ui/             design-system components and tokens
  lib/            prisma client, events (SSE broker), i18n, tax, engines
  locales/        en · de · gr
prisma/           schema.prisma (PostgreSQL), seed.ts
tests/            node:test suites
scripts/          UI screenshot helpers (Playwright)
public/assets/    brand, menu and board images
```

## Rules

- Keep secrets out of the repo. `.env*` files are git-ignored and excluded from Docker builds.
- Treat `import/` (legacy till data, GDPR-sensitive) as read-only and never commit it.
- Don't guess unknown business rules (VAT confirmation, receipt fields, DM Soft payload, printer models). Use a config value or a `TODO`, and list it in `docs/open-questions.md`.
- Never add Shopify code or dependencies.

---

**Client:** MY GERMAN DÖNER TRADING LTD (Rico & Oliver). **Lead engineer:** Md. Saied Sagar. © 2026 MY GERMAN DÖNER. All rights reserved.

## Menu, offers and vouchers

The menu lives in `src/lib/menu/mygd-menu.ts` and is loaded with `npm run db:seed`. How offers, vouchers and gift cards work: [docs/MENU.md](docs/MENU.md).

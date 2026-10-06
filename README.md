---
stale-refs:
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
| [`docs/PRD.md`](docs/PRD.md) | Master product requirements, grouped by module (M1–M12) |
| [`docs/TRD.md`](docs/TRD.md) | Technical requirements: architecture, stack, schema (current + proposed), API, security |
| [`docs/open-questions.md`](docs/open-questions.md) | Everything unknown; code uses config values or marked TODOs for these |
| [`docs/contract-alignment.md`](docs/contract-alignment.md) | Signed contract vs current plan (variances needing client confirmation) |
| [`docs/audit-phase0.md`](docs/audit-phase0.md) | Phase 0 audit of the codebase (2026-10-01 snapshot) |
| [`docs/printing-inventory.md`](docs/printing-inventory.md) | Which print code the till uses |
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

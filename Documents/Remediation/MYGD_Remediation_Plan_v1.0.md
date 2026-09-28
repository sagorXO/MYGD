# MYGD — Remediation & Hardening Plan

**Version:** 1.0
**Date:** 28 September 2026
**Author:** Md. Saied Sagar — Lead Systems Architect
**Basis:** Code audit of `/MYGD` (schema, order paths, engines, test suite), 28 Sep 2026
**Scope:** Close the gap between what the PRD claims and what the code does, then harden.

> Phase 0 decisions are recorded in `PHASE_0_DECISIONS.md` alongside this file.

---

## How to use this document

Each work unit (WU) is self-contained: problem, fix, acceptance criteria, tests.
Run them in order — later units assume earlier ones landed.

**Rules for this remediation cycle:**

1. One WU per branch. No WU touches more than its stated files unless noted.
2. Every WU ships with tests that fail before the fix and pass after.
3. No WU is "done" on a green unit test alone. Each has an integration check.
4. Do not mark anything ✅ in the PRD until its WU acceptance criteria pass.

**Priority key:** 🔴 blocks go-live · 🟠 blocks client demo · 🟡 quality/maintenance

---

## Phase 0 — Decide before coding

### D-1 — Canonical codebase 🔴

The tree holds three copies of the application: `src/` (real, complete),
`apps/edge/src/` (partial duplicate, drifting), `apps/{boards,hq,kds,order,pos,staff}/`
(config only), root `components/` (orphaned), and `packages/db/prisma/schema.prisma`
(duplicate schema). `package.json` declares workspaces but `build` is a plain
`next build` on root.

**Decision:** collapse to a single Next.js app rooted at `src/`. Delete `apps/`, root
`components/`, and `packages/db/prisma/`. Keep `packages/printing`, `packages/types`
and `packages/ui` only if actually imported — verify first, delete if not.

**Rejected alternative:** completing the monorepo split.

### D-2 — Offline model 🔴

The PRD promises "100% in-store offline autonomy". The code has none.

- **(a) Full offline.** Local DB on the edge server, real outbox to cloud. 5–8 days.
- **(b) Scoped offline.** Cash-only capture during outage, queued and reconciled on
  reconnect. Card and Shopify unavailable while offline. 2–3 days.
- **(c) Drop the claim.** Amend the PRD and tell Rico before go-live.

**Recommended: (b).** WU-7 assumes (b).

---

## Phase 1 — Correctness 🔴

- **WU-1** Route all order paths through the VAT engine (9% FOOD_BEV / 19% ALCOHOL),
  persist the split (`netFood`, `vatFood`, `netAlcohol`, `vatAlcohol`), deprecate
  single `vatRate`, fix receipt and fiscal CSV. *Get accountant confirmation on
  dine-in vs takeaway first.*
- **WU-2** Deduct inventory on every order path: one shared order service, BOM
  deduction inside the order transaction, no silent catch.
- **WU-3** Concurrency-safe numbering: `DailySequence` table with atomic increment,
  one format `{LOCATION}-{YYYYMMDD}-{SEQ4}`, business day rolls at a configured hour.
- **WU-4** Secure the Shopify webhook: fail closed, no secret fallback, timing-safe
  HMAC, no arbitrary-product fallback (`UNMAPPED_SKU` hold), idempotency on webhook
  id, 200 fast + async processing.

## Phase 2 — Security 🔴

- **WU-5** Real sessions (signed httpOnly cookie, sliding TTL), middleware guarding
  `/api/admin/*`, `/api/staff/*`, `/api/terminal/*`, inventory routes; role ladder
  `STORE_STAFF < STORE_MANAGER < SYSTEM_ADMIN`; device-bound API keys; required
  `SESSION_SECRET`.
- **WU-6** Fix PIN auth: identify before verify, PIN unique per location, lockout on
  the attempted user only, 15 minutes, per-IP rate limit, distinct PINs for Rico and
  Oli, remove PIN literals.

## Phase 3 — Missing features the PRD claims 🟠

- **WU-7** Offline capture and sync queue (implements D-2(b)).
- **WU-8** Real spit tracking: persisted `SpitMount`, cooked-yield factor (confirm
  with Arafat; 0.70 placeholder), hooked into the shared order service, manager-PIN
  mount.
- **WU-9** Resolve duplicate models: keep `Recipe`+`RecipeIngredient` (drop
  `RecipeBOM`), keep `TimeLog` (drop `StaffShift`), migrate data, one source for
  both engines.
- **WU-10** Kitchen print reliability: retry with backoff, `printAttempts`,
  `FAILED` + visible alert, KDS as fallback of record, printer heartbeat.
- **WU-11** Unify order state: one state machine, collapse redundant enum values.

## Phase 4 — Structure and quality 🟡

- **WU-12** Collapse to one codebase (executes D-1).
- **WU-13** Integration tests against a real test database; delete self-mocking tests.
- **WU-14** Secrets and configuration.
- **WU-15** PRD corrections (screen count, PIN literals, "2:28 AM" artifact, freezer
  range wording, M3 vs M10 override rule, honest module status).

## Phase 5 — Improvements (post-launch)

Waste logging, per-product reorder thresholds, KDS bump-back, cash drawer
reconciliation, order void/modify, GDPR DPA + retention, structured logging and
error tracking, DB backup and restore drill.

## Sequencing

| Phase | Work units | Est. | Gate |
|---|---|---|---|
| 0 | D-1, D-2 | 0.5d | Decisions written down |
| 1 | WU-1 → WU-4 | 5–7d | No demo before this closes |
| 2 | WU-5, WU-6 | 2–3d | No go-live before this closes |
| 3 | WU-7 → WU-11 | 6–9d | Feature parity with the PRD |
| 4 | WU-12 → WU-15 | 3–4d | Maintainable handover |
| 5 | Backlog | — | Post-launch |

**Rough total to an honest "complete": 17–24 working days.**

*Condensed copy of plan v1.0 for the repository. The full text with acceptance
criteria is the author's master copy.*

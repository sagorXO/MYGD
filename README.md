# MY GERMAN DÖNER — staff systems (online version)

Oliver's priorities for the Emba store, and nothing else:

1. **Screen ads** — managers upload images and videos at `/admin/ads`; each TV plays its own playlist at `/signage/ads?screen=N` and keeps playing offline.
2. **Shift checklists** — Oliver's station checklists on a shared tablet at `/staff/checklists`: PIN identity, temperatures with corrective actions, Shift Leader sign-off, stock count.
3. **Order time target** — not built yet. It waits for decisions and for DM's joint test. The DM contract and plan are in `docs/integrations/mygod/` and `docs/superpowers/plans/`.

The full system (POS, kiosk work, menu boards, inventory and more) stays on the branch `claude/mygd-three-priorities-55562e`.

## Put it online

Follow **[deploy/README.md](deploy/README.md)**.

## Work on it locally

```bash
cp .env.example .env    # then fill in the values
npm ci
npx prisma migrate deploy
npm run bootstrap:production
npm run checklists:load
npm run user:create -- --username you --role STORE_MANAGER
npm run dev
```

Checks: `npm run typecheck`, `npm test`, `npm run build`.

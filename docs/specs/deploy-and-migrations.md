# Deploy & database migrations

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `railway.json`, `.nvmrc`, `package.json`, `scripts/migrate.mjs`, `db/schema.sql`, `lib/db.ts`

## Summary

How Traxn deploys and how the database is migrated. Deploys go via GitHub; the
schema and seeds are applied automatically on every deploy, so no CLI access is
required to operate the database.

## Goals / Non-goals

- **Goals:** deterministic builds; zero-CLI deploys and migrations; safe,
  idempotent schema evolution; graceful behaviour without a database.
- **Non-goals:** a heavyweight migration framework (e.g. Prisma/Knex migrations).

## Behaviour

- **Deploy:** push to `main` → Railway rebuilds and redeploys. `railway.json` pins
  the build (`npm run build`), start command, and a `/` healthcheck; Node is pinned
  via `.nvmrc` + `package.json` `engines` (22.x).
- **Migrate on start:** start command is `node scripts/migrate.mjs && npm start`.
  Migrations run at **runtime** (where `DATABASE_URL` and the Postgres private
  network are reachable), not at build time.
- **`scripts/migrate.mjs`** (idempotent, boot-safe):
  1. applies `db/schema.sql` (`CREATE TABLE/INDEX IF NOT EXISTS`);
  2. runs guarded one-time column migrations (e.g. `badge` → `status`/`spots`;
     product text attrs → reference-option FKs) — each guarded on the old column
     still existing, so they're no-ops on fresh DBs and re-runs;
  3. seeds: admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (only if absent), default
     deal terms, default reference options, and the Frockd product — each only when
     its table is empty, so admin edits are never clobbered.
  - With no `DATABASE_URL` it warns and exits 0, so the app still boots (log-only).
- **`lib/db.ts`** — single shared `pg` pool; returns `null` if `DATABASE_URL` is
  unset so callers can degrade.

## One-time setup (Railway dashboard, no CLI)

1. New Project → Deploy from GitHub repo → `ashera/stake`.
2. Add a Postgres database (injects `DATABASE_URL`).
3. Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in the service Variables (seeds the first
   admin on next deploy; can be removed afterward).
4. Settings → Networking → Generate Domain (and add the custom domain).

## Schema-change process

Edit `db/schema.sql` with idempotent statements (`... IF NOT EXISTS`). For changes
that can't be expressed idempotently in the schema file (column splits, type
changes, data backfills), add a **guarded block** to `scripts/migrate.mjs` (check
`information_schema` / a sentinel column, transform, then drop). Push to deploy.

## Decisions & rationale

- **Deploy via GitHub, not `railway up`** — the operator can't run Railway CLI
  commands; pushing to `main` is the deploy path.
- **Migrate at start, not build** — Railway's build env can't reach the Postgres
  private network; runtime can.
- **Idempotent + guarded migrations, seed-only-if-empty** — safe to run on every
  boot without data loss or clobbering admin edits.

## Open questions / risks

- DB migrations can't be tested locally (no Postgres in dev); first real run is the
  Railway deploy — watch deploy logs for the `[migrate] …` lines.
- A genuinely failing migration exits non-zero and blocks boot (Railway retries) —
  intended (fail loud rather than serve a half-migrated DB).

# Events & logging

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/events.ts`, `app/admin/events/page.tsx`, `scripts/migrate.mjs`, and callers (`lib/email.ts`, `app/api/deals/route.ts`, `app/api/auth/login/route.ts`, `app/verify-email/route.ts`), `db/schema.sql`

## Summary

A lightweight in-app activity log. App-level events (emails, deals, sign-ins,
deploy migrations) are written to an `events` table and viewed at `/admin/events`
— so the things worth watching are visible in the dashboard without the Railway
CLI or log viewer.

## Goals / Non-goals

- **Goals:** durable, in-app visibility of key events; especially "did the
  verification email send / was it skipped?"; survives restarts (unlike stdout
  retention).
- **Non-goals:** full structured logging/tracing, log shipping/drains, request
  logs, retention/rotation policy (table grows; prune later if needed).

## Data model

`events` — `id, level (info|warn|error), type (dotted, e.g. email.sent), message,
meta (jsonb, nullable), created_at`.

## Behaviour

- **`logEvent({ type, message, level?, meta? })`** (`lib/events.ts`) — echoes to
  stdout (so Railway logs keep it) and, if a DB is configured, inserts a row.
  Best-effort: it never throws, so logging can't break the calling request.
- **`getEvents(limit=200)`** powers the admin view (newest first).
- **Instrumented:** `email.sent` / `email.skipped` (no API key) / `email.failed`
  (in `lib/email.ts`); `user.created` + `deal.submitted` (`/api/deals`);
  `email.verified` (`/verify-email`); `auth.login` (login).
- **Migrations:** `scripts/migrate.mjs` writes `migrate.*` events (schema, seeds,
  data conversions, completion, and `migrate.failed` on error) via its own pg
  client, so each deploy's migration steps show up in `/admin/events`.

## Decisions & rationale

- **DB table, not the Railway API.** The app can't read its own stdout, and
  pulling logs from Railway's API would need a stored token + coupling. Logging
  what we care about to our own table is simpler, durable, and fully owned.
- **Best-effort, never blocks** — a logging failure must not fail a user action.

## Open questions / risks

- No retention/rotation yet — fine at MVP volume; add pruning if it grows.
- Captures app events only (not arbitrary stdout); deeper logs still live in the
  Railway dashboard.

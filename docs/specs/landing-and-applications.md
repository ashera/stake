# Landing page & applications

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `app/page.tsx`, `app/ApplyForm.tsx`, `app/api/apply/route.ts`, `app/globals.css`, `db/schema.sql`

## Summary

The public, single-page landing site for Traxn — the v0 concierge MVP. Its only
job is to test the make-or-break assumption (will the right marketers respond?) by
pitching live opportunities and capturing applications. A human runs matching
behind the curtain; there is no public account system.

## Goals / Non-goals

- **Goals:** explain the rev-share offer; show live opportunities and deal terms;
  capture marketer applications with low friction.
- **Non-goals:** public signup, two-sided matching, messaging, payments — all
  deliberately deferred until demand is proven.

## Data model

`applications` — one row per submitted application:
`id, name, email, link, proof, niche, revshare, opportunity (default 'frockd'),
created_at`.

## Behaviour

- Server component (`app/page.tsx`) renders nav, pitch, deal terms (see
  [deal-terms](./deal-terms.md)), live products (see [products](./products.md)),
  and the application form.
- Nav brand links home; shows **Log in** when logged out, or the signed-in user's
  email (linked to `/admin` for admins) — resolved server-side, so no flash.
- `ApplyForm` (client) POSTs to `/api/apply`; shows an inline success state.
- The page renders dynamically (it reads the session + DB).

## API / Interfaces

- `POST /api/apply` — body `{ name, email, link?, proof?, niche?, revshare? }`.
  `name` + `email` required (422 otherwise). Inserts into `applications`.
  **Degrades gracefully:** with no `DATABASE_URL` it logs the lead to the server
  console and returns `{ ok: true, persisted: false }` instead of failing.

## Decisions & rationale

- **Concierge MVP, not a platform.** Cheap build aimed at the scariest assumption
  (do marketers respond?), with a human matching behind the scenes.
- **No public registration** — kept off until marketers bite (see
  [admin-auth-and-users](./admin-auth-and-users.md)).
- **Degrade without a DB** so the form never loses a lead in local/preview.

## Open questions / risks

- Cold-start: seeding the scarce marketer side is the real test this page exists
  to run. Watch application rate and quality.

# Landing page & applications

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `app/page.tsx`, `app/how-it-works/page.tsx`, `app/SiteNav.tsx`, `app/SiteFooter.tsx`, `app/ProductCard.tsx`, `app/ApplyForm.tsx`, `app/api/apply/route.ts`, `app/globals.css`, `db/schema.sql`

## Summary

The public site for Traxn — the v0 concierge MVP. Its only job is to test the
make-or-break assumption (will the right marketers respond?) by pitching live
opportunities and capturing applications. A human runs matching behind the
curtain; there is no public account system.

Two pages, kept deliberately short:

- **Home (`/`)** — tight: hero → the single **featured** opportunity → apply form.
- **`/how-it-works`** — the explanatory content: for-you/not-for-you, the three
  steps, the deal-terms box, the *full* list of opportunities, and an apply form.

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

- **Shared chrome:** `SiteNav` (server component; resolves login state itself) and
  `SiteFooter` are used by both pages. `ProductCard` renders an opportunity card on
  both. Nav brand links home; shows **Log in** when logged out, or the signed-in
  user's email (linked to `/admin` for admins) — resolved server-side, so no flash.
- **Home** uses `getFeaturedProduct()` for the one featured card and links to
  `/how-it-works` ("How it works" + "See how it works & every opening").
- **`/how-it-works`** uses `getDealTerms()` (see [deal-terms](./deal-terms.md)) and
  `getPublishedProducts()` (see [products](./products.md)) for the full list.
- `ApplyForm` (client) POSTs to `/api/apply`; shows an inline success state. It
  appears on both pages (the conversion goal stays reachable from home).
- Both pages render dynamically (they read the session + DB).

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
- **Short home, explanation one click away.** The home was too long; the
  for/not-for strip, the three steps, the deal box, and the full product list moved
  to `/how-it-works`. Home keeps only hero + one featured product + apply, so
  there's minimal below-the-fold.
- **Apply form stays on home** (not just `/how-it-works`) — it's the conversion
  goal; burying it a click away would hurt the demand test.

## Open questions / risks

- Cold-start: seeding the scarce marketer side is the real test this page exists
  to run. Watch application rate and quality.

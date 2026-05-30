# Landing page & applications

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `app/page.tsx`, `app/how-it-works/page.tsx`, `app/SiteNav.tsx`, `app/SiteFooter.tsx`, `app/ProductCard.tsx`, `app/globals.css`

> **Apply flow moved to the wizard.** The old generic form + `applications` table
> are retired; applying now happens per-product via the express-interest wizard —
> see [deals](./deals.md).

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

None of its own. Applicant data now lives on `deals` (+ `users`) — see
[deals](./deals.md).

## Behaviour

- **Shared chrome:** `SiteNav` (server component; resolves login state itself) and
  `SiteFooter` are used by both pages. `ProductCard` renders an opportunity card on
  both. Nav brand links home; shows **Log in** when logged out, or the signed-in
  user's email (linked to `/admin` for admins) — resolved server-side, so no flash.
- **Home** uses `getFeaturedProduct()` for the one featured card; its hero CTA and
  the card's **Express interest** button both go to `/express-interest/[id]`.
- **`/how-it-works`** uses `getDealTerms()` (see [deal-terms](./deal-terms.md)) and
  `getPublishedProducts()` (see [products](./products.md)) for the full list, each
  card carrying its own Express-interest button.
- Applying is the wizard (see [deals](./deals.md)) — no inline form on these pages.
- Both pages render dynamically (they read the session + DB).

## Decisions & rationale

- **Concierge MVP, not a platform.** Cheap build aimed at the scariest assumption
  (do marketers respond?), with a human matching behind the scenes.
- **No public registration** — kept off until marketers bite (see
  [admin-auth-and-users](./admin-auth-and-users.md)).
- **Short home, explanation one click away.** The home was too long; the
  for/not-for strip, the three steps, the deal box, and the full product list moved
  to `/how-it-works`. Home keeps only hero + one featured product, so there's
  minimal below-the-fold.
- **Per-product apply (the wizard) replaced the generic form.** Interest is now
  tied to a specific product from the start (see [deals](./deals.md)); the CTA is
  the product's Express-interest button.

## Open questions / risks

- Cold-start: seeding the scarce marketer side is the real test this page exists
  to run. Watch application rate and quality.

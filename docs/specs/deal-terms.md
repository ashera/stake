# Deal terms

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/deal.ts`, `app/admin/deal/*`, `app/api/admin/deal-terms/*`, `app/page.tsx`, `db/schema.sql`

## Summary

The parameters in the "shape of the deal" box on the landing page (share %,
baseline, term, etc.), stored in the database and managed by admins, so they can
change without a code deploy.

## Goals / Non-goals

- **Goals:** edit/add/reorder/delete the deal terms shown publicly; render them
  live; never break the page if the DB is unavailable.
- **Non-goals:** per-product or per-deal term variation (these are the global,
  illustrative terms); rich formatting.

## Data model

`deal_terms` — `id, label, value, suffix (nullable), position, created_at`.
`value` is the headline (e.g. `30`, `$0`, `None`); `suffix` is the small unit
(e.g. `%`, `mo`); `position` controls order.

## Behaviour

- **Landing:** `getDealTerms()` reads terms ordered by `position`; renders each as
  label + value(+suffix). Falls back to `DEFAULT_DEAL_TERMS` (in `lib/deal.ts`) if
  there's no DB, the table is empty, or the query errors.
- **Admin (`/admin/deal`):** local-state manager — edit label/value/suffix inline,
  add, delete, reorder (↑/↓). The public page reads fresh from the DB, so no server
  re-render is needed in the admin UI.
- **Seed:** default terms seeded on first deploy only when the table is empty.

## API / Interfaces

- `POST /api/admin/deal-terms` — create `{ label, value, suffix? }` (appended).
- `PATCH /api/admin/deal-terms` — reorder `{ order: id[] }`.
- `PATCH /api/admin/deal-terms/[id]` — update `{ label, value, suffix }`.
- `DELETE /api/admin/deal-terms/[id]`.
- Page: `/admin/deal`. All admin APIs require `getAdmin()`.

## Decisions & rationale

- **DB-backed with a static fallback** — admin-editable without redeploys, but the
  landing page is resilient to a missing/empty DB.
- **Generic label/value/suffix rows** (not fixed columns) — flexible enough to
  add/rename terms without schema changes.

## Open questions / risks

- The seeded numbers are illustrative; confirm against the real term sheet before
  putting them in front of a marketer.

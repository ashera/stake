# Products

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/products.ts`, `lib/badge.ts`, `app/admin/products/*`, `app/api/admin/products/*`, `app/page.tsx`, `db/schema.sql`

## Summary

The live opportunities ("products") pitched to marketers on the landing page,
stored in the database and managed by admins. Only published products appear
publicly.

## Goals / Non-goals

- **Goals:** add/edit/reorder/delete products; draft vs published; render published
  products on the landing page with a fallback.
- **Non-goals:** rich-text/markdown descriptions (plain paragraphs only); media
  uploads; per-product application forms.

## Data model

`products` — `id, name, category, status, spots, description, stage_id,
mandate_id, lever_id, deal_id, published, position, created_at`.

- `status` (text, e.g. "Open") + `spots` (int) combine into the card pill.
- `description` may hold multiple paragraphs separated by a blank line.
- `stage_id` / `mandate_id` / `lever_id` / `deal_id` are FKs into
  `reference_options` (`ON DELETE SET NULL`) — see [reference-data](./reference-data.md).

## Behaviour

- **Landing:** `getPublishedProducts()` joins the attribute FKs to resolve each to
  `{ label, description }`, returns only published rows ordered by `position`, and
  renders a card per product (pill via `formatBadge`, description paragraphs, and
  the four meta rows with the option description shown under each value). Section
  heading adapts for one vs many; hides entirely if none published. Falls back to
  `DEFAULT_PRODUCTS` if the DB is absent/unmigrated/empty.
- **Pill:** `formatBadge(status, spots)` → e.g. "Open · 2 spots" (auto-pluralised;
  0 spots shows just the status). Lives in `lib/badge.ts` (client-safe, **no DB
  import**) so the admin form can preview it without pulling `pg` into the client.
- **Admin (`/admin/products`):** local-state manager — add (creates an unpublished
  draft), edit fields, status dropdown, spots, attribute dropdowns (sourced from
  reference options, previewing the selected option's description), publish toggle,
  reorder, delete.
- **Seed:** the Frockd product seeded on first deploy only when the table is empty.

## API / Interfaces

- `POST /api/admin/products` — create an unpublished draft (appended).
- `PATCH /api/admin/products` — reorder `{ order: id[] }`.
- `PATCH /api/admin/products/[id]` — update all fields incl. `stageId/mandateId/
  leverId/dealId` (422 on a stale/unknown option id — FK violation).
- `DELETE /api/admin/products/[id]`.
- Page: `/admin/products`. All admin APIs require `getAdmin()`.

## Decisions & rationale

- **`published` flag** — new products start as drafts so a half-filled card never
  leaks publicly.
- **`status` + `spots` split** (was a single `badge` text) — structured data;
  status is a dropdown, recombined for display.
- **Attributes as reference-option FKs** — managed dropdowns with descriptions that
  travel with the option (see [reference-data](./reference-data.md)).
- **Client-safe `lib/badge.ts`** — avoids importing the DB-backed `lib/products`
  into the client bundle.

## Open questions / risks

- Inline emphasis (bold) in descriptions isn't supported (plain paragraphs); a
  markdown renderer would be a future add.

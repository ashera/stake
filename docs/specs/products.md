# Products

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/products.ts`, `lib/badge.ts`, `app/admin/products/*`, `app/api/admin/products/*`, `app/ProductCard.tsx`, `app/page.tsx`, `app/how-it-works/page.tsx`, `db/schema.sql`

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

`products` — `id, name, category, status, spots, description, builder, offered_on,
screenshot (bytea), screenshot_type, stage_id, mandate_id, lever_id, deal_id,
published, featured, position, created_at`.

- `status` (text, e.g. "Open") + `spots` (int) combine into the card pill.
- `description` may hold multiple paragraphs separated by a blank line.
- `builder` (nickname) and `offered_on` (date) show as a byline on the card.
- `screenshot` holds an uploaded image of a product page (≤2 MB) served by the
  app; admin reads never select the bytes — only `(screenshot IS NOT NULL)`.
- `stage_id` / `mandate_id` / `lever_id` / `deal_id` are FKs into
  `reference_options` (`ON DELETE SET NULL`) — see [reference-data](./reference-data.md).
- `featured` — exactly one product is featured; it's the single product shown on
  the home page (see [landing-and-applications](./landing-and-applications.md)).

## Behaviour

- **Rendering:** the shared `ProductCard` component renders a card (pill via
  `formatBadge`, description paragraphs, the four meta rows with descriptions, and
  an **Express interest →** button linking to `/express-interest/[id]` — the deal
  wizard, see [deals](./deals.md)). `getPublishedProductById()` loads a single
  published product for the wizard's context.
  - **Home** shows the single featured product via `getFeaturedProduct()`.
  - **`/how-it-works`** shows the full list via `getPublishedProducts()` — both
    join the attribute FKs to resolve `{ label, description }`, return only
    published rows by `position`, and fall back to `DEFAULT_PRODUCTS` if the DB is
    absent/unmigrated/empty. `getFeaturedProduct()` returns the featured published
    product (else the first published; null if products exist but none published).
- **Pill:** `formatBadge(status, spots)` → e.g. "Open · 2 spots" (auto-pluralised;
  0 spots shows just the status). Lives in `lib/badge.ts` (client-safe, **no DB
  import**) so the admin form can preview it without pulling `pg` into the client.
- **Admin (`/admin/products`):** local-state manager — add (creates an unpublished
  draft), edit fields, status dropdown, spots, attribute dropdowns (sourced from
  reference options, previewing the selected option's description), publish toggle,
  **featured toggle**, reorder, delete.
- **Featured is exclusive:** the `PATCH` runs in a transaction that clears
  `featured` on all other products when one is set, so there's always at most one.
- **Screenshot upload:** the admin form uploads via `POST
  /api/admin/products/[id]/screenshot` (multipart, image only, ≤2 MB), stored as
  bytea; `DELETE` clears it. It's served by `GET /api/products/[id]/screenshot`
  (public for published products; drafts admin-only). The card renders it as a
  top banner. (Builder/offered date are saved with the normal JSON `PATCH`.)
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
- **`featured` is exclusive (single)** — the home page shows exactly one product,
  so flagging a product featured clears it from the rest (enforced in the PATCH
  transaction). On deploy, if nothing is featured, migrate features the first
  product so the home page is never empty.

## Open questions / risks

- Inline emphasis (bold) in descriptions isn't supported (plain paragraphs); a
  markdown renderer would be a future add.

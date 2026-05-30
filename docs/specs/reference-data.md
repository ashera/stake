# Reference data

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/reference.ts`, `app/admin/reference/*`, `app/api/admin/reference/*`, `db/schema.sql`, `scripts/migrate.mjs`

## Summary

Managed dropdown options for the four product attributes (Stage, mandate, lever,
deal). Each option carries an explanatory **description** that renders under the
value on the product card, so visitors understand what the attribute means.

## Goals / Non-goals

- **Goals:** admin-managed option lists per attribute; an editable description per
  option shown on the public card; products reference options by id.
- **Non-goals:** arbitrary user-defined attribute categories (the four categories
  are fixed in code); per-product custom options.

## Data model

`reference_options` — `id, category, label, description, position, created_at`,
with `UNIQUE (category, label)`. `category` is one of `stage | mandate | lever |
deal` (defined by `REF_CATEGORIES` in `lib/reference.ts`). Products reference these
via `*_id` FKs with `ON DELETE SET NULL`.

## Behaviour

- **Admin (`/admin/reference`):** options grouped by category; per option edit
  label + description, reorder (↑/↓ within category), delete; add per category.
  Local-state manager.
- **Product form** consumes these as dropdowns and previews the selected option's
  description (see [products](./products.md)).
- **Landing card** shows the option's description under the attribute value.
- **Delete** clears the attribute on any product using it (`ON DELETE SET NULL`) —
  no broken cards.
- **Seed + migration:** default options (with descriptions) seeded on first deploy
  when empty. The one-time migration that converted products' old free-text
  attributes into FKs first turned every existing value into an option (no data
  loss), then linked the FKs.

## API / Interfaces

- `POST /api/admin/reference` — create `{ category, label, description? }`
  (validates category; 409 on duplicate label in category).
- `PATCH /api/admin/reference` — reorder `{ order: id[] }`.
- `PATCH /api/admin/reference/[id]` — update `{ label, description }` (409 on dup).
- `DELETE /api/admin/reference/[id]`.
- Page: `/admin/reference`. All admin APIs require `getAdmin()`.

## Decisions & rationale

- **Normalised (FK), not free text** — descriptions live with the option and a
  rename updates everywhere; deletion is handled cleanly via `ON DELETE SET NULL`.
- **Fixed categories in code** — the four attributes are a stable part of the card
  layout; no need for user-defined categories yet.
- **`UNIQUE (category, label)`** — prevents duplicate options and enables safe
  `ON CONFLICT DO NOTHING` seeding/backfill.

## Open questions / risks

- Seeded option descriptions are generic placeholder copy — review/reword them in
  `/admin/reference` to match how opportunities are actually described.

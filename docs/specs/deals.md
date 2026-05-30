# Deals

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/deals.ts`, `app/express-interest/[id]/*`, `app/deal/[id]/*`, `app/api/deals/route.ts`, `app/api/auth/set-password/route.ts`, `app/admin/page.tsx`, `app/admin/DealsManager.tsx`, `app/api/admin/deals/[id]/route.ts`, `db/schema.sql`

## Summary

A **deal** is the first-class entity linking a marketer (user) to a product. It's
created by the "express interest" wizard, which stores the applicant's responses
on the deal. It replaces the old generic application form.

## Goals / Non-goals

- **Goals:** capture interest per-product via a guided wizard; create a user from
  name + email (password optional); show the applicant a summary on their deal
  page; let admins triage deals by status.
- **Non-goals:** email verification, magic-link return, messaging/matching UI,
  payments. (Returning without a password isn't possible yet — known gap.)

## Data model

- `deals` — `id, user_id → users, product_id → products (ON DELETE SET NULL),
  link, proof, niche, revshare, note, status (default 'new'), created_at`,
  `UNIQUE (user_id, product_id)` (one deal per user+product; the wizard upserts).
- **Users changed** (see [admin-auth-and-users](./admin-auth-and-users.md)): gained
  a nullable `name`, and `password_hash` is now nullable so a marketer can be
  created passwordless.
- Statuses: `new | reviewing | matched | passed` (`DEAL_STATUSES` in `lib/deals.ts`).

## Behaviour

- **Trigger:** `ProductCard` shows an **Express interest →** button linking to
  `/express-interest/[productId]`. The home hero CTA points at the featured
  product's wizard.
- **Wizard** (`/express-interest/[id]`, client `ExpressInterestWizard`): four steps
  — *You* (name, email, optional password) → *Track record* (link, proof) → *Fit*
  (niche, rev-share, note) → *Review*. Submits to `POST /api/deals`. Signed-in
  users skip the identity fields.
- **`POST /api/deals`** resolves the user then upserts the deal:
  - Signed in → the deal is theirs.
  - Not signed in, new or **passwordless** email → create/reuse the user (set
    password + name if given) and **start a session**, so they land on their deal.
  - Not signed in, email belongs to a **password-protected** account → 409
    `requiresLogin` (don't write to someone's account anonymously); the wizard
    prompts them to log in.
- **Deal page** (`/deal/[id]`): owner (via session) or admin only, else `notFound`/
  redirect to login. Shows the submission summary + status. If the owner has no
  password, a **Set a password** prompt (`SetPasswordForm` → `POST
  /api/auth/set-password`) lets them secure the account to return later.
- **Admin** (`/admin`, the dashboard): `DealsManager` lists all deals, sets status
  inline, links to each deal page, and can delete.

## API / Interfaces

- `POST /api/deals` — `{ productId, name, email, password?, link, proof, niche,
  revshare, note }`. 422 invalid, 409 `requiresLogin`, 503 no DB, else `{ dealId }`.
- `POST /api/auth/set-password` — `{ password }` for the signed-in user.
- `PATCH /api/admin/deals/[id]` — `{ status }`; `DELETE` removes. Admin only.
- Pages: `/express-interest/[id]`, `/deal/[id]`, `/admin`.

## Decisions & rationale

- **First-class `deals`, not flat applications** — interest is now tied to a
  specific product and a reusable user, which sets up real matching later.
- **Password optional, encouraged** — lowest friction to capture a lead; a session
  lets passwordless users see their deal immediately; the deal page nudges them to
  set a password to return ("convince them later").
- **No anonymous writes to credentialed accounts** — the 409/`requiresLogin` guard
  avoids someone editing another account's deal by typing its email. Email is
  still unverified (known v0 gap).

## Open questions / risks

- **Return path for passwordless users** is same-browser-only until they set a
  password (no email verification / magic link yet).
- DB-dependent flows (wizard submit, deal page, status updates) can't be tested
  without Postgres; first real run is the Railway deploy.

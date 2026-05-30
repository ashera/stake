# Admin auth & user management

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/auth.ts`, `app/login/*`, `app/api/auth/*`, `app/admin/layout.tsx`, `app/admin/users/*`, `app/api/admin/users/*`, `scripts/create-admin.mjs`, `scripts/_password.mjs`

## Summary

A lean, roll-our-own authentication layer gating the `/admin` concierge
dashboard. Admin-only accounts (no public signup yet); admins can manage other
users.

## Goals / Non-goals

- **Goals:** secure admin login; session management; create/manage users; flag
  users as admin to gate admin features.
- **Non-goals:** public self-serve registration, OAuth/social login, password
  reset emails, MFA. (Admin-only by choice; can open later without rework.)

## Data model

- `users` — `id, email (unique), password_hash, is_admin, created_at`.
  `password_hash` format: `scrypt$<saltHex>$<hashHex>`.
- `sessions` — `id (= sha256 of the cookie token), user_id, expires_at, created_at`.

## Behaviour

- **Passwords:** scrypt (Node built-in) hash/verify in `lib/auth.ts`.
- **Sessions:** a random 32-byte token lives in an httpOnly/SameSite=lax/secure
  cookie (`stake_session`); only its SHA-256 is stored, so a DB leak can't be
  replayed. 30-day expiry.
- **Protection:** `app/admin/layout.tsx` calls `getCurrentUser()` and redirects
  non-admins to `/login`. Every admin API re-checks `getAdmin()` (defence in depth).
- **User management** (`/admin/users`): list, add user (email + password +
  admin flag), promote/demote, delete. Guardrails: can't demote or delete
  yourself, and can't remove the last admin.
- **Bootstrapping:** `npm run create-admin -- <email> <password>` (manual), or the
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` env seed on deploy (see
  [deploy-and-migrations](./deploy-and-migrations.md)).
- **Without a DB:** login returns 503 and `getCurrentUser()` returns null, so
  `/admin` simply redirects to `/login` — no crash.

## API / Interfaces

- `POST /api/auth/login` — `{ email, password }`; sets session cookie. Returns the
  **same** error for unknown email vs wrong password (non-enumerating).
- `POST /api/auth/logout` — clears the session.
- `POST /api/admin/users` — create `{ email, password, isAdmin }` (409 on dup email).
- `PATCH /api/admin/users/[id]` — `{ isAdmin }` (blocks self-demote / last admin).
- `DELETE /api/admin/users/[id]` — (blocks self / last admin).
- Pages: `/login`, `/admin`, `/admin/users`.

## Decisions & rationale

- **Roll-our-own, not Auth.js/Clerk** — fits the minimal bespoke stack, no new
  framework, keeps user data in our Postgres (we own the trust layer).
- **scrypt, not bcrypt/argon2** — built into Node, no native module to compile, so
  it won't break the Railway/Nixpacks build.
- **Hash the session token in the DB** — a DB read never yields a usable token.
- **Admin-only accounts** — aligned with the v0 roadmap; public registration is
  deferred (see [landing-and-applications](./landing-and-applications.md)).

## Open questions / risks

- No session rotation on privilege change and no password-change UI yet — fine for
  an admin-only tool; revisit if public registration is ever enabled.

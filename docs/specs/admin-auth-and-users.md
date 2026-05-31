# Admin auth & user management

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/auth.ts`, `app/login/*`, `app/api/auth/*`, `app/admin/layout.tsx`, `app/admin/users/*`, `app/api/admin/users/*`, `scripts/create-admin.mjs`, `scripts/_password.mjs`

## Summary

A lean, roll-our-own authentication layer. Two kinds of users share one table:
**admins** (gate the `/admin` dashboard) and **marketer leads** created by the
express-interest wizard (see [deals](./deals.md)), who may be **passwordless**.

## Goals / Non-goals

- **Goals:** secure admin login; session management; admin user management;
  create lightweight (optionally passwordless) marketer users; let a user set a
  password later.
- **Non-goals:** OAuth/social login, password-reset emails, email verification,
  magic-link return, MFA.

## Data model

- `users` — `id, email (unique), name (nickname), first_name, family_name,
  password_hash (nullable), is_admin, email_verified_at (nullable), created_at`.
  `password_hash` format `scrypt$<saltHex>$<hashHex>`; **null** for passwordless
  leads. The name fields are all optional.
- `sessions` — `id (= sha256 of the cookie token), user_id, expires_at, created_at`.
- `email_verifications` — verification / magic-link tokens; see
  [email-verification](./email-verification.md).

## Behaviour

- **Passwords:** scrypt (Node built-in) hash/verify in `lib/auth.ts`. Passwordless
  accounts can't sign in via the password form (same non-enumerating error) — they
  use the magic link.
- **Rate limiting** (`lib/rateLimit.ts`, in-memory): login 10/IP + 5/email per
  15min; email endpoints throttled too (see [email-verification](./email-verification.md)).
- **Sessions:** a random 32-byte token lives in an httpOnly/SameSite=lax/secure
  cookie (`stake_session`); only its SHA-256 is stored, so a DB leak can't be
  replayed. 30-day expiry.
- **`getCurrentUser()`** returns `{ id, email, isAdmin, hasPassword, emailVerified }`
  (the last two drive the "set a password" and "verify your email" prompts).
- **Protection:** `app/admin/layout.tsx` calls `getCurrentUser()` and redirects
  non-admins to `/login`. Every admin API re-checks `getAdmin()` (defence in depth).
- **User management** (`/admin/users`): list, add user (email + password +
  admin flag), promote/demote, delete. Guardrails: can't demote or delete
  yourself, and can't remove the last admin.
- **Profile** (`/profile`): any signed-in user manages their own account — edit
  nickname + first/family name (all optional, `PATCH /api/profile`), set/change
  password (`SetPasswordForm`), see verification status (with resend), and sign out.
  `getCurrentUser` exposes a computed `displayName` (nickname → "First Family" →
  email) that the nav shows in place of the email. The nav links a marketer here
  (admins to `/admin`, with a Profile link in the admin nav).
- **Bootstrapping:** `npm run create-admin -- <email> <password>` (manual), or the
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` env seed on deploy (see
  [deploy-and-migrations](./deploy-and-migrations.md)).
- **Without a DB:** login returns 503 and `getCurrentUser()` returns null, so
  `/admin` simply redirects to `/login` — no crash.

## API / Interfaces

- `POST /api/auth/login` — `{ email, password }`; sets session cookie. Returns the
  **same** error for unknown email vs wrong password (non-enumerating).
- `POST /api/auth/logout` — clears the session.
- `POST /api/auth/set-password` — `{ password }` for the signed-in user (set or
  change; used by the profile page and the deal-page prompt).
- `PATCH /api/profile` — `{ name }` for the signed-in user.
- Email verification + magic-link endpoints (`/verify-email`, `/api/auth/magic-link`,
  `/api/auth/resend-verification`) — see [email-verification](./email-verification.md).
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
- **Passwordless marketer users** — created by the wizard from name + email to keep
  friction near zero; they get a session to view their deal and are encouraged to
  set a password to return. No anonymous writes to credentialed accounts (see
  [deals](./deals.md)).

## Open questions / risks

- Rate limiting is in-memory (per-instance) — swap for Redis/Postgres if we scale
  horizontally.
- No session rotation on privilege change.

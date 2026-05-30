# Email verification & magic-link sign-in

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/email.ts`, `lib/auth.ts`, `app/verify-email/route.ts`, `app/api/auth/magic-link/route.ts`, `app/api/auth/resend-verification/route.ts`, `app/VerifyBanner.tsx`, `app/login/MagicLinkForm.tsx`, `app/api/deals/route.ts`, `db/schema.sql`

## Summary

Confirms a lead actually controls the email they gave, and gives passwordless
users a way back in. The same emailed link both **verifies the address** and
**signs the user in** (so it doubles as a magic link). Verification is *soft* — we
don't block the apply flow on it.

## Goals / Non-goals

- **Goals:** confirm email ownership; let passwordless users return from any device
  via an emailed link; resend on demand; work without an email provider configured.
- **Non-goals:** hard gating features behind verification; bounce/complaint
  handling; multi-provider email; rate-limiting (basic, none yet).

## Data model

- `users.email_verified_at` — null until confirmed.
- `email_verifications` — `id (= sha256 of the token), user_id, expires_at,
  created_at`. Single-use, 48-hour TTL; only the hash is stored.

## Behaviour

- **Sending** (`lib/email.ts`): `sendEmail` posts to Resend's HTTP API when
  `RESEND_API_KEY` is set; otherwise it **logs the message/link to the console** so
  the flow works in dev / before setup. `EMAIL_FROM` sets the sender; `APP_URL`
  (or the request host) builds absolute links.
- **On deal submit** (`/api/deals`): for a new or unverified passwordless lead, a
  token is created and a verification email sent (best-effort — never blocks the
  deal).
- **Verify** (`GET /verify-email?token=`): valid token → mark verified, clear the
  user's tokens, **create a session**, redirect to `/deals?verified=1`. Invalid/
  expired → `/login?verify=invalid`.
- **Resend** (`POST /api/auth/resend-verification`): signed-in user; surfaced by
  `VerifyBanner` on the deal and `/deals` pages while unverified.
- **Magic link** (`POST /api/auth/magic-link`, `MagicLinkForm` on `/login`):
  request a sign-in link by email. Always responds ok (non-enumerating).

## Decisions & rationale

- **One link verifies *and* signs in** — closes the passwordless return gap without
  a separate login system; possession of the emailed link proves email control.
- **Console fallback when no provider** — consistent with the project's
  degrade-gracefully approach; lets us ship before domain/provider setup and lets
  the concierge relay a link manually if needed.
- **Soft verification** — keeps apply friction near zero; status is informational
  (shown in a banner) rather than a gate.
- **Resend, via fetch** — simplest provider for an indie Next.js app, no SDK.

## Open questions / risks

- **No rate limiting** on magic-link / resend — a known gap; add throttling before
  real volume.
- Verify link is a bearer credential (standard for magic links): single-use + short
  TTL mitigate, but anyone with the link can sign in as that user.
- Untestable locally without a DB + provider; first real run is the Railway deploy
  (watch for the `[email]` console lines if no key is set).

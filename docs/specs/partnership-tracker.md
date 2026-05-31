# Partnership tracker

- **Status:** Active
- **Last updated:** 2026-05-31
- **Code:** `lib/partnerships.ts`, `app/admin/partnerships/*`, `app/api/admin/partnerships/*`, `db/schema.sql`

## Summary

An admin tool (`/admin/partnerships`) for the GTM job that matters now: landing a
growth partner. It pairs a **per-channel playbook** (the recommended approach for
Indie Hackers, r/SaaS, r/marketing, growth communities, build-in-public X,
MicroConf) with a **prospects CRM** for the people being pursued. Goal anchored on
the 90-day target: one marketer truly engaged.

## Goals / Non-goals

- **Goals:** keep the recommended moves per platform visible and tickable; track
  prospects through a pipeline (status + next step).
- **Non-goals:** automated outreach, email/DM integration, analytics. It's a
  personal operating tool, not a sales automation platform.

## Data model

- `partnership_prospects` — `id, name, channel, link, status (default 'Identified'),
  next_step, created_at`.
- `partnership_checks` — `(channel, task)` PK; a row's presence = that playbook move
  is done. `task` is the move's index within the channel.
- `partnership_posts` — saved outreach posts/templates (`id, title, channel, body,
  position`); seeded with default drafts on first deploy (only when empty).
- Playbook content (channels, moves, ground rules, statuses) is **static** in
  `lib/partnerships.ts` (no DB import, so the client can use it).

## Behaviour

- **Playbook:** each channel shows its approach + a checklist of moves (with an
  x/total counter). Ticking a move toggles a `partnership_checks` row (optimistic).
- **Outreach posts:** editable templates (title, channel, body) with **Copy**, Save,
  Delete, and add. Seeded with ready-to-use drafts (IH story post, hand-picked DM,
  Reddit value-first approach, X build-in-public thread, growth-community intro).
- **Prospects:** add (name + channel + link), inline-edit **status** (dropdown) and
  **next step** (text, saved on blur), delete. Inline editing is intentional here —
  it's a working tool, unlike the read-only deals *record* list.
- All mutations are admin-guarded; new tables are created by the normal idempotent
  schema apply on deploy (no data migration).

## Decisions & rationale

- **Playbook is static content, not DB-managed** — it's the team's recommended
  approach, versioned with the code; only *progress* is persisted.
- **Inline editing for the CRM** — quick status/next-step updates are the point of
  a tracker (the deals list stays read-only because it's a record, not a worklist).

## Open questions / risks

- The channel list / moves are fixed in code; editing them is a code change (fine
  for now). If the playbook should be admin-editable later, move it to a table.

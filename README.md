# Stake (working name)

Concierge-MVP landing page for a rev-share marketplace pairing technical builders
with growth partners. This is **v0**: its only job is to test the make-or-break
assumption — *will the right marketers respond?* — by pitching one real, live
opportunity (Frockd.com.au) and capturing applications.

There is deliberately **no** login, two-sided matching, or payment flow yet.
A human runs the matching behind the curtain. Build the rest only after this page
proves marketers bite.

## Stack

- Next.js 14 (App Router) + TypeScript
- Postgres (via `pg`) — designed for Railway
- No CSS framework; bespoke styles in `app/globals.css`

## Project structure

```
app/
  layout.tsx          root layout + font links
  page.tsx            the landing page (server component)
  ApplyForm.tsx       the application form (client component)
  globals.css         all styling
  api/apply/route.ts  POST endpoint — saves an application to Postgres
lib/db.ts             shared Postgres pool (no-op if DATABASE_URL is unset)
lib/auth.ts           admin auth: scrypt hashing + session cookies
db/schema.sql         tables: applications, users, sessions
scripts/migrate.mjs       applies the schema + seeds an admin (runs on deploy)
scripts/create-admin.mjs  manually create/promote an admin
```

## Run locally

```bash
npm install
cp .env.example .env      # optional: add DATABASE_URL to persist applications
npm run dev               # http://localhost:3000
```

Without `DATABASE_URL`, the form still works — applications are logged to the
server console instead of saved. Add the connection string when you want them
stored.

## Database

```bash
# with DATABASE_URL set (locally or pointed at Railway Postgres):
npm run db:migrate        # applies the schema — idempotent, safe to re-run
```

On Railway this runs **automatically on every deploy** (see below), so you don't
normally call it by hand.

View applications:

```sql
SELECT created_at, name, email, niche, revshare FROM applications ORDER BY created_at DESC;
```

## Deploy to Railway

Deploys go **via GitHub**: Railway watches this repo and redeploys on every push
to `main`. Build/start commands and the healthcheck are pinned in `railway.json`,
and the Node version in `.nvmrc` / `package.json` `engines`, so builds are
deterministic.

**No CLI needed** — schema migrations and the first admin are applied on deploy.
The start command in `railway.json` is `node scripts/migrate.mjs && npm start`,
so every deploy applies the schema (idempotent) before the server boots.

### One-time setup (all in the Railway dashboard)

1. **New Project → Deploy from GitHub repo** → pick `ashera/stake`.
2. Add a **Postgres** database to the project; Railway injects `DATABASE_URL`
   into the service automatically.
3. In the service's **Variables** tab, set `ADMIN_EMAIL` and `ADMIN_PASSWORD`
   (min 8 chars). The next deploy seeds that admin — created only if it doesn't
   already exist, so it's safe on every deploy. Sign in at `/login`, then you can
   remove the two vars.
4. **Settings → Networking → Generate Domain** to get a public URL.

Railway reads `railway.json` for the build (`npm run build`) and start commands —
no autodetect guessing.

### Ongoing deploys

```bash
git push origin main     # Railway builds, migrates, and deploys automatically
```

Schema changes ship the same way: edit `db/schema.sql` (keep statements
idempotent — `CREATE TABLE/INDEX IF NOT EXISTS`, `ALTER TABLE ... IF NOT EXISTS`)
and push. The migrate step applies them on the next deploy.

## Push to a new GitHub repo

With the GitHub CLI:

```bash
git init
git add .
git commit -m "Stake v0: concierge landing page"
gh repo create stake --private --source=. --push
```

Or manually — create an empty repo in the GitHub UI, then:

```bash
git init
git add .
git commit -m "Stake v0: concierge landing page"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## Admin login & user management

The site has an admin-only login (no public signup yet) gating a concierge
dashboard at `/admin` — view applications and manage users. Auth is rolled in
`lib/auth.ts`: scrypt password hashing (Node built-in, no native dependency) and
random session tokens stored as SHA-256 in the `sessions` table.

### Create the first admin

**On Railway:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the Variables tab — the
deploy seeds that admin automatically (see "Deploy to Railway" above). No CLI.

**Locally / manually** (e.g. to add another admin or reset a password) with
`DATABASE_URL` set:

```bash
npm run create-admin -- you@email.com "a-strong-password"
```

Re-running `create-admin` with an existing email resets that user's password and
re-grants admin. (The deploy-time env seed, by contrast, never overwrites an
existing account.) Sign in at `/login`; the dashboard lives at `/admin`.

From **Admin → Users** you can add users, flag/unflag admin, and delete users.
Guardrails: you can't demote or delete yourself, or remove the last admin.

### Deal terms

**Admin → Deal terms** edits the parameters in the "shape of the deal" box on the
landing page (share %, baseline, term, etc.) — add/edit/reorder/delete. They're
stored in the `deal_terms` table and seeded with defaults on first deploy. The
landing page reads them live, falling back to `DEFAULT_DEAL_TERMS` in
`lib/deal.ts` if the database is empty or unreachable.

## Notes

- The deal terms shown (30% / $0 baseline / 24 months) are illustrative — match
  them to the term sheet before this goes in front of a real marketer.
- "Stake" is a placeholder name; change it in `layout.tsx`, `page.tsx`, and here.

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
db/schema.sql         the single `applications` table
scripts/db-init.mjs   applies schema.sql to your database
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
# point at your Railway Postgres, then:
npm run db:init           # creates the applications table
```

View applications:

```sql
SELECT created_at, name, email, niche, revshare FROM applications ORDER BY created_at DESC;
```

## Deploy to Railway

Deploys go **via GitHub**: Railway watches this repo and redeploys on every push
to `main`. Build/start commands and the healthcheck are pinned in `railway.json`,
and the Node version in `.nvmrc` / `package.json` `engines`, so builds are
deterministic.

### One-time setup

1. In Railway: **New Project → Deploy from GitHub repo** → pick `ashera/stake`.
2. Add a **Postgres** database to the project; Railway injects `DATABASE_URL`
   into the service automatically.
3. Initialise the schema once (see below).
4. **Settings → Networking → Generate Domain** to get a public URL.

Railway reads `railway.json` for the build (`npm run build`) and start
(`npm start`) commands — no autodetect guessing.

### Initialise the database (once)

The Railway CLI can run the init script against the live database with the
project's env vars injected:

```bash
railway login            # opens a browser once
railway link             # select the project/service
railway run npm run db:init
```

(Or run `npm run db:init` locally with `DATABASE_URL` set to the value from the
Railway Postgres → **Connect** tab.)

### Ongoing deploys

```bash
git push origin main     # Railway builds and deploys automatically
```

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

After the schema is applied (`db:init`), seed an admin:

```bash
npm run create-admin -- you@email.com "a-strong-password"
# on Railway:
railway run npm run create-admin -- you@email.com "a-strong-password"
```

Re-running with an existing email resets that user's password and re-grants
admin. Then sign in at `/login`; the dashboard lives at `/admin`.

From **Admin → Users** you can add users, flag/unflag admin, and delete users.
Guardrails: you can't demote or delete yourself, or remove the last admin.

## Notes

- The deal terms shown (30% / $0 baseline / 24 months) are illustrative — match
  them to the term sheet before this goes in front of a real marketer.
- "Stake" is a placeholder name; change it in `layout.tsx`, `page.tsx`, and here.

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

1. Push this repo to GitHub (below).
2. In Railway: **New Project → Deploy from GitHub repo** → pick this repo.
3. Add a **Postgres** plugin; Railway injects `DATABASE_URL`.
4. Run `npm run db:init` once (Railway shell, or locally against the same URL).
5. Railway auto-detects Next.js and runs `npm run build` / `npm start`.

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

## Notes

- The deal terms shown (30% / $0 baseline / 24 months) are illustrative — match
  them to the term sheet before this goes in front of a real marketer.
- "Stake" is a placeholder name; change it in `layout.tsx`, `page.tsx`, and here.

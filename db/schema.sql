-- Stake — concierge MVP schema
-- One table: marketer applications captured from the landing page.
-- Run against your Railway Postgres:  psql "$DATABASE_URL" -f db/schema.sql
--   (or use `npm run db:init` which executes this file for you)

CREATE TABLE IF NOT EXISTS applications (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  link        TEXT,
  proof       TEXT,                 -- "one product you grew + what changed"
  niche       TEXT,                 -- sharpest channel / niche
  revshare    TEXT,                 -- would they take rev-share over cash
  opportunity TEXT        DEFAULT 'frockd',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_created_at_idx ON applications (created_at DESC);

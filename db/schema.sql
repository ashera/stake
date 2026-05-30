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

-- Users — admin-only accounts for now (no public signup). Seed the first one
-- with `npm run create-admin`. `is_admin` gates the /admin concierge dashboard.
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,   -- scrypt: "scrypt$<saltHex>$<hashHex>"
  is_admin      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions — one row per active login. `id` is the SHA-256 of the random token
-- held in the cookie, so a leaked DB can't be replayed as a live session.
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT        PRIMARY KEY,   -- sha256(cookie token)
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

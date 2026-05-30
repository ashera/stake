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

-- Deal terms — the parameters shown in the "shape of the deal" box on the
-- landing page. Editable from /admin/deal; seeded with defaults on first deploy.
-- `value` is the headline (e.g. "30", "$0", "None"); `suffix` is the small unit
-- after it (e.g. "%", "mo"). `position` controls display order.
CREATE TABLE IF NOT EXISTS deal_terms (
  id         BIGSERIAL PRIMARY KEY,
  label      TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  suffix     TEXT,
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_terms_position_idx ON deal_terms (position, id);

-- Reference options — the managed dropdown values for a product's Stage /
-- mandate / lever / deal attributes. `category` is one of stage|mandate|lever|deal.
-- `description` explains what the option means and is shown under the value on
-- the product card. Managed from /admin/reference.
CREATE TABLE IF NOT EXISTS reference_options (
  id          BIGSERIAL   PRIMARY KEY,
  category    TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, label)
);

CREATE INDEX IF NOT EXISTS reference_options_category_idx
  ON reference_options (category, position, id);

-- Products — the live opportunities pitched to marketers on the landing page.
-- Managed from /admin/products; only `published` rows show publicly. Seeded with
-- the Frockd pilot on first deploy. `description` may hold multiple paragraphs
-- separated by a blank line. The Stage / mandate / lever / deal attributes are
-- foreign keys into reference_options (ON DELETE SET NULL so removing an option
-- just clears it from products).
CREATE TABLE IF NOT EXISTS products (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  category     TEXT,
  status       TEXT        NOT NULL DEFAULT 'Open',
  spots        INTEGER     NOT NULL DEFAULT 1,
  description  TEXT,
  stage_id     BIGINT      REFERENCES reference_options (id) ON DELETE SET NULL,
  mandate_id   BIGINT      REFERENCES reference_options (id) ON DELETE SET NULL,
  lever_id     BIGINT      REFERENCES reference_options (id) ON DELETE SET NULL,
  deal_id      BIGINT      REFERENCES reference_options (id) ON DELETE SET NULL,
  published    BOOLEAN     NOT NULL DEFAULT false,
  position     INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_position_idx ON products (position, id);

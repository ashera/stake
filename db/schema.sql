-- Traxn — schema. Applied idempotently on every deploy by scripts/migrate.mjs
-- (CREATE ... IF NOT EXISTS; column/data changes are handled in that script).

-- Users — admins and marketer leads. Marketer users are created by the
-- "express interest" wizard from just a name + email and may be passwordless
-- (encouraged to set a password later). `is_admin` gates the /admin dashboard.
CREATE TABLE IF NOT EXISTS users (
  id                BIGSERIAL PRIMARY KEY,
  email             TEXT        NOT NULL UNIQUE,
  name              TEXT,                   -- nickname / what they go by
  first_name        TEXT,
  family_name       TEXT,
  bio               TEXT,                   -- builder bio (shown on /builder/[id])
  password_hash     TEXT,                   -- scrypt; nullable (passwordless leads)
  is_admin          BOOLEAN     NOT NULL DEFAULT false,
  is_builder        BOOLEAN     NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,            -- null until the email is confirmed
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email verification / magic-link tokens. `id` is the SHA-256 of the token sent
-- in the email; single-use and short-lived.
CREATE TABLE IF NOT EXISTS email_verifications (
  id         TEXT        PRIMARY KEY,   -- sha256(token)
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verifications_user_idx ON email_verifications (user_id);

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
  builder_id   BIGINT      REFERENCES users (id) ON DELETE SET NULL,  -- the builder (a user)
  offered_on   DATE,                  -- when the opportunity was offered
  live_url     TEXT,                  -- the product's live URL (optional)
  screenshot      BYTEA,              -- a screenshot of a product page
  screenshot_type TEXT,               -- its mime type, e.g. image/png
  published    BOOLEAN     NOT NULL DEFAULT false,
  featured     BOOLEAN     NOT NULL DEFAULT false,
  position     INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_position_idx ON products (position, id);

-- Deals — the first-class entity linking a marketer (user) to a product. Created
-- by the "express interest" wizard, which stores the applicant's responses here.
-- One deal per (user, product). `status` tracks the lifecycle (default 'new').
CREATE TABLE IF NOT EXISTS deals (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id BIGINT      REFERENCES products (id) ON DELETE SET NULL,
  link       TEXT,
  proof      TEXT,
  niche      TEXT,
  revshare   TEXT,
  note       TEXT,
  status     TEXT        NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS deals_user_idx ON deals (user_id);
CREATE INDEX IF NOT EXISTS deals_product_idx ON deals (product_id);
CREATE INDEX IF NOT EXISTS deals_created_idx ON deals (created_at DESC);

-- Events — an in-app activity/audit log (emails, deals, sign-ins, deploy
-- migrations). Written best-effort alongside stdout; viewed at /admin/events.
CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL   PRIMARY KEY,
  level      TEXT        NOT NULL DEFAULT 'info',  -- info | warn | error
  type       TEXT        NOT NULL,                 -- dotted name, e.g. email.sent
  message    TEXT        NOT NULL,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at DESC);

-- Partnership tracker — outreach CRM for finding growth partners, plus checklist
-- progress against the per-channel playbook (static content in lib/partnerships.ts).
CREATE TABLE IF NOT EXISTS partnership_prospects (
  id         BIGSERIAL   PRIMARY KEY,
  name       TEXT        NOT NULL,
  channel    TEXT,
  link       TEXT,
  status     TEXT        NOT NULL DEFAULT 'Identified',
  next_step  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per completed checklist move; presence = done. `task` is the move's index.
CREATE TABLE IF NOT EXISTS partnership_checks (
  channel    TEXT        NOT NULL,
  task       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel, task)
);

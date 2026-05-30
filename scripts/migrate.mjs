// Apply the schema (and optionally seed the first admin) against DATABASE_URL.
// Runs automatically on every Railway deploy via the start command in
// railway.json, so no CLI access is needed to migrate the database.
//
// The schema is idempotent (CREATE TABLE IF NOT EXISTS), and the admin seed only
// creates the user when it's absent — both are safe to run on every boot.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { hashPassword } from "./_password.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// No database configured — let the app boot anyway (it degrades to log-only).
if (!process.env.DATABASE_URL) {
  console.warn("[migrate] DATABASE_URL not set — skipping (app will run without a database).");
  process.exit(0);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();

  // 1. Schema.
  const sql = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
  await client.query(sql);
  console.log("[migrate] Schema applied.");

  // 1a. One-time: split the old products.badge ("Open · 1 spot") into the
  //     structured status + spots columns, then drop badge. Guarded on the badge
  //     column still existing, so it's a no-op on fresh DBs and on re-runs.
  const { rows: hasBadge } = await client.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'badge'`
  );
  if (hasBadge.length > 0) {
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Open'`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS spots INTEGER NOT NULL DEFAULT 1`);
    await client.query(`
      UPDATE products SET
        status = COALESCE(NULLIF(TRIM(split_part(badge, '·', 1)), ''), 'Open'),
        spots  = COALESCE(NULLIF(regexp_replace(split_part(badge, '·', 2), '[^0-9]', '', 'g'), '')::int, 1)
    `);
    await client.query(`ALTER TABLE products DROP COLUMN badge`);
    console.log("[migrate] Split products.badge into status + spots.");
  }

  // 1b. Default reference options — only when empty. These are the managed
  //     dropdown values + descriptions for the product attributes. Keep in sync
  //     with DEFAULT_REFERENCE_OPTIONS in lib/reference.ts.
  const { rows: rc } = await client.query(`SELECT COUNT(*)::int AS n FROM reference_options`);
  if (rc[0].n === 0) {
    const refDefaults = {
      stage: [
        ["Live · ~zero traction", "Built and working, but almost nobody knows it exists yet."],
        ["Live · early traction", "Already has some users or revenue and is ready to scale."],
        ["Pre-launch", "Built but not yet open to the public."],
      ],
      mandate: [
        ["All of growth", "You own every growth channel end to end — demand, SEO, social, paid, partnerships."],
        ["Demand generation", "Focused on driving new top-of-funnel demand."],
        ["Single channel", "One channel only, e.g. SEO or paid acquisition."],
      ],
      lever: [
        ["Buyer demand", "The main constraint is attracting buyers, not supply."],
        ["Supply", "The main constraint is adding more listings or sellers."],
        ["Retention", "The main constraint is keeping existing users active."],
      ],
      deal: [
        ["Rev-share, $0 baseline", "You earn a share of net-new revenue measured from a clean zero baseline."],
        ["Rev-share, existing baseline", "A share of revenue above the current run-rate."],
      ],
    };
    for (const [category, options] of Object.entries(refDefaults)) {
      for (let i = 0; i < options.length; i++) {
        await client.query(
          `INSERT INTO reference_options (category, label, description, position)
           VALUES ($1, $2, $3, $4) ON CONFLICT (category, label) DO NOTHING`,
          [category, options[i][0], options[i][1], i]
        );
      }
    }
    console.log("[migrate] Seeded default reference options.");
  }

  // 1c. One-time: convert the old free-text product attributes (stage, mandate,
  //     lever, deal_summary) into reference_options foreign keys. Preserves data
  //     by turning every existing value into an option first. Guarded on the old
  //     `stage` column, so it's a no-op on fresh DBs and on re-runs.
  const { rows: hasStage } = await client.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'stage'`
  );
  if (hasStage.length > 0) {
    for (const c of ["stage", "mandate", "lever", "deal"]) {
      await client.query(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${c}_id BIGINT
           REFERENCES reference_options (id) ON DELETE SET NULL`
      );
    }
    // [reference category, old text column]
    const cols = [
      ["stage", "stage"],
      ["mandate", "mandate"],
      ["lever", "lever"],
      ["deal", "deal_summary"],
    ];
    for (const [cat, col] of cols) {
      // Ensure an option exists for every value currently in use (no data loss).
      await client.query(
        `INSERT INTO reference_options (category, label, description, position)
         SELECT $1, x.v, '', 0
           FROM (SELECT DISTINCT ${col} AS v FROM products WHERE COALESCE(${col}, '') <> '') x
         ON CONFLICT (category, label) DO NOTHING`,
        [cat]
      );
      // Link each product to the matching option.
      await client.query(
        `UPDATE products p SET ${cat}_id = ro.id
           FROM reference_options ro
          WHERE ro.category = $1 AND ro.label = p.${col}`,
        [cat]
      );
    }
    await client.query(
      `ALTER TABLE products
         DROP COLUMN IF EXISTS stage,
         DROP COLUMN IF EXISTS mandate,
         DROP COLUMN IF EXISTS lever,
         DROP COLUMN IF EXISTS deal_summary`
    );
    console.log("[migrate] Converted product attributes to reference options.");
  }

  // 1d. Ensure products has a `featured` flag, and feature the first product if
  //     none is featured yet, so the home page always has one to show. Idempotent:
  //     the UPDATE only fires when nothing is currently featured.
  await client.query(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`
  );
  await client.query(
    `UPDATE products SET featured = true
      WHERE id = (SELECT id FROM products ORDER BY position ASC, id ASC LIMIT 1)
        AND NOT EXISTS (SELECT 1 FROM products WHERE featured = true)`
  );

  // 1e. Users gain a nullable `name` and an optional password — marketer leads are
  //     created passwordless by the express-interest wizard. Idempotent.
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`);
  await client.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`);

  // 1f. Retire the legacy applications table: fold each application into a
  //     passwordless user + a product-less deal, then drop it. Guarded on the
  //     table existing, so it's a no-op once done.
  const { rows: hasApps } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = 'applications'`
  );
  if (hasApps.length > 0) {
    await client.query(
      `INSERT INTO users (email, name)
       SELECT DISTINCT ON (lower(email)) lower(email), NULLIF(name, '')
         FROM applications WHERE COALESCE(email, '') <> ''
       ON CONFLICT (email) DO NOTHING`
    );
    await client.query(
      `INSERT INTO deals (user_id, product_id, link, proof, niche, revshare, status)
       SELECT u.id, NULL, a.link, a.proof, a.niche, a.revshare, 'new'
         FROM applications a JOIN users u ON u.email = lower(a.email)
        WHERE COALESCE(a.email, '') <> ''`
    );
    await client.query(`DROP TABLE applications`);
    console.log("[migrate] Migrated applications into deals and dropped the table.");
  }

  // 2. First-admin seed from env (optional). Set ADMIN_EMAIL + ADMIN_PASSWORD in
  //    the Railway dashboard. Creates the admin only if it doesn't exist yet —
  //    never overwrites an existing account.
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password) {
    if (password.length < 8) {
      console.warn("[migrate] ADMIN_PASSWORD is under 8 characters — skipping admin seed.");
    } else {
      const { rowCount } = await client.query(
        `INSERT INTO users (email, password_hash, is_admin)
         VALUES ($1, $2, true)
         ON CONFLICT (email) DO NOTHING`,
        [email, hashPassword(password)]
      );
      console.log(
        rowCount > 0
          ? `[migrate] Seeded admin ${email}.`
          : `[migrate] Admin ${email} already exists — left unchanged.`
      );
    }
  } else if (email || password) {
    console.warn("[migrate] Set BOTH ADMIN_EMAIL and ADMIN_PASSWORD to seed an admin.");
  }

  // 3. Default deal terms — only when the table is empty, so admin edits made in
  //    /admin/deal are never overwritten by a later deploy. Keep in sync with
  //    DEFAULT_DEAL_TERMS in lib/deal.ts.
  const { rows: dt } = await client.query(`SELECT COUNT(*)::int AS n FROM deal_terms`);
  if (dt[0].n === 0) {
    const defaults = [
      ["Your share of net-new revenue", "30", "%", 0],
      ["Revenue baseline at start", "$0", null, 1],
      ["Active term", "24", "mo", 2],
      ["Equity required", "None", null, 3],
    ];
    for (const [label, value, suffix, position] of defaults) {
      await client.query(
        `INSERT INTO deal_terms (label, value, suffix, position) VALUES ($1, $2, $3, $4)`,
        [label, value, suffix, position]
      );
    }
    console.log("[migrate] Seeded default deal terms.");
  }

  // 4. Default product (the Frockd pilot) — only when the table is empty, so
  //    admin edits in /admin/products are never overwritten. Keep in sync with
  //    DEFAULT_PRODUCTS in lib/products.ts.
  const { rows: pc } = await client.query(`SELECT COUNT(*)::int AS n FROM products`);
  if (pc[0].n === 0) {
    await client.query(
      `INSERT INTO products
         (name, category, status, spots, description, stage_id, mandate_id, lever_id, deal_id, published, featured, position)
       VALUES ($1, $2, $3, $4, $5,
         (SELECT id FROM reference_options WHERE category = 'stage'   AND label = $6),
         (SELECT id FROM reference_options WHERE category = 'mandate' AND label = $7),
         (SELECT id FROM reference_options WHERE category = 'lever'   AND label = $8),
         (SELECT id FROM reference_options WHERE category = 'deal'    AND label = $9),
         true, true, 0)`,
      [
        "Frockd.com.au",
        "Formal-dress marketplace · Australia",
        "Open",
        1,
        "A working marketplace where people list their formal dresses. The product is built and live — listings convert when buyers show up. Right now it has almost no audience.\n\nThe interesting part: revenue is listing fees, but the real lever is buyer demand. Crack the buyer side and the rest follows. It's a clean, winnable puzzle for someone who knows how to manufacture demand in a niche.",
        "Live · ~zero traction",
        "All of growth",
        "Buyer demand",
        "Rev-share, $0 baseline",
      ]
    );
    console.log("[migrate] Seeded default product (Frockd).");
  }
} catch (err) {
  console.error("[migrate] Failed:", err);
  process.exit(1);
} finally {
  await client.end();
}

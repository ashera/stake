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
         (name, category, status, spots, description, stage, mandate, lever, deal_summary, published, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 0)`,
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

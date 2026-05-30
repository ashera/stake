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
} catch (err) {
  console.error("[migrate] Failed:", err);
  process.exit(1);
} finally {
  await client.end();
}

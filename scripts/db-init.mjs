// Initialise the database by running db/schema.sql.
// Usage: DATABASE_URL=... npm run db:init
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to your environment first.");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Failed to apply schema:", err);
  process.exit(1);
} finally {
  await client.end();
}

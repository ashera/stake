// Create (or promote + reset the password of) an admin user.
// Usage: node scripts/create-admin.mjs <email> <password>
//   e.g. npm run create-admin -- adam@example.com "a-strong-password"
//   on Railway:  railway run npm run create-admin -- adam@example.com "..."
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

// Mirror of hashPassword() in lib/auth.ts (kept inline so this script has no
// build step / TS import). Format: "scrypt$<saltHex>$<hashHex>".
function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to your environment first.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, is_admin)
     VALUES ($1, $2, true)
     ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = true
     RETURNING id, email, created_at`,
    [email.trim().toLowerCase(), hashPassword(password)]
  );
  console.log(`Admin ready: ${rows[0].email} (id ${rows[0].id}).`);
} catch (err) {
  console.error("Failed to create admin:", err);
  process.exit(1);
} finally {
  await client.end();
}

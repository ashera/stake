import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { getPool } from "@/lib/db";

// Lean roll-our-own auth: scrypt password hashing + random session tokens stored
// (hashed) in Postgres. No external auth framework, no native crypto dependency.

const COOKIE_NAME = "stake_session";
const SESSION_TTL_DAYS = 30;

export type AuthUser = { id: string; email: string; isAdmin: boolean };

// --- Password hashing (scrypt; built into Node, nothing to compile) ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// --- Sessions ----------------------------------------------------------------

// The cookie holds the raw token; we only ever persist its SHA-256, so reading
// the DB never yields a usable session token.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error("Database not configured.");

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [hashToken(token), userId, expires]
  );

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return;

  const pool = getPool();
  if (pool) await pool.query(`DELETE FROM sessions WHERE id = $1`, [hashToken(token)]);
  cookies().delete(COOKIE_NAME);
}

// Resolve the logged-in user from the session cookie, or null. Also lazily
// clears expired sessions for the current token.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const pool = getPool();
  if (!pool) return null;

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.is_admin
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > now()`,
    [hashToken(token)]
  );

  if (rows.length === 0) return null;
  return { id: String(rows[0].id), email: rows[0].email, isAdmin: rows[0].is_admin };
}

// Guard for admin API routes. Returns the user, or null if not an admin —
// callers turn null into a 401/403.
export async function getAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  return user && user.isAdmin ? user : null;
}

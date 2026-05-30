import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp, tooMany } from "@/lib/rateLimit";

export const runtime = "nodejs";

type LoginBody = { email?: string; password?: string };

const FIFTEEN_MIN = 15 * 60 * 1000;

export async function POST(req: Request) {
  const ipLimit = rateLimit(`login:ip:${clientIp(req)}`, 10, FIFTEEN_MIN);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);

  let body: LoginBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 422 }
    );
  }

  const emailLimit = rateLimit(`login:email:${email}`, 5, FIFTEEN_MIN);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfter);

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { ok: false, error: "Login is unavailable — the database isn't configured." },
      { status: 503 }
    );
  }

  const { rows } = await pool.query(
    `SELECT id, password_hash FROM users WHERE email = $1`,
    [email]
  );

  // Same response whether the email is unknown or the password is wrong, so the
  // form can't be used to enumerate which accounts exist.
  // Passwordless accounts (marketer leads) can't log in here — they use a
  // magic-link instead. Treat as an incorrect login (same non-enumerating error).
  const user = rows[0];
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json(
      { ok: false, error: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  await createSession(String(user.id));
  return NextResponse.json({ ok: true });
}

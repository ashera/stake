import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { createEmailVerificationToken } from "@/lib/auth";
import { baseUrl, sendVerificationEmail } from "@/lib/email";
import { rateLimit, clientIp, tooMany } from "@/lib/rateLimit";

export const runtime = "nodejs";

const FIFTEEN_MIN = 15 * 60 * 1000;

// Request a sign-in link by email (for passwordless returners). Always responds
// ok so it can't be used to probe which emails exist.
export async function POST(req: Request) {
  const ipLimit = rateLimit(`magic:ip:${clientIp(req)}`, 5, FIFTEEN_MIN);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 422 });
  }

  // Protect a specific inbox from repeated link requests.
  const emailLimit = rateLimit(`magic:email:${email}`, 3, FIFTEEN_MIN);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfter);

  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (rows.length > 0) {
        const token = await createEmailVerificationToken(String(rows[0].id));
        if (token) await sendVerificationEmail(email, `${baseUrl(req)}/verify-email?token=${token}`, true);
      }
    } catch (err) {
      console.error("[magic-link] failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

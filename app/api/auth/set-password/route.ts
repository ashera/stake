import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

// Let a signed-in user set (or change) their password — the "come back later"
// upgrade prompted on the deal page.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const password = body.password || "";
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    hashPassword(password),
    user.id,
  ]);
  return NextResponse.json({ ok: true });
}

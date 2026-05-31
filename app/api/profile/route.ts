import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

// PATCH — update the signed-in user's own profile (currently just their name).
// Email changes aren't supported here (they'd need re-verification).
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const name = (body.name || "").trim();

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  await pool.query(`UPDATE users SET name = $1 WHERE id = $2`, [name || null, user.id]);
  return NextResponse.json({ ok: true, name });
}

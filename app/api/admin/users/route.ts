import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

type CreateBody = { email?: string; password?: string; isAdmin?: boolean; isBuilder?: boolean };

export async function POST(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const isAdmin = Boolean(body.isAdmin);
  const isBuilder = Boolean(body.isBuilder);

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 422 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { ok: false, error: "Database isn't configured." },
      { status: 503 }
    );
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, is_admin, is_builder)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, is_admin, is_builder, created_at`,
      [email, hashPassword(password), isAdmin, isBuilder]
    );
    return NextResponse.json({ ok: true, user: rows[0] });
  } catch (err: unknown) {
    // 23505 = unique_violation (email already exists)
    if (typeof err === "object" && err && (err as { code?: string }).code === "23505") {
      return NextResponse.json(
        { ok: false, error: "A user with that email already exists." },
        { status: 409 }
      );
    }
    console.error("[admin/users] create failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not create the user." },
      { status: 500 }
    );
  }
}

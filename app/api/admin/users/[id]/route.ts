import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// Block actions that would lock everyone out: you can't demote/delete yourself,
// and you can't remove the last remaining admin.
async function lastAdminGuard(pool: ReturnType<typeof getPool>, targetId: string) {
  const { rows } = await pool!.query(`SELECT COUNT(*)::int AS n FROM users WHERE is_admin = true`);
  const { rows: t } = await pool!.query(`SELECT is_admin FROM users WHERE id = $1`, [targetId]);
  const targetIsAdmin = t[0]?.is_admin === true;
  return targetIsAdmin && rows[0].n <= 1;
}

export async function PATCH(req: Request, { params }: Params) {
  const me = await getAdmin();
  if (!me) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });

  let body: { isAdmin?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (typeof body.isAdmin !== "boolean") {
    return NextResponse.json({ ok: false, error: "isAdmin must be a boolean." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  if (params.id === me.id && body.isAdmin === false) {
    return NextResponse.json(
      { ok: false, error: "You can't remove your own admin access." },
      { status: 422 }
    );
  }
  if (body.isAdmin === false && (await lastAdminGuard(pool, params.id))) {
    return NextResponse.json(
      { ok: false, error: "That's the last admin — promote someone else first." },
      { status: 422 }
    );
  }

  const { rows } = await pool.query(
    `UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, email, is_admin`,
    [body.isAdmin, params.id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, user: rows[0] });
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getAdmin();
  if (!me) return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });

  if (params.id === me.id) {
    return NextResponse.json(
      { ok: false, error: "You can't delete your own account." },
      { status: 422 }
    );
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  if (await lastAdminGuard(pool, params.id)) {
    return NextResponse.json(
      { ok: false, error: "That's the last admin — promote someone else first." },
      { status: 422 }
    );
  }

  const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

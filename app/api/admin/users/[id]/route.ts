import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

type UpdateBody = {
  email?: string;
  name?: string;
  firstName?: string;
  familyName?: string;
  bio?: string;
  isAdmin?: boolean;
  isBuilder?: boolean;
  password?: string;
};

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

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const sets: string[] = [];
  const vals: unknown[] = [];
  const add = (col: string, value: unknown) => {
    vals.push(value);
    sets.push(`${col} = $${vals.length}`);
  };
  const trimOrNull = (s?: string) => (s || "").trim() || null;

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Email is required." }, { status: 422 });
    add("email", email);
  }
  if (typeof body.name === "string") add("name", trimOrNull(body.name));
  if (typeof body.firstName === "string") add("first_name", trimOrNull(body.firstName));
  if (typeof body.familyName === "string") add("family_name", trimOrNull(body.familyName));
  if (typeof body.bio === "string") add("bio", trimOrNull(body.bio));
  if (typeof body.isBuilder === "boolean") add("is_builder", body.isBuilder);

  if (typeof body.isAdmin === "boolean") {
    if (body.isAdmin === false) {
      if (params.id === me.id) {
        return NextResponse.json(
          { ok: false, error: "You can't remove your own admin access." },
          { status: 422 }
        );
      }
      if (await lastAdminGuard(pool, params.id)) {
        return NextResponse.json(
          { ok: false, error: "That's the last admin — promote someone else first." },
          { status: 422 }
        );
      }
    }
    add("is_admin", body.isAdmin);
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters." },
        { status: 422 }
      );
    }
    add("password_hash", hashPassword(body.password));
  }

  if (sets.length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 422 });
  }

  vals.push(params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${vals.length}
       RETURNING id, email, is_admin, is_builder`,
      vals
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user: rows[0] });
  } catch (err: unknown) {
    if (typeof err === "object" && err && (err as { code?: string }).code === "23505") {
      return NextResponse.json(
        { ok: false, error: "A user with that email already exists." },
        { status: 409 }
      );
    }
    console.error("[admin/users] update failed:", err);
    return NextResponse.json({ ok: false, error: "Could not save the user." }, { status: 500 });
  }
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

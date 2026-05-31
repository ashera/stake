import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH — update a prospect's status / next step (and the rest if sent).
export async function PATCH(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { name?: string; channel?: string; link?: string; status?: string; nextStep?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const trim = (s?: string) => (s || "").trim() || null;
  const sets: string[] = [];
  const vals: unknown[] = [];
  const add = (col: string, value: unknown) => {
    vals.push(value);
    sets.push(`${col} = $${vals.length}`);
  };

  if (typeof body.name === "string") {
    if (!body.name.trim()) return NextResponse.json({ ok: false, error: "Name can't be empty." }, { status: 422 });
    add("name", body.name.trim());
  }
  if (typeof body.channel === "string") add("channel", trim(body.channel));
  if (typeof body.link === "string") add("link", trim(body.link));
  if (typeof body.status === "string" && body.status.trim()) add("status", body.status.trim());
  if (typeof body.nextStep === "string") add("next_step", trim(body.nextStep));

  if (sets.length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 422 });
  }

  vals.push(params.id);
  const { rowCount } = await pool.query(
    `UPDATE partnership_prospects SET ${sets.join(", ")} WHERE id = $${vals.length}`,
    vals
  );
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Prospect not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — remove a prospect.
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`DELETE FROM partnership_prospects WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Prospect not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

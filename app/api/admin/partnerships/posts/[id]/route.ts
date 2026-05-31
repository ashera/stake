import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH — update an outreach post's title / channel / body.
export async function PATCH(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { title?: string; channel?: string; body?: string };
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

  if (typeof body.title === "string") add("title", body.title.trim() || "Untitled post");
  if (typeof body.channel === "string") add("channel", body.channel.trim() || null);
  if (typeof body.body === "string") add("body", body.body);

  if (sets.length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 422 });
  }

  vals.push(params.id);
  const { rowCount } = await pool.query(
    `UPDATE partnership_posts SET ${sets.join(", ")} WHERE id = $${vals.length}`,
    vals
  );
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — remove an outreach post.
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`DELETE FROM partnership_posts WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

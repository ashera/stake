import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH — update a term's label / value / suffix.
export async function PATCH(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { label?: string; value?: string; suffix?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const label = (body.label || "").trim();
  const value = (body.value || "").trim();
  const suffix = (body.suffix || "").trim() || null;

  if (!label || !value) {
    return NextResponse.json(
      { ok: false, error: "Label and value are required." },
      { status: 422 }
    );
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rows } = await pool.query(
    `UPDATE deal_terms SET label = $1, value = $2, suffix = $3 WHERE id = $4
     RETURNING id, label, value, suffix`,
    [label, value, suffix, params.id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Term not found." }, { status: 404 });
  }
  const r = rows[0];
  return NextResponse.json({
    ok: true,
    term: { id: String(r.id), label: r.label, value: r.value, suffix: r.suffix ?? "" },
  });
}

// DELETE — remove a term.
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`DELETE FROM deal_terms WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Term not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

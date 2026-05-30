import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH — update an option's label / description (category is fixed).
export async function PATCH(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { label?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const label = (body.label || "").trim();
  const description = (body.description || "").trim();
  if (!label) {
    return NextResponse.json({ ok: false, error: "Label is required." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  try {
    const { rows } = await pool.query(
      `UPDATE reference_options SET label = $1, description = $2 WHERE id = $3
       RETURNING id, category, label, description`,
      [label, description, params.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Option not found." }, { status: 404 });
    }
    const r = rows[0];
    return NextResponse.json({
      ok: true,
      option: { id: String(r.id), category: r.category, label: r.label, description: r.description ?? "" },
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err && (err as { code?: string }).code === "23505") {
      return NextResponse.json(
        { ok: false, error: "Another option in this category already uses that label." },
        { status: 409 }
      );
    }
    console.error("[admin/reference] update failed:", err);
    return NextResponse.json({ ok: false, error: "Could not save the option." }, { status: 500 });
  }
}

// DELETE — remove an option. Products referencing it have the attribute cleared
// (ON DELETE SET NULL).
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`DELETE FROM reference_options WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Option not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

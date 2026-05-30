import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { DEAL_STATUSES } from "@/lib/deals";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH — update a deal's status.
export async function PATCH(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const status = (body.status || "").trim();
  if (!DEAL_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Unknown status." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`UPDATE deals SET status = $1 WHERE id = $2`, [status, params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — remove a deal.
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`DELETE FROM deals WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// POST — create a new deal term, appended after the current last one.
export async function POST(req: Request) {
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
    `INSERT INTO deal_terms (label, value, suffix, position)
     VALUES ($1, $2, $3, COALESCE((SELECT MAX(position) + 1 FROM deal_terms), 0))
     RETURNING id, label, value, suffix`,
    [label, value, suffix]
  );
  const r = rows[0];
  return NextResponse.json({
    ok: true,
    term: { id: String(r.id), label: r.label, value: r.value, suffix: r.suffix ?? "" },
  });
}

// PATCH — reorder. Body: { order: string[] } (term ids in the desired order).
export async function PATCH(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { order?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const order = body.order;
  if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
    return NextResponse.json({ ok: false, error: "order must be an array of ids." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < order.length; i++) {
      await client.query(`UPDATE deal_terms SET position = $1 WHERE id = $2`, [i, order[i]]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[admin/deal-terms] reorder failed:", err);
    return NextResponse.json({ ok: false, error: "Could not reorder." }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}

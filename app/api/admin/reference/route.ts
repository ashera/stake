import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { REF_CATEGORY_KEYS } from "@/lib/reference";

export const runtime = "nodejs";

// POST — create a reference option in a category, appended after the last one.
export async function POST(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { category?: string; label?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const category = (body.category || "").trim();
  const label = (body.label || "").trim();
  const description = (body.description || "").trim();

  if (!REF_CATEGORY_KEYS.includes(category as (typeof REF_CATEGORY_KEYS)[number])) {
    return NextResponse.json({ ok: false, error: "Unknown category." }, { status: 422 });
  }
  if (!label) {
    return NextResponse.json({ ok: false, error: "Label is required." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  try {
    const { rows } = await pool.query(
      `INSERT INTO reference_options (category, label, description, position)
       VALUES ($1, $2, $3,
               COALESCE((SELECT MAX(position) + 1 FROM reference_options WHERE category = $1), 0))
       RETURNING id, category, label, description`,
      [category, label, description]
    );
    const r = rows[0];
    return NextResponse.json({
      ok: true,
      option: { id: String(r.id), category: r.category, label: r.label, description: r.description ?? "" },
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err && (err as { code?: string }).code === "23505") {
      return NextResponse.json(
        { ok: false, error: "That option already exists in this category." },
        { status: 409 }
      );
    }
    console.error("[admin/reference] create failed:", err);
    return NextResponse.json({ ok: false, error: "Could not create the option." }, { status: 500 });
  }
}

// PATCH — reorder within a category. Body: { order: string[] }.
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
      await client.query(`UPDATE reference_options SET position = $1 WHERE id = $2`, [i, order[i]]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[admin/reference] reorder failed:", err);
    return NextResponse.json({ ok: false, error: "Could not reorder." }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}

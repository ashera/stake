import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { PRODUCT_COLUMNS, mapProductRow } from "@/lib/products";

export const runtime = "nodejs";

type Params = { params: { id: string } };

type UpdateBody = {
  name?: string;
  category?: string;
  status?: string;
  spots?: number;
  description?: string;
  stageId?: string | null;
  mandateId?: string | null;
  leverId?: string | null;
  dealId?: string | null;
  published?: boolean;
};

// Reference ids arrive as strings (or null/empty for "none"). Coerce to a
// numeric id or null; reject anything non-numeric.
function refId(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// PATCH — update all editable fields of a product.
export async function PATCH(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Product name is required." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const trim = (s?: string) => (s || "").trim() || null;
  const status = (body.status || "").trim() || "Open";
  const spotsNum = Number(body.spots);
  const spots = Number.isFinite(spotsNum) ? Math.max(0, Math.trunc(spotsNum)) : 1;

  try {
    const { rows } = await pool.query(
      `UPDATE products
          SET name = $1, category = $2, status = $3, spots = $4, description = $5,
              stage_id = $6, mandate_id = $7, lever_id = $8, deal_id = $9, published = $10
        WHERE id = $11
        RETURNING ${PRODUCT_COLUMNS}`,
      [
        name,
        trim(body.category),
        status,
        spots,
        trim(body.description),
        refId(body.stageId),
        refId(body.mandateId),
        refId(body.leverId),
        refId(body.dealId),
        Boolean(body.published),
        params.id,
      ]
    );
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: mapProductRow(rows[0]) });
  } catch (err: unknown) {
    // 23503 = foreign_key_violation (a referenced option no longer exists)
    if (typeof err === "object" && err && (err as { code?: string }).code === "23503") {
      return NextResponse.json(
        { ok: false, error: "One of the selected options no longer exists. Refresh and retry." },
        { status: 422 }
      );
    }
    console.error("[admin/products] update failed:", err);
    return NextResponse.json({ ok: false, error: "Could not save the product." }, { status: 500 });
  }
}

// DELETE — remove a product.
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(`DELETE FROM products WHERE id = $1`, [params.id]);
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

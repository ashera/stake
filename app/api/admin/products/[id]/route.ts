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
  stage?: string;
  mandate?: string;
  lever?: string;
  dealSummary?: string;
  published?: boolean;
};

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

  const { rows } = await pool.query(
    `UPDATE products
        SET name = $1, category = $2, status = $3, spots = $4, description = $5,
            stage = $6, mandate = $7, lever = $8, deal_summary = $9, published = $10
      WHERE id = $11
      RETURNING ${PRODUCT_COLUMNS}`,
    [
      name,
      trim(body.category),
      status,
      spots,
      trim(body.description),
      trim(body.stage),
      trim(body.mandate),
      trim(body.lever),
      trim(body.dealSummary),
      Boolean(body.published),
      params.id,
    ]
  );
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, product: mapProductRow(rows[0]) });
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

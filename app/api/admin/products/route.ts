import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { PRODUCT_COLUMNS, mapProductRow } from "@/lib/products";

export const runtime = "nodejs";

// POST — create a new draft product (unpublished), appended after the last one.
// The admin fills it in and publishes from /admin/products.
export async function POST() {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rows } = await pool.query(
    `INSERT INTO products (name, status, spots, published, position)
     VALUES ('New product', 'Open', 1, false,
             COALESCE((SELECT MAX(position) + 1 FROM products), 0))
     RETURNING ${PRODUCT_COLUMNS}`
  );
  return NextResponse.json({ ok: true, product: mapProductRow(rows[0]) });
}

// PATCH — reorder. Body: { order: string[] } (product ids in display order).
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
      await client.query(`UPDATE products SET position = $1 WHERE id = $2`, [i, order[i]]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[admin/products] reorder failed:", err);
    return NextResponse.json({ ok: false, error: "Could not reorder." }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true });
}

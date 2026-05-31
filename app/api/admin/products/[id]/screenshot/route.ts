import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 2_000_000; // 2 MB

type Params = { params: { id: string } };

// POST — upload (replace) a product's screenshot. Expects multipart/form-data
// with a `file` image field. Stored as bytea in the products row.
export async function POST(req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a file upload." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ ok: false, error: "No file provided." }, { status: 422 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "That doesn't look like an image." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Image is too large (max 2 MB)." },
      { status: 413 }
    );
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const { rowCount } = await pool.query(
    `UPDATE products SET screenshot = $1, screenshot_type = $2 WHERE id = $3`,
    [bytes, file.type, params.id]
  );
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — remove a product's screenshot.
export async function DELETE(_req: Request, { params }: Params) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const { rowCount } = await pool.query(
    `UPDATE products SET screenshot = NULL, screenshot_type = NULL WHERE id = $1`,
    [params.id]
  );
  if (rowCount === 0) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

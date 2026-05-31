import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// Serve a product's screenshot bytes. Public for published products; drafts are
// only visible to an admin.
export async function GET(_req: Request, { params }: Params) {
  const pool = getPool();
  if (!pool) return new NextResponse(null, { status: 404 });

  let row: { screenshot: Buffer | null; screenshot_type: string | null; published: boolean } | undefined;
  try {
    const { rows } = await pool.query(
      `SELECT screenshot, screenshot_type, published FROM products WHERE id = $1`,
      [params.id]
    );
    row = rows[0];
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  if (!row || !row.screenshot) return new NextResponse(null, { status: 404 });

  if (!row.published) {
    const user = await getCurrentUser();
    if (!user?.isAdmin) return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(row.screenshot, {
    headers: {
      "Content-Type": row.screenshot_type || "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}

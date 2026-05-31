import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// POST — add an outreach post/template.
export async function POST(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { title?: string; channel?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const title = (body.title || "").trim() || "Untitled post";
  const channel = (body.channel || "").trim() || null;
  const text = body.body || "";

  const { rows } = await pool.query(
    `INSERT INTO partnership_posts (title, channel, body, position)
     VALUES ($1, $2, $3, COALESCE((SELECT MAX(position) + 1 FROM partnership_posts), 0))
     RETURNING id, title, channel, body`,
    [title, channel, text]
  );
  const r = rows[0];
  return NextResponse.json({
    ok: true,
    post: { id: String(r.id), title: r.title, channel: r.channel ?? "", body: r.body ?? "" },
  });
}

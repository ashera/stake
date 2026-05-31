import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// POST — add a prospect to the partnership tracker.
export async function POST(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { name?: string; channel?: string; link?: string; status?: string; nextStep?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "A name is required." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  const trim = (s?: string) => (s || "").trim() || null;
  const { rows } = await pool.query(
    `INSERT INTO partnership_prospects (name, channel, link, status, next_step)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, channel, link, status, next_step, created_at`,
    [name, trim(body.channel), trim(body.link), (body.status || "Identified").trim(), trim(body.nextStep)]
  );
  const r = rows[0];
  return NextResponse.json({
    ok: true,
    prospect: {
      id: String(r.id),
      name: r.name,
      channel: r.channel ?? "",
      link: r.link ?? "",
      status: r.status,
      nextStep: r.next_step ?? "",
      createdAt: String(r.created_at),
    },
  });
}

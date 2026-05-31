import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// POST — toggle a playbook checklist item done/undone for a channel.
// Body: { channel, task, done }.
export async function POST(req: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  let body: { channel?: string; task?: string; done?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const channel = (body.channel || "").trim();
  const task = (body.task || "").trim();
  if (!channel || !task) {
    return NextResponse.json({ ok: false, error: "channel and task are required." }, { status: 422 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ ok: false, error: "Database isn't configured." }, { status: 503 });

  if (body.done) {
    await pool.query(
      `INSERT INTO partnership_checks (channel, task) VALUES ($1, $2) ON CONFLICT (channel, task) DO NOTHING`,
      [channel, task]
    );
  } else {
    await pool.query(`DELETE FROM partnership_checks WHERE channel = $1 AND task = $2`, [channel, task]);
  }
  return NextResponse.json({ ok: true });
}

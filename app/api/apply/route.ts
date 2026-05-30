import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

type ApplyBody = {
  name?: string;
  email?: string;
  link?: string;
  proof?: string;
  niche?: string;
  revshare?: string;
};

export async function POST(req: Request) {
  let body: ApplyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();

  if (!name || !email) {
    return NextResponse.json(
      { ok: false, error: "Name and email are required." },
      { status: 422 }
    );
  }

  const record = {
    name,
    email,
    link: (body.link || "").trim(),
    proof: (body.proof || "").trim(),
    niche: (body.niche || "").trim(),
    revshare: (body.revshare || "").trim(),
  };

  const pool = getPool();

  // No DB configured yet — don't lose the lead, just log it so the site
  // still works locally and in preview. Wire DATABASE_URL to persist.
  if (!pool) {
    console.log("[apply] (no DATABASE_URL, logging only):", record);
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    await pool.query(
      `INSERT INTO applications (name, email, link, proof, niche, revshare)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [record.name, record.email, record.link, record.proof, record.niche, record.revshare]
    );
    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("[apply] insert failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your application. Please try again." },
      { status: 500 }
    );
  }
}

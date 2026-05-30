import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser, hashPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

type Body = {
  productId?: string | number | null;
  name?: string;
  email?: string;
  password?: string;
  link?: string;
  proof?: string;
  niche?: string;
  revshare?: string;
  note?: string;
};

const trim = (s?: string) => (s || "").trim() || null;

// Create (or update) a deal from the express-interest wizard. Find-or-creates the
// marketer user from name + email; password is optional. Passwordless users get a
// session so they land on their deal page; an existing *credentialed* account
// (not logged in) is asked to log in instead of being silently written to.
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const productId =
    body.productId != null && String(body.productId).trim() !== ""
      ? Number(body.productId)
      : null;

  if (!name || !email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "A name and a valid email are required." },
      { status: 422 }
    );
  }
  if (password && password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }

  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { ok: false, error: "We can't take applications right now — the database isn't configured." },
      { status: 503 }
    );
  }

  // Resolve the user.
  const current = await getCurrentUser();
  let userId: string;
  let makeSession = false;

  if (current) {
    // Already signed in — the deal belongs to them.
    userId = current.id;
  } else {
    const { rows: existing } = await pool.query(
      `SELECT id, password_hash FROM users WHERE email = $1`,
      [email]
    );
    if (existing.length > 0 && existing[0].password_hash) {
      // Don't write to a password-protected account from an anonymous visitor.
      return NextResponse.json(
        {
          ok: false,
          requiresLogin: true,
          error: "That email already has an account — please log in to express interest.",
        },
        { status: 409 }
      );
    }
    if (existing.length > 0) {
      userId = String(existing[0].id);
      await pool.query(
        `UPDATE users
            SET name = COALESCE(NULLIF(name, ''), $1),
                password_hash = COALESCE(password_hash, $2)
          WHERE id = $3`,
        [name, password ? hashPassword(password) : null, existing[0].id]
      );
    } else {
      const { rows } = await pool.query(
        `INSERT INTO users (email, name, password_hash, is_admin)
         VALUES ($1, $2, $3, false) RETURNING id`,
        [email, name, password ? hashPassword(password) : null]
      );
      userId = String(rows[0].id);
    }
    makeSession = true;
  }

  // Upsert the deal (one per user + product).
  let dealId: string;
  try {
    const { rows } = await pool.query(
      `INSERT INTO deals (user_id, product_id, link, proof, niche, revshare, note, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
       ON CONFLICT (user_id, product_id) DO UPDATE
         SET link = EXCLUDED.link, proof = EXCLUDED.proof, niche = EXCLUDED.niche,
             revshare = EXCLUDED.revshare, note = EXCLUDED.note
       RETURNING id`,
      [userId, productId, trim(body.link), trim(body.proof), trim(body.niche), trim(body.revshare), trim(body.note)]
    );
    dealId = String(rows[0].id);
  } catch (err: unknown) {
    // 23503 = the product id doesn't exist
    if (typeof err === "object" && err && (err as { code?: string }).code === "23503") {
      return NextResponse.json({ ok: false, error: "That product no longer exists." }, { status: 422 });
    }
    console.error("[deals] create failed:", err);
    return NextResponse.json({ ok: false, error: "Could not save your interest. Please try again." }, { status: 500 });
  }

  if (makeSession) await createSession(userId);
  return NextResponse.json({ ok: true, dealId });
}

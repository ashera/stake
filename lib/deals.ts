import { getPool } from "@/lib/db";

export type Deal = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string | null;
  productName: string | null;
  productHasScreenshot: boolean;
  link: string;
  proof: string;
  niche: string;
  revshare: string;
  note: string;
  status: string;
  createdAt: string;
};

export const DEAL_STATUSES = ["new", "reviewing", "matched", "passed"];

type DealRow = {
  id: number | string;
  user_id: number | string;
  user_name: string | null;
  user_email: string;
  product_id: number | string | null;
  product_name: string | null;
  product_has_screenshot: boolean;
  link: string | null;
  proof: string | null;
  niche: string | null;
  revshare: string | null;
  note: string | null;
  status: string;
  created_at: Date | string;
};

const SELECT = `
  SELECT d.id, d.user_id, d.product_id, d.link, d.proof, d.niche, d.revshare, d.note,
         d.status, d.created_at,
         u.name AS user_name, u.email AS user_email,
         p.name AS product_name, (p.screenshot IS NOT NULL) AS product_has_screenshot
    FROM deals d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN products p ON p.id = d.product_id`;

function mapDeal(r: DealRow): Deal {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    userName: r.user_name ?? "",
    userEmail: r.user_email,
    productId: r.product_id != null ? String(r.product_id) : null,
    productName: r.product_name ?? null,
    productHasScreenshot: Boolean(r.product_has_screenshot),
    link: r.link ?? "",
    proof: r.proof ?? "",
    niche: r.niche ?? "",
    revshare: r.revshare ?? "",
    note: r.note ?? "",
    status: r.status,
    createdAt: String(r.created_at),
  };
}

// A single deal with its user + product resolved. Returns null for an unknown or
// non-numeric id (the query throws on a bad id and we swallow it).
export async function getDealById(id: string): Promise<Deal | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(`${SELECT} WHERE d.id = $1`, [id]);
    return rows[0] ? mapDeal(rows[0]) : null;
  } catch {
    return null;
  }
}

// A user's own deals, newest first — for the "my deals" page.
export async function getDealsForUser(userId: string): Promise<Deal[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const { rows } = await pool.query(`${SELECT} WHERE d.user_id = $1 ORDER BY d.created_at DESC`, [userId]);
    return rows.map(mapDeal);
  } catch {
    return [];
  }
}

// All deals, newest first — for the admin dashboard.
export async function getAllDeals(): Promise<Deal[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const { rows } = await pool.query(`${SELECT} ORDER BY d.created_at DESC`);
    return rows.map(mapDeal);
  } catch {
    return [];
  }
}

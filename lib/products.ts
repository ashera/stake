import { getPool } from "@/lib/db";

export type Product = {
  id?: string;
  name: string;
  category: string;
  status: string;
  spots: number;
  description: string;
  stage: string;
  mandate: string;
  lever: string;
  dealSummary: string;
  published: boolean;
};

type ProductRow = {
  id: number | string;
  name: string;
  category: string | null;
  status: string | null;
  spots: number | null;
  description: string | null;
  stage: string | null;
  mandate: string | null;
  lever: string | null;
  deal_summary: string | null;
  published: boolean;
};

// Columns selected wherever a full product is read, in the order the mapper
// expects.
export const PRODUCT_COLUMNS =
  "id, name, category, status, spots, description, stage, mandate, lever, deal_summary, published";

export function mapProductRow(r: ProductRow): Product {
  return {
    id: String(r.id),
    name: r.name,
    category: r.category ?? "",
    status: r.status ?? "Open",
    spots: r.spots ?? 0,
    description: r.description ?? "",
    stage: r.stage ?? "",
    mandate: r.mandate ?? "",
    lever: r.lever ?? "",
    dealSummary: r.deal_summary ?? "",
    published: r.published,
  };
}

// Fallback shown when there's no database or the products table isn't migrated
// yet, so the landing page always has something live. Keep in sync with the seed
// in scripts/migrate.mjs.
export const DEFAULT_PRODUCTS: Product[] = [
  {
    name: "Frockd.com.au",
    category: "Formal-dress marketplace · Australia",
    status: "Open",
    spots: 1,
    description:
      "A working marketplace where people list their formal dresses. The product is built and live — listings convert when buyers show up. Right now it has almost no audience.\n\nThe interesting part: revenue is listing fees, but the real lever is buyer demand. Crack the buyer side and the rest follows. It's a clean, winnable puzzle for someone who knows how to manufacture demand in a niche.",
    stage: "Live · ~zero traction",
    mandate: "All of growth",
    lever: "Buyer demand",
    dealSummary: "Rev-share, $0 baseline",
    published: true,
  },
];

// Published products for public display. Degrades to the defaults if the DB is
// absent or not yet migrated; returns [] if products exist but none are
// published (so the section can hide when an admin has hidden everything).
export async function getPublishedProducts(): Promise<Product[]> {
  const pool = getPool();
  if (!pool) return DEFAULT_PRODUCTS;
  try {
    const { rows } = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY position ASC, id ASC`
    );
    if (rows.length === 0) return DEFAULT_PRODUCTS;
    return (rows as ProductRow[]).filter((r) => r.published).map(mapProductRow);
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

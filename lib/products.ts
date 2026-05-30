import { getPool } from "@/lib/db";

// Storage/edit shape — attributes are foreign keys into reference_options.
export type Product = {
  id?: string;
  name: string;
  category: string;
  status: string;
  spots: number;
  description: string;
  stageId: string | null;
  mandateId: string | null;
  leverId: string | null;
  dealId: string | null;
  published: boolean;
};

type ProductRow = {
  id: number | string;
  name: string;
  category: string | null;
  status: string | null;
  spots: number | null;
  description: string | null;
  stage_id: number | string | null;
  mandate_id: number | string | null;
  lever_id: number | string | null;
  deal_id: number | string | null;
  published: boolean;
};

// Columns for admin reads / RETURNING (the *_id form, not the resolved labels).
export const PRODUCT_COLUMNS =
  "id, name, category, status, spots, description, stage_id, mandate_id, lever_id, deal_id, published";

const refId = (v: number | string | null) => (v != null ? String(v) : null);

export function mapProductRow(r: ProductRow): Product {
  return {
    id: String(r.id),
    name: r.name,
    category: r.category ?? "",
    status: r.status ?? "Open",
    spots: r.spots ?? 0,
    description: r.description ?? "",
    stageId: refId(r.stage_id),
    mandateId: refId(r.mandate_id),
    leverId: refId(r.lever_id),
    dealId: refId(r.deal_id),
    published: r.published,
  };
}

// Display shape for the public card — each attribute resolved to its label and
// explanatory description.
export type ProductAttr = { label: string; description: string };
export type ProductDisplay = {
  id?: string;
  name: string;
  category: string;
  status: string;
  spots: number;
  description: string;
  published: boolean;
  stage: ProductAttr;
  mandate: ProductAttr;
  lever: ProductAttr;
  deal: ProductAttr;
};

// Fallback shown when there's no database or the products table isn't migrated
// yet. Keep in sync with the seeds in scripts/migrate.mjs.
export const DEFAULT_PRODUCTS: ProductDisplay[] = [
  {
    name: "Frockd.com.au",
    category: "Formal-dress marketplace · Australia",
    status: "Open",
    spots: 1,
    description:
      "A working marketplace where people list their formal dresses. The product is built and live — listings convert when buyers show up. Right now it has almost no audience.\n\nThe interesting part: revenue is listing fees, but the real lever is buyer demand. Crack the buyer side and the rest follows. It's a clean, winnable puzzle for someone who knows how to manufacture demand in a niche.",
    published: true,
    stage: {
      label: "Live · ~zero traction",
      description: "Built and working, but almost nobody knows it exists yet.",
    },
    mandate: {
      label: "All of growth",
      description:
        "You own every growth channel end to end — demand, SEO, social, paid, partnerships.",
    },
    lever: {
      label: "Buyer demand",
      description: "The main constraint is attracting buyers, not supply.",
    },
    deal: {
      label: "Rev-share, $0 baseline",
      description: "You earn a share of net-new revenue measured from a clean zero baseline.",
    },
  },
];

// Published products for public display, with each attribute resolved to its
// label + description via reference_options. Degrades to the defaults if the DB
// is absent or not yet migrated; returns [] if products exist but none are
// published.
export async function getPublishedProducts(): Promise<ProductDisplay[]> {
  const pool = getPool();
  if (!pool) return DEFAULT_PRODUCTS;
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.category, p.status, p.spots, p.description, p.published,
              st.label AS stage_label,   st.description AS stage_desc,
              ma.label AS mandate_label, ma.description AS mandate_desc,
              le.label AS lever_label,   le.description AS lever_desc,
              de.label AS deal_label,    de.description AS deal_desc
         FROM products p
         LEFT JOIN reference_options st ON st.id = p.stage_id
         LEFT JOIN reference_options ma ON ma.id = p.mandate_id
         LEFT JOIN reference_options le ON le.id = p.lever_id
         LEFT JOIN reference_options de ON de.id = p.deal_id
        ORDER BY p.position ASC, p.id ASC`
    );
    if (rows.length === 0) return DEFAULT_PRODUCTS;
    return rows
      .filter((r) => r.published)
      .map((r) => ({
        id: String(r.id),
        name: r.name,
        category: r.category ?? "",
        status: r.status ?? "Open",
        spots: r.spots ?? 0,
        description: r.description ?? "",
        published: r.published,
        stage: { label: r.stage_label ?? "", description: r.stage_desc ?? "" },
        mandate: { label: r.mandate_label ?? "", description: r.mandate_desc ?? "" },
        lever: { label: r.lever_label ?? "", description: r.lever_desc ?? "" },
        deal: { label: r.deal_label ?? "", description: r.deal_desc ?? "" },
      }));
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

import { getPool } from "@/lib/db";

// Storage/edit shape — attributes are foreign keys into reference_options.
export type Product = {
  id?: string;
  name: string;
  category: string;
  status: string;
  spots: number;
  description: string;
  builder: string;
  offeredOn: string | null; // YYYY-MM-DD
  liveUrl: string;
  hasScreenshot: boolean;
  stageId: string | null;
  mandateId: string | null;
  leverId: string | null;
  dealId: string | null;
  published: boolean;
  featured: boolean;
};

type ProductRow = {
  id: number | string;
  name: string;
  category: string | null;
  status: string | null;
  spots: number | null;
  description: string | null;
  builder: string | null;
  offered_on: string | null;
  live_url: string | null;
  has_screenshot: boolean;
  stage_id: number | string | null;
  mandate_id: number | string | null;
  lever_id: number | string | null;
  deal_id: number | string | null;
  published: boolean;
  featured: boolean;
};

// Columns for admin reads / RETURNING (the *_id form, not the resolved labels).
// `offered_on` is returned as a YYYY-MM-DD string; screenshot bytes are never
// selected here (served separately) — we only expose whether one exists.
export const PRODUCT_COLUMNS =
  "id, name, category, status, spots, description, builder, live_url, " +
  "to_char(offered_on, 'YYYY-MM-DD') AS offered_on, (screenshot IS NOT NULL) AS has_screenshot, " +
  "stage_id, mandate_id, lever_id, deal_id, published, featured";

const refId = (v: number | string | null) => (v != null ? String(v) : null);

export function mapProductRow(r: ProductRow): Product {
  return {
    id: String(r.id),
    name: r.name,
    category: r.category ?? "",
    status: r.status ?? "Open",
    spots: r.spots ?? 0,
    description: r.description ?? "",
    builder: r.builder ?? "",
    offeredOn: r.offered_on ?? null,
    liveUrl: r.live_url ?? "",
    hasScreenshot: Boolean(r.has_screenshot),
    stageId: refId(r.stage_id),
    mandateId: refId(r.mandate_id),
    leverId: refId(r.lever_id),
    dealId: refId(r.deal_id),
    published: r.published,
    featured: r.featured,
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
  builder: string;
  offeredOn: string | null;
  liveUrl: string;
  hasScreenshot: boolean;
  published: boolean;
  featured: boolean;
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
    builder: "",
    offeredOn: null,
    liveUrl: "https://frockd.com.au",
    hasScreenshot: false,
    published: true,
    featured: true,
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

// Shared SELECT that resolves each attribute FK to its label + description.
const DISPLAY_SELECT = `
  SELECT p.id, p.name, p.category, p.status, p.spots, p.description, p.builder, p.live_url,
         to_char(p.offered_on, 'YYYY-MM-DD') AS offered_on,
         (p.screenshot IS NOT NULL) AS has_screenshot, p.published, p.featured,
         st.label AS stage_label,   st.description AS stage_desc,
         ma.label AS mandate_label, ma.description AS mandate_desc,
         le.label AS lever_label,   le.description AS lever_desc,
         de.label AS deal_label,    de.description AS deal_desc
    FROM products p
    LEFT JOIN reference_options st ON st.id = p.stage_id
    LEFT JOIN reference_options ma ON ma.id = p.mandate_id
    LEFT JOIN reference_options le ON le.id = p.lever_id
    LEFT JOIN reference_options de ON de.id = p.deal_id`;

function mapDisplayRow(r: Record<string, unknown>): ProductDisplay {
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    id: String(r.id),
    name: s(r.name),
    category: s(r.category),
    status: s(r.status) || "Open",
    spots: typeof r.spots === "number" ? r.spots : 0,
    description: s(r.description),
    builder: s(r.builder),
    offeredOn: r.offered_on != null ? String(r.offered_on) : null,
    liveUrl: s(r.live_url),
    hasScreenshot: Boolean(r.has_screenshot),
    published: Boolean(r.published),
    featured: Boolean(r.featured),
    stage: { label: s(r.stage_label), description: s(r.stage_desc) },
    mandate: { label: s(r.mandate_label), description: s(r.mandate_desc) },
    lever: { label: s(r.lever_label), description: s(r.lever_desc) },
    deal: { label: s(r.deal_label), description: s(r.deal_desc) },
  };
}

// Published products for public display, with each attribute resolved. Degrades
// to the defaults if the DB is absent or not yet migrated; returns [] if products
// exist but none are published.
export async function getPublishedProducts(): Promise<ProductDisplay[]> {
  const pool = getPool();
  if (!pool) return DEFAULT_PRODUCTS;
  try {
    const { rows } = await pool.query(`${DISPLAY_SELECT} ORDER BY p.position ASC, p.id ASC`);
    if (rows.length === 0) return DEFAULT_PRODUCTS;
    return rows.filter((r) => r.published).map(mapDisplayRow);
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

// A single published product by id, for the express-interest wizard's context.
// Returns null if not found, not published, or the id is invalid.
export async function getPublishedProductById(id: string): Promise<ProductDisplay | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(`${DISPLAY_SELECT} WHERE p.id = $1 AND p.published = true`, [id]);
    return rows[0] ? mapDisplayRow(rows[0]) : null;
  } catch {
    return null;
  }
}

// The single product to feature on the home page: the featured published product
// (lowest position), else the first published product. Degrades to the default
// product if there's no DB / unmigrated table; null if products exist but none
// are published.
export async function getFeaturedProduct(): Promise<ProductDisplay | null> {
  const pool = getPool();
  if (!pool) return DEFAULT_PRODUCTS[0] ?? null;
  try {
    const { rows } = await pool.query(
      `${DISPLAY_SELECT} ORDER BY p.featured DESC, p.position ASC, p.id ASC`
    );
    if (rows.length === 0) return DEFAULT_PRODUCTS[0] ?? null;
    const published = rows.filter((r) => r.published);
    return published.length > 0 ? mapDisplayRow(published[0]) : null;
  } catch {
    return DEFAULT_PRODUCTS[0] ?? null;
  }
}

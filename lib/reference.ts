import { getPool } from "@/lib/db";

// The four product attributes backed by managed reference options. `key` matches
// the reference_options.category value and the product *_id column prefix;
// `label` is how the attribute is titled on the product card.
export const REF_CATEGORIES = [
  { key: "stage", label: "Stage" },
  { key: "mandate", label: "Your mandate" },
  { key: "lever", label: "Key challenge" },
  { key: "deal", label: "Deal" },
] as const;

export type RefCategoryKey = (typeof REF_CATEGORIES)[number]["key"];
export const REF_CATEGORY_KEYS = REF_CATEGORIES.map((c) => c.key) as RefCategoryKey[];

export type RefOption = { id: string; category: string; label: string; description: string };

// All reference options, ordered by category then display position. Used by the
// admin (dropdowns + management) and the landing page (to resolve descriptions).
export async function getReferenceOptions(): Promise<RefOption[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      `SELECT id, category, label, description
         FROM reference_options ORDER BY category ASC, position ASC, id ASC`
    );
    return rows.map((r) => ({
      id: String(r.id),
      category: r.category,
      label: r.label,
      description: r.description ?? "",
    }));
  } catch {
    return [];
  }
}

import { getPool } from "@/lib/db";

export type DealTerm = { id?: string; label: string; value: string; suffix: string | null };

// Fallback shown when there's no database or the deal_terms table is empty, so
// the landing page always renders sensible terms. Keep in sync with the seed in
// scripts/migrate.mjs.
export const DEFAULT_DEAL_TERMS: DealTerm[] = [
  { label: "Your share of net-new revenue", value: "30", suffix: "%" },
  { label: "Revenue baseline at start", value: "$0", suffix: null },
  { label: "Active term", value: "24", suffix: "mo" },
  { label: "Equity required", value: "None", suffix: null },
];

// Read the deal terms for public display. Degrades to the defaults if the DB is
// absent, empty, or not yet migrated — never throws on the landing page.
export async function getDealTerms(): Promise<DealTerm[]> {
  const pool = getPool();
  if (!pool) return DEFAULT_DEAL_TERMS;
  try {
    const { rows } = await pool.query(
      `SELECT id, label, value, suffix FROM deal_terms ORDER BY position ASC, id ASC`
    );
    if (rows.length === 0) return DEFAULT_DEAL_TERMS;
    return rows.map((r) => ({
      id: String(r.id),
      label: r.label,
      value: r.value,
      suffix: r.suffix,
    }));
  } catch {
    return DEFAULT_DEAL_TERMS;
  }
}

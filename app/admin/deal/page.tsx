import { getPool } from "@/lib/db";
import DealManager, { type DealTerm } from "./DealManager";

export const dynamic = "force-dynamic";

async function getTerms(): Promise<DealTerm[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    `SELECT id, label, value, suffix FROM deal_terms ORDER BY position ASC, id ASC`
  );
  return rows.map((r) => ({
    id: String(r.id),
    label: r.label,
    value: r.value,
    suffix: r.suffix ?? "",
  }));
}

export default async function AdminDeal() {
  const terms = await getTerms();

  return (
    <section>
      <div className="admin-head">
        <h1>Deal terms</h1>
        <span className="count">{terms.length} shown</span>
      </div>
      <p className="lede">
        These are the parameters in the &ldquo;shape of the deal&rdquo; box on the landing
        page. Edits go live immediately. Value is the headline; suffix is the small unit
        after it (e.g. <code>%</code>, <code>mo</code>).
      </p>
      <DealManager initialTerms={terms} />
    </section>
  );
}

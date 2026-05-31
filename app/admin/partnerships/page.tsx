import { getPool } from "@/lib/db";
import type { Prospect } from "@/lib/partnerships";
import PartnershipTracker from "./PartnershipTracker";

export const dynamic = "force-dynamic";

async function getData(): Promise<{ prospects: Prospect[]; doneKeys: string[] }> {
  const pool = getPool();
  if (!pool) return { prospects: [], doneKeys: [] };
  try {
    const [p, c] = await Promise.all([
      pool.query(
        `SELECT id, name, channel, link, status, next_step, created_at
           FROM partnership_prospects ORDER BY created_at DESC`
      ),
      pool.query(`SELECT channel, task FROM partnership_checks`),
    ]);
    const prospects = p.rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      channel: r.channel ?? "",
      link: r.link ?? "",
      status: r.status,
      nextStep: r.next_step ?? "",
      createdAt: String(r.created_at),
    }));
    const doneKeys = c.rows.map((r) => `${r.channel}::${r.task}`);
    return { prospects, doneKeys };
  } catch {
    return { prospects: [], doneKeys: [] };
  }
}

export default async function AdminPartnerships() {
  const { prospects, doneKeys } = await getData();

  return (
    <section>
      <div className="admin-head">
        <h1>Partnership Tracker</h1>
        <span className="count">{prospects.length} prospects</span>
      </div>
      <p className="lede">
        Your playbook for finding a growth partner, and a tracker for the people you&apos;re working.
        The 90-day goal: <strong>one marketer truly engaged</strong>.
      </p>
      <PartnershipTracker initialProspects={prospects} doneKeys={doneKeys} />
    </section>
  );
}

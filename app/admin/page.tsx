import { getAllDeals, DEAL_STATUSES } from "@/lib/deals";
import DealsManager from "./DealsManager";

export const dynamic = "force-dynamic";

export default async function AdminDeals() {
  const deals = await getAllDeals();

  return (
    <section>
      <div className="admin-head">
        <h1>Deals</h1>
        <span className="count">{deals.length} total</span>
      </div>
      <p className="lede">
        Everyone who expressed interest, newest first. Set a status as you work each one, or open a
        deal to see the full submission.
      </p>
      <DealsManager initialDeals={deals} statuses={DEAL_STATUSES} />
    </section>
  );
}

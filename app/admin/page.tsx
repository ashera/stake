import { getAllDeals } from "@/lib/deals";
import DealsTable from "./DealsTable";

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
        Everyone who expressed interest, newest first. Open a deal to see the full
        submission and set its status.
      </p>
      <DealsTable initialDeals={deals} />
    </section>
  );
}

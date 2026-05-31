import { getPublishedProducts } from "@/lib/products";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import OpportunityCard from "./OpportunityCard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Traxn — opportunities",
  description: "Live products with no audience, open to a growth partner on rev-share.",
};

export default async function Opportunities() {
  const products = await getPublishedProducts();

  return (
    <div className="wrap">
      <SiteNav />

      <section className="opp">
        <div className="section-label">Live opportunities</div>
        <h2 className="section-title">Products on the table.</h2>

        {products.length === 0 ? (
          <div className="empty">No open opportunities right now — check back soon.</div>
        ) : (
          <div className="opp-grid">
            {products.map((p, i) => (
              <OpportunityCard key={p.id ?? i} product={p} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

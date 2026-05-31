import Link from "next/link";
import { formatBadge } from "@/lib/badge";
import type { ProductDisplay } from "@/lib/products";

// A brief card for the opportunities grid. The whole card links to the detail
// page; full details live there.
export default function OpportunityCard({ product: p }: { product: ProductDisplay }) {
  const snippet = (p.description.split(/\n\s*\n/)[0] || "").trim();

  return (
    <Link className="opp-mini" href={`/opportunities/${p.id ?? ""}`}>
      {p.id && p.hasScreenshot && (
        <img className="opp-mini-shot" src={`/api/products/${p.id}/screenshot`} alt="" />
      )}
      <div className="opp-mini-body">
        <span className="badge">{formatBadge(p.status, p.spots)}</span>
        <h3>{p.name}</h3>
        {p.category && <p className="opp-mini-cat">{p.category}</p>}
        {snippet && <p className="opp-mini-desc">{snippet}</p>}
        <span className="opp-mini-cta">View opportunity →</span>
      </div>
    </Link>
  );
}

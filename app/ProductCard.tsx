import Link from "next/link";
import { formatBadge } from "@/lib/badge";
import type { ProductDisplay } from "@/lib/products";

// One live-opportunity card. Shared by the home featured slot and the full list
// on /how-it-works.
export default function ProductCard({ product: p }: { product: ProductDisplay }) {
  const meta: [string, { label: string; description: string }][] = [
    ["Stage", p.stage],
    ["Your mandate", p.mandate],
    ["The lever", p.lever],
    ["Deal", p.deal],
  ];

  return (
    <div className="opp-card">
      <div className="opp-top">
        <span className="badge">{formatBadge(p.status, p.spots)}</span>
        <span style={{ color: "var(--bone-dim)", fontSize: 14 }}>{p.category}</span>
      </div>
      <div className="opp-body">
        <div>
          <h3>{p.name}</h3>
          {p.description
            .split(/\n\s*\n/)
            .map((para) => para.trim())
            .filter(Boolean)
            .map((para, j) => (
              <p key={j}>{para}</p>
            ))}
        </div>
        <div className="opp-meta">
          {meta
            .filter(([, attr]) => attr.label)
            .map(([lab, attr]) => (
              <div className="meta-row" key={lab}>
                <span className="lab">{lab}</span>
                <span className="val">{attr.label}</span>
                {attr.description && <span className="hint">{attr.description}</span>}
              </div>
            ))}
        </div>
      </div>
      {p.id && (
        <div className="opp-foot">
          <Link className="btn btn-primary" href={`/express-interest/${p.id}`}>
            Express interest →
          </Link>
        </div>
      )}
    </div>
  );
}

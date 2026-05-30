import Link from "next/link";
import { getFeaturedProduct } from "@/lib/products";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import ProductCard from "./ProductCard";
import ApplyForm from "./ApplyForm";

export default async function Home() {
  const featured = await getFeaturedProduct();

  return (
    <div className="wrap">
      <SiteNav />

      <header className="home-hero">
        <div className="eyebrow">For growth people who want a cut, not a contract</div>
        <h1>
          Own growth for products that already <em>work</em>.
        </h1>
        <p className="sub">
          We hand you one live product with no audience. You own all of growth and take a real share
          of every dollar you bring in. No retainer, no equity gamble — just upside on something real.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#apply">
            Take a shot →
          </a>
          <Link className="btn btn-ghost" href="/how-it-works">
            How it works
          </Link>
        </div>
      </header>

      {featured && (
        <section className="featured">
          <div className="section-label">Featured opportunity</div>
          <ProductCard product={featured} />
          <Link className="see-all" href="/how-it-works#opportunities">
            See how it works &amp; every opening →
          </Link>
        </section>
      )}

      <section className="apply" id="apply">
        <div className="form-card">
          <ApplyForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

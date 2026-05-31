import Link from "next/link";
import { getFeaturedProduct } from "@/lib/products";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import ProductCard from "./ProductCard";

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
          One live product, no audience. You own all of growth and take a real cut of every dollar
          you bring in — no retainer, no equity gamble.
        </p>
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

      <SiteFooter />
    </div>
  );
}

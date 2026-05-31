import Image from "next/image";
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
        <div className="home-hero-text">
          <div className="eyebrow">For growth people who want a cut, not a contract</div>
          <h1>
            Own growth for products that already <em>work</em>.
          </h1>
          <p className="sub">
            One live product, no audience. You own all of growth and take a real cut of every dollar
            you bring in — no retainer, no equity gamble.
          </p>
        </div>
        <Image
          className="home-hero-img"
          src="/traxn-hero.png"
          alt=""
          width={1536}
          height={1024}
          priority
          sizes="(max-width: 820px) 0px, 44vw"
        />
      </header>

      {featured && (
        <section className="featured">
          <div className="section-label">Featured opportunity</div>
          <ProductCard product={featured} />
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

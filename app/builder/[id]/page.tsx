import { notFound } from "next/navigation";
import { getBuilderProfile } from "@/lib/users";
import { getPublishedProducts } from "@/lib/products";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import ProductCard from "../../ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traxn — builder" };

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const builder = await getBuilderProfile(params.id);
  if (!builder) notFound();

  const products = (await getPublishedProducts()).filter((p) => p.builderId === builder.id);

  return (
    <div className="wrap">
      <SiteNav />

      <section className="deal-page">
        <div className="eyebrow">Builder</div>
        <h1>{builder.name}</h1>
        {builder.bio && <p className="builder-bio">{builder.bio}</p>}
        {products.length > 0 ? (
          <>
            <p className="sub">Live opportunities {builder.name} has built.</p>
            <div className="opp-cards builder-products">
              {products.map((p, i) => (
                <ProductCard key={p.id ?? i} product={p} />
              ))}
            </div>
          </>
        ) : (
          <p className="sub">No published opportunities from this builder yet.</p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProductById } from "@/lib/products";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import ProductCard from "../../ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traxn — opportunity" };

export default async function OpportunityDetail({ params }: { params: { id: string } }) {
  const product = await getPublishedProductById(params.id);
  if (!product) notFound();

  return (
    <div className="wrap">
      <SiteNav />

      <section className="opp">
        <p className="note">
          <Link href="/opportunities" className="muted-link">
            ← All opportunities
          </Link>
        </p>
        <div className="opp-cards">
          <ProductCard product={product} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

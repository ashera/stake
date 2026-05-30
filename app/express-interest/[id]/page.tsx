import { notFound } from "next/navigation";
import { getPublishedProductById } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import ExpressInterestWizard from "./ExpressInterestWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traxn — express interest" };

export default async function ExpressInterest({ params }: { params: { id: string } }) {
  const [product, user] = await Promise.all([
    getPublishedProductById(params.id),
    getCurrentUser(),
  ]);
  if (!product || !product.id) notFound();

  return (
    <div className="wrap">
      <SiteNav />
      <ExpressInterestWizard
        productId={product.id}
        productName={product.name}
        productCategory={product.category}
        signedInEmail={user?.email ?? null}
      />
      <SiteFooter />
    </div>
  );
}

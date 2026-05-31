import { notFound } from "next/navigation";
import { getProductByIdAdmin } from "@/lib/products";
import { getReferenceOptions } from "@/lib/reference";
import ProductWizard, { type ProductOptions } from "./ProductWizard";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: { id: string } }) {
  const [product, refOptions] = await Promise.all([
    getProductByIdAdmin(params.id),
    getReferenceOptions(),
  ]);
  if (!product || !product.id) notFound();

  const options: ProductOptions = {
    stage: refOptions.filter((o) => o.category === "stage"),
    mandate: refOptions.filter((o) => o.category === "mandate"),
    lever: refOptions.filter((o) => o.category === "lever"),
    deal: refOptions.filter((o) => o.category === "deal"),
  };

  return (
    <section>
      <ProductWizard product={{ ...product, id: product.id }} options={options} />
    </section>
  );
}

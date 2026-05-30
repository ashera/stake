import { getReferenceOptions, REF_CATEGORIES } from "@/lib/reference";
import ReferenceManager from "./ReferenceManager";

export const dynamic = "force-dynamic";

export default async function AdminReference() {
  const options = await getReferenceOptions();

  return (
    <section>
      <div className="admin-head">
        <h1>Reference data</h1>
        <span className="count">{options.length} options</span>
      </div>
      <p className="lede">
        The dropdown options for product attributes. Each option&apos;s description is
        shown under its value on the product card, so visitors understand what the
        attribute means. Used by <strong>Products</strong>.
      </p>
      <ReferenceManager
        initialOptions={options}
        categories={REF_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
      />
    </section>
  );
}

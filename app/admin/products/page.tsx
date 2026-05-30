import { getPool } from "@/lib/db";
import { PRODUCT_COLUMNS, mapProductRow } from "@/lib/products";
import { getReferenceOptions } from "@/lib/reference";
import ProductsManager, { type Product, type ProductOptions } from "./ProductsManager";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<Product[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY position ASC, id ASC`
  );
  // mapProductRow always sets id; cast to the client Product shape.
  return rows.map(mapProductRow) as Product[];
}

export default async function AdminProducts() {
  const [products, refOptions] = await Promise.all([getAllProducts(), getReferenceOptions()]);
  const published = products.filter((p) => p.published).length;

  // Group reference options by category for the attribute dropdowns.
  const options: ProductOptions = {
    stage: refOptions.filter((o) => o.category === "stage"),
    mandate: refOptions.filter((o) => o.category === "mandate"),
    lever: refOptions.filter((o) => o.category === "lever"),
    deal: refOptions.filter((o) => o.category === "deal"),
  };

  return (
    <section>
      <div className="admin-head">
        <h1>Products</h1>
        <span className="count">
          {products.length} total · {published} live
        </span>
      </div>
      <p className="lede">
        The live opportunities shown on the landing page. New products start as
        unpublished drafts — fill them in, then tick <strong>Published</strong> to show
        them. Only published products appear publicly.
      </p>
      <ProductsManager initialProducts={products} options={options} />
    </section>
  );
}

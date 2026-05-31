import { getPool } from "@/lib/db";
import { PRODUCT_COLUMNS, mapProductRow } from "@/lib/products";
import ProductsTable, { type ProductRow } from "./ProductsTable";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<ProductRow[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY position ASC, id ASC`
  );
  return rows.map(mapProductRow).map((p) => ({
    id: p.id!,
    name: p.name,
    status: p.status,
    spots: p.spots,
    published: p.published,
    featured: p.featured,
  }));
}

export default async function AdminProducts() {
  const products = await getAllProducts();
  const published = products.filter((p) => p.published).length;

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
        unpublished drafts — open one to edit it through the wizard. Only published
        products appear publicly.
      </p>
      <ProductsTable initialProducts={products} />
    </section>
  );
}

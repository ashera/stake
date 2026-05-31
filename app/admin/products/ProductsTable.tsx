"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Trimmed shape for the list — the full record is loaded by the edit wizard.
export type ProductRow = {
  id: string;
  name: string;
  status: string;
  spots: number;
  published: boolean;
  featured: boolean;
};

export default function ProductsTable({ initialProducts }: { initialProducts: ProductRow[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addProduct() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't add a product.");
      router.push(`/admin/products/${data.product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add a product.");
      setBusy(false);
    }
  }

  async function move(index: number, dir: "up" | "down") {
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= products.length) return;
    const reordered = [...products];
    [reordered[index], reordered[j]] = [reordered[j], reordered[index]];
    const previous = products;
    setProducts(reordered);
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((p) => p.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't reorder.");
    } catch (err) {
      setProducts(previous);
      setError(err instanceof Error ? err.message : "Couldn't reorder.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: ProductRow) {
    if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete.");
      setProducts((ps) => ps.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="products-admin">
      <div className="products-head">
        <span className="muted">Reorder with ↑ ↓ — order is how they appear on the page.</span>
        <button className="btn-sm btn-primary-sm" onClick={addProduct} disabled={busy}>
          + New product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty">No products yet — add one to show it on the landing page.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Status</th>
              <th>Spots</th>
              <th>Visibility</th>
              <th className="ta-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id}>
                <td className="reorder">
                  <button className="btn-sm btn-ghost-sm" onClick={() => move(i, "up")} disabled={busy || i === 0} title="Move up">
                    ↑
                  </button>
                  <button
                    className="btn-sm btn-ghost-sm"
                    onClick={() => move(i, "down")}
                    disabled={busy || i === products.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                </td>
                <td>
                  <Link className="muted-link" href={`/admin/products/${p.id}`}>
                    {p.name}
                  </Link>
                </td>
                <td className="muted">{p.status}</td>
                <td className="muted">{p.spots}</td>
                <td>
                  <span className={`pill ${p.published ? "pill-admin" : ""}`}>
                    {p.published ? "Published" : "Draft"}
                  </span>
                  {p.featured && <span className="pill pill-admin">Featured</span>}
                </td>
                <td className="ta-right actions">
                  <Link className="btn-sm btn-ghost-sm" href={`/admin/products/${p.id}`}>
                    Edit
                  </Link>
                  <button className="btn-sm btn-danger-sm" onClick={() => remove(p)} disabled={busy}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <p className="err">{error}</p>}
    </div>
  );
}

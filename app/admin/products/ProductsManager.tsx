"use client";

import { useState } from "react";

export type Product = {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  stage: string;
  mandate: string;
  lever: string;
  dealSummary: string;
  published: boolean;
};

export default function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  // Local state is the source of truth after mount; the public landing page
  // reads fresh from the DB, so no server re-render is needed here.
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  function editLocal(id: string, patch: Partial<Product>) {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function addProduct() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't add a product.");
      setProducts((ps) => [...ps, data.product]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add a product.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProduct(p: Product) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          category: p.category,
          badge: p.badge,
          description: p.description,
          stage: p.stage,
          mandate: p.mandate,
          lever: p.lever,
          dealSummary: p.dealSummary,
          published: p.published,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      setSavedId(p.id);
      setTimeout(() => setSavedId((id) => (id === p.id ? null : id)), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(p: Product) {
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

  async function move(index: number, dir: "up" | "down") {
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= products.length) return;
    const reordered = [...products];
    [reordered[index], reordered[j]] = [reordered[j], reordered[index]];
    const previous = products;
    setProducts(reordered); // optimistic
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
      setProducts(previous); // revert on failure
      setError(err instanceof Error ? err.message : "Couldn't reorder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="products-admin">
      <div className="products-head">
        <button className="btn-sm btn-primary-sm" onClick={addProduct} disabled={busy}>
          + Add product
        </button>
      </div>

      {products.length === 0 && (
        <div className="empty">No products yet — add one to show it on the landing page.</div>
      )}

      <div className="product-cards">
        {products.map((p, i) => (
          <div className={`product-card${p.published ? "" : " is-draft"}`} key={p.id}>
            <div className="product-card-head">
              <span className={`pill ${p.published ? "pill-admin" : ""}`}>
                {p.published ? "Published" : "Draft"}
              </span>
              <div className="product-actions">
                <button
                  className="btn-sm btn-ghost-sm"
                  onClick={() => move(i, "up")}
                  disabled={busy || i === 0}
                  title="Move up"
                >
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
                <button className="btn-sm btn-primary-sm" onClick={() => saveProduct(p)} disabled={busy}>
                  {savedId === p.id ? "Saved ✓" : "Save"}
                </button>
                <button className="btn-sm btn-danger-sm" onClick={() => deleteProduct(p)} disabled={busy}>
                  Delete
                </button>
              </div>
            </div>

            <div className="field">
              <label>Product name</label>
              <input
                type="text"
                value={p.name}
                onChange={(e) => editLocal(p.id, { name: e.target.value })}
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>
                  Category <span>(line beside the badge)</span>
                </label>
                <input
                  type="text"
                  value={p.category}
                  onChange={(e) => editLocal(p.id, { category: e.target.value })}
                  placeholder="Formal-dress marketplace · Australia"
                />
              </div>
              <div className="field">
                <label>Badge</label>
                <input
                  type="text"
                  value={p.badge}
                  onChange={(e) => editLocal(p.id, { badge: e.target.value })}
                  placeholder="Open · 1 spot"
                />
              </div>
            </div>
            <div className="field">
              <label>
                Description <span>(blank line separates paragraphs)</span>
              </label>
              <textarea
                value={p.description}
                onChange={(e) => editLocal(p.id, { description: e.target.value })}
                rows={5}
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>Stage</label>
                <input
                  type="text"
                  value={p.stage}
                  onChange={(e) => editLocal(p.id, { stage: e.target.value })}
                  placeholder="Live · ~zero traction"
                />
              </div>
              <div className="field">
                <label>Your mandate</label>
                <input
                  type="text"
                  value={p.mandate}
                  onChange={(e) => editLocal(p.id, { mandate: e.target.value })}
                  placeholder="All of growth"
                />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>The lever</label>
                <input
                  type="text"
                  value={p.lever}
                  onChange={(e) => editLocal(p.id, { lever: e.target.value })}
                  placeholder="Buyer demand"
                />
              </div>
              <div className="field">
                <label>Deal</label>
                <input
                  type="text"
                  value={p.dealSummary}
                  onChange={(e) => editLocal(p.id, { dealSummary: e.target.value })}
                  placeholder="Rev-share, $0 baseline"
                />
              </div>
            </div>
            <label className="check-line">
              <input
                type="checkbox"
                checked={p.published}
                onChange={(e) => editLocal(p.id, { published: e.target.checked })}
              />
              Published (visible on the landing page) — remember to Save
            </label>
          </div>
        ))}
      </div>

      {error && <p className="err">{error}</p>}
    </div>
  );
}

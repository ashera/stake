"use client";

import { useState } from "react";
import Link from "next/link";
import { formatBadge } from "@/lib/badge";

export type RefOpt = { id: string; label: string; description: string };
export type ProductOptions = {
  stage: RefOpt[];
  mandate: RefOpt[];
  lever: RefOpt[];
  deal: RefOpt[];
};

export type Product = {
  id: string;
  name: string;
  category: string;
  status: string;
  spots: number;
  description: string;
  stageId: string | null;
  mandateId: string | null;
  leverId: string | null;
  dealId: string | null;
  published: boolean;
  featured: boolean;
};

const STATUS_OPTIONS = ["Open", "Coming soon", "Filled", "Closed"];

// A reference-backed attribute dropdown that also shows the chosen option's
// explanatory text (the same text shown on the public card).
function AttrSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: RefOpt[];
  onChange: (v: string | null) => void;
}) {
  const selected = options.find((o) => o.id === value);
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">— none —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {selected?.description && <p className="attr-hint">{selected.description}</p>}
    </div>
  );
}

export default function ProductsManager({
  initialProducts,
  options,
}: {
  initialProducts: Product[];
  options: ProductOptions;
}) {
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
          status: p.status,
          spots: p.spots,
          description: p.description,
          stageId: p.stageId,
          mandateId: p.mandateId,
          leverId: p.leverId,
          dealId: p.dealId,
          published: p.published,
          featured: p.featured,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      // Featured is exclusive — if this product is now featured, reflect that the
      // others are no longer featured (the server clears them).
      if (data.product?.featured) {
        setProducts((ps) =>
          ps.map((x) => (x.id === p.id ? { ...x, featured: true } : { ...x, featured: false }))
        );
      }
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
        <span className="muted">
          Attribute options are managed in <Link href="/admin/reference">Reference data</Link>.
        </span>
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
            <div className="field">
              <label>
                Category <span>(line beside the pill)</span>
              </label>
              <input
                type="text"
                value={p.category}
                onChange={(e) => editLocal(p.id, { category: e.target.value })}
                placeholder="Formal-dress marketplace · Australia"
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>Status</label>
                <select
                  value={p.status}
                  onChange={(e) => editLocal(p.id, { status: e.target.value })}
                >
                  {!STATUS_OPTIONS.includes(p.status) && p.status && (
                    <option value={p.status}>{p.status}</option>
                  )}
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>
                  Spots <span>(0 hides the count)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={p.spots}
                  onChange={(e) => editLocal(p.id, { spots: Number(e.target.value) })}
                />
              </div>
            </div>
            <p className="note">
              The landing-page pill combines these, e.g.{" "}
              <strong>{formatBadge(p.status, p.spots) || "—"}</strong>.
            </p>
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
              <AttrSelect
                label="Stage"
                value={p.stageId}
                options={options.stage}
                onChange={(v) => editLocal(p.id, { stageId: v })}
              />
              <AttrSelect
                label="Your mandate"
                value={p.mandateId}
                options={options.mandate}
                onChange={(v) => editLocal(p.id, { mandateId: v })}
              />
            </div>
            <div className="row2">
              <AttrSelect
                label="The lever"
                value={p.leverId}
                options={options.lever}
                onChange={(v) => editLocal(p.id, { leverId: v })}
              />
              <AttrSelect
                label="Deal"
                value={p.dealId}
                options={options.deal}
                onChange={(v) => editLocal(p.id, { dealId: v })}
              />
            </div>
            <label className="check-line">
              <input
                type="checkbox"
                checked={p.published}
                onChange={(e) => editLocal(p.id, { published: e.target.checked })}
              />
              Published (visible on the landing page) — remember to Save
            </label>
            <label className="check-line">
              <input
                type="checkbox"
                checked={p.featured}
                onChange={(e) => editLocal(p.id, { featured: e.target.checked })}
              />
              Featured (the single product shown on the home page) — exclusive; saving this clears it
              from others
            </label>
          </div>
        ))}
      </div>

      {error && <p className="err">{error}</p>}
    </div>
  );
}

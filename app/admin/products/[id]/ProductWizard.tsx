"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBadge } from "@/lib/badge";
import type { Product } from "@/lib/products";

export type RefOpt = { id: string; label: string; description: string };
export type ProductOptions = {
  stage: RefOpt[];
  mandate: RefOpt[];
  lever: RefOpt[];
  deal: RefOpt[];
};

const STATUS_OPTIONS = ["Open", "Coming soon", "Filled", "Closed"];
const STEPS = ["Basics", "Pitch", "Attributes", "Media & visibility"];

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

export default function ProductWizard({
  product,
  options,
}: {
  product: Product & { id: string };
  options: ProductOptions;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: product.name,
    category: product.category,
    status: product.status,
    spots: product.spots,
    liveUrl: product.liveUrl,
    description: product.description,
    builder: product.builder,
    offeredOn: product.offeredOn,
    stageId: product.stageId,
    mandateId: product.mandateId,
    leverId: product.leverId,
    dealId: product.dealId,
    published: product.published,
    featured: product.featured,
  });
  const [hasScreenshot, setHasScreenshot] = useState(product.hasScreenshot);
  const [bust, setBust] = useState(0);
  const [saving, setSaving] = useState(false);
  const [shotBusy, setShotBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() {
    setError("");
    if (step === 0 && !form.name.trim()) {
      setError("Give the product a name first.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function save() {
    setError("");
    if (!form.name.trim()) {
      setError("Give the product a name first.");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setSaving(false);
    }
  }

  async function uploadScreenshot(file: File) {
    setError("");
    setShotBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/products/${product.id}/screenshot`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed.");
      setHasScreenshot(true);
      setBust(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setShotBusy(false);
    }
  }

  async function removeScreenshot() {
    setError("");
    setShotBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/screenshot`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't remove.");
      setHasScreenshot(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove.");
    } finally {
      setShotBusy(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="wizard">
      <div className="wizard-head">
        <Link href="/admin/products" className="muted-link">
          ← Products
        </Link>
        <div className="eyebrow">Edit product</div>
        <h1>{form.name || "Untitled product"}</h1>
      </div>

      <ol className="wizard-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
            <span className="n">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="form-card">
        {step === 0 && (
          <div>
            <h2>Basics</h2>
            <div className="field">
              <label>Product name</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label>
                Category <span>(line beside the pill)</span>
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Formal-dress marketplace · Australia"
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {!STATUS_OPTIONS.includes(form.status) && form.status && (
                    <option value={form.status}>{form.status}</option>
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
                  value={form.spots}
                  onChange={(e) => set("spots", Number(e.target.value))}
                />
              </div>
            </div>
            <p className="note">
              Pill preview: <strong>{formatBadge(form.status, form.spots) || "—"}</strong>
            </p>
            <div className="field">
              <label>
                Live URL <span>(optional)</span>
              </label>
              <input
                type="url"
                value={form.liveUrl}
                onChange={(e) => set("liveUrl", e.target.value)}
                placeholder="https://frockd.com.au"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2>Pitch</h2>
            <div className="field">
              <label>
                Description <span>(blank line separates paragraphs)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={6}
              />
            </div>
            <div className="row2">
              <div className="field">
                <label>
                  Builder <span>(nickname)</span>
                </label>
                <input
                  type="text"
                  value={form.builder}
                  onChange={(e) => set("builder", e.target.value)}
                  placeholder="e.g. Adam"
                />
              </div>
              <div className="field">
                <label>Date offered</label>
                <input
                  type="date"
                  value={form.offeredOn ?? ""}
                  onChange={(e) => set("offeredOn", e.target.value || null)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Attributes</h2>
            <p className="lede">Managed in Reference data; descriptions show on the card.</p>
            <div className="row2">
              <AttrSelect label="Stage" value={form.stageId} options={options.stage} onChange={(v) => set("stageId", v)} />
              <AttrSelect label="Your mandate" value={form.mandateId} options={options.mandate} onChange={(v) => set("mandateId", v)} />
            </div>
            <div className="row2">
              <AttrSelect label="Key challenge" value={form.leverId} options={options.lever} onChange={(v) => set("leverId", v)} />
              <AttrSelect label="Deal" value={form.dealId} options={options.deal} onChange={(v) => set("dealId", v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>Media &amp; visibility</h2>
            <div className="field">
              <label>
                Screenshot <span>(a page from the product · max 2 MB)</span>
              </label>
              <div className="shot-row">
                {hasScreenshot && (
                  <img
                    className="shot-thumb"
                    src={`/api/products/${product.id}/screenshot?t=${bust}`}
                    alt={`${form.name} screenshot`}
                  />
                )}
                <div className="shot-actions">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={shotBusy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadScreenshot(file);
                      e.target.value = "";
                    }}
                  />
                  {hasScreenshot && (
                    <button className="btn-sm btn-danger-sm" onClick={removeScreenshot} disabled={shotBusy}>
                      Remove
                    </button>
                  )}
                  {shotBusy && <span className="muted">Working…</span>}
                </div>
              </div>
            </div>
            <label className="check-line">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              Published (visible on the landing page)
            </label>
            <label className="check-line">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Featured (the single product shown on the home page) — saving this clears it from others
            </label>
          </div>
        )}

        <div className="wizard-nav">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={back} disabled={saving}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="wizard-nav-right">
            <button
              className={isLast ? "btn btn-primary" : "btn btn-ghost"}
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {!isLast && (
              <button className="btn btn-primary" onClick={next}>
                Next →
              </button>
            )}
          </div>
        </div>
        {error && <p className="err">{error}</p>}
      </div>
    </div>
  );
}

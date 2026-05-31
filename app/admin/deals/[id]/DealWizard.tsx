"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Deal } from "@/lib/deals";

const STEPS = ["Submission", "Status"];

export default function DealWizard({ deal, statuses }: { deal: Deal; statuses: string[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState(deal.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const created = new Date(deal.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const rows: [string, string][] = [
    ["Applicant", deal.userName || "—"],
    ["Email", deal.userEmail],
    ["Product", deal.productName ?? "General interest"],
    ["Link", deal.link],
    ["Track record", deal.proof],
    ["Niche / channel", deal.niche],
    ["Rev-share", deal.revshare],
    ["Note", deal.note],
    ["Submitted", created],
  ];

  async function save() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
      setSaving(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="wizard">
      <div className="wizard-head">
        <Link href="/admin" className="muted-link">
          ← Deals
        </Link>
        <div className="eyebrow">Edit deal</div>
        <h1>{deal.userName || deal.userEmail}</h1>
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
            <h2>Submission</h2>
            {deal.productId && deal.productHasScreenshot && (
              <img
                className="deal-shot"
                src={`/api/products/${deal.productId}/screenshot`}
                alt={`${deal.productName ?? "Product"} preview`}
              />
            )}
            <dl className="review">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2>Status</h2>
            <p className="lede">Where this deal stands as you work it.</p>
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {!statuses.includes(status) && status && <option value={status}>{status}</option>}
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="wizard-nav">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={saving}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="wizard-nav-right">
            <button className={isLast ? "btn btn-primary" : "btn btn-ghost"} onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            {!isLast && (
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import type { Deal } from "@/lib/deals";

export default function DealsManager({
  initialDeals,
  statuses,
}: {
  initialDeals: Deal[];
  statuses: string[];
}) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(deal: Deal, status: string) {
    setError("");
    setBusyId(deal.id);
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't update.");
      setDeals((ds) => ds.map((d) => (d.id === deal.id ? { ...d, status } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(deal: Deal) {
    if (!confirm(`Delete the deal from ${deal.userName || deal.userEmail}?`)) return;
    setError("");
    setBusyId(deal.id);
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete.");
      setDeals((ds) => ds.filter((d) => d.id !== deal.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setBusyId(null);
    }
  }

  if (deals.length === 0) {
    return <div className="empty">No deals yet — they&apos;ll appear here as people express interest.</div>;
  }

  return (
    <>
      <table className="data-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Product</th>
            <th>Rev-share</th>
            <th>Status</th>
            <th>Added</th>
            <th className="ta-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id}>
              <td>
                <div>{d.userName || "—"}</div>
                <a href={`mailto:${d.userEmail}`} className="muted-link">
                  {d.userEmail}
                </a>
              </td>
              <td>{d.productName ?? <span className="muted">General</span>}</td>
              <td className="muted">{d.revshare || "—"}</td>
              <td>
                <select
                  value={d.status}
                  onChange={(e) => setStatus(d, e.target.value)}
                  disabled={busyId === d.id}
                >
                  {statuses.includes(d.status) ? null : <option value={d.status}>{d.status}</option>}
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="muted">
                {new Date(d.createdAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="ta-right actions">
                <Link className="btn-sm btn-ghost-sm" href={`/deal/${d.id}`}>
                  View
                </Link>
                <button
                  className="btn-sm btn-danger-sm"
                  onClick={() => remove(d)}
                  disabled={busyId === d.id}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="err">{error}</p>}
    </>
  );
}

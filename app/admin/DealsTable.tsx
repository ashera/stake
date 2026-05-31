"use client";

import { useState } from "react";
import Link from "next/link";
import type { Deal } from "@/lib/deals";

export default function DealsTable({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function remove(d: Deal) {
    if (!confirm(`Delete the deal from ${d.userName || d.userEmail}?`)) return;
    setError("");
    setBusyId(d.id);
    try {
      const res = await fetch(`/api/admin/deals/${d.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete.");
      setDeals((ds) => ds.filter((x) => x.id !== d.id));
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
                <span className="pill pill-status">{d.status}</span>
              </td>
              <td className="muted">
                {new Date(d.createdAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="ta-right actions">
                <Link className="btn-sm btn-ghost-sm" href={`/admin/deals/${d.id}`}>
                  Edit
                </Link>
                <button className="btn-sm btn-danger-sm" onClick={() => remove(d)} disabled={busyId === d.id}>
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

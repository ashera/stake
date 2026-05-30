"use client";

import { useState } from "react";

export type DealTerm = { id: string; label: string; value: string; suffix: string };

export default function DealManager({ initialTerms }: { initialTerms: DealTerm[] }) {
  // Local state is the source of truth after mount; the public landing page
  // reads fresh from the DB, so we don't need a server re-render here.
  const [terms, setTerms] = useState<DealTerm[]>(initialTerms);
  const [newTerm, setNewTerm] = useState({ label: "", value: "", suffix: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  function editLocal(id: string, patch: Partial<DealTerm>) {
    setTerms((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function saveTerm(term: DealTerm) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/deal-terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: term.label, value: term.value, suffix: term.suffix }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      setSavedId(term.id);
      setTimeout(() => setSavedId((id) => (id === term.id ? null : id)), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTerm(term: DealTerm) {
    if (!confirm(`Remove "${term.label}" from the landing page?`)) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/deal-terms/${term.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete.");
      setTerms((ts) => ts.filter((t) => t.id !== term.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setBusy(false);
    }
  }

  async function addTerm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newTerm.label.trim() || !newTerm.value.trim()) {
      setError("Label and value are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/deal-terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTerm),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't add the term.");
      setTerms((ts) => [...ts, data.term]);
      setNewTerm({ label: "", value: "", suffix: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the term.");
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: "up" | "down") {
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= terms.length) return;
    const reordered = [...terms];
    [reordered[index], reordered[j]] = [reordered[j], reordered[index]];
    const previous = terms;
    setTerms(reordered); // optimistic
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/deal-terms`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((t) => t.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't reorder.");
    } catch (err) {
      setTerms(previous); // revert on failure
      setError(err instanceof Error ? err.message : "Couldn't reorder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="deal-admin">
      <div className="deal-rows">
        {terms.length === 0 && <div className="empty">No deal terms yet — add one below.</div>}
        {terms.map((t, i) => (
          <div className="deal-row" key={t.id}>
            <div className="field">
              <label>Label</label>
              <input
                type="text"
                value={t.label}
                onChange={(e) => editLocal(t.id, { label: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Value</label>
              <input
                type="text"
                value={t.value}
                onChange={(e) => editLocal(t.id, { value: e.target.value })}
              />
            </div>
            <div className="field">
              <label>
                Suffix <span>(opt.)</span>
              </label>
              <input
                type="text"
                value={t.suffix}
                onChange={(e) => editLocal(t.id, { suffix: e.target.value })}
              />
            </div>
            <div className="deal-row-actions">
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
                disabled={busy || i === terms.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button
                className="btn-sm btn-primary-sm"
                onClick={() => saveTerm(t)}
                disabled={busy}
              >
                {savedId === t.id ? "Saved ✓" : "Save"}
              </button>
              <button
                className="btn-sm btn-danger-sm"
                onClick={() => deleteTerm(t)}
                disabled={busy}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form className="user-form" onSubmit={addTerm}>
        <h3>Add a term</h3>
        <div className="deal-row deal-row-new">
          <div className="field">
            <label>Label</label>
            <input
              type="text"
              value={newTerm.label}
              onChange={(e) => setNewTerm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Performance checkpoint"
            />
          </div>
          <div className="field">
            <label>Value</label>
            <input
              type="text"
              value={newTerm.value}
              onChange={(e) => setNewTerm((f) => ({ ...f, value: e.target.value }))}
              placeholder="90"
            />
          </div>
          <div className="field">
            <label>
              Suffix <span>(opt.)</span>
            </label>
            <input
              type="text"
              value={newTerm.suffix}
              onChange={(e) => setNewTerm((f) => ({ ...f, suffix: e.target.value }))}
              placeholder="days"
            />
          </div>
          <div className="deal-row-actions">
            <button className="btn-sm btn-primary-sm" type="submit" disabled={busy}>
              Add
            </button>
          </div>
        </div>
      </form>

      {error && <p className="err">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";

export type RefOption = { id: string; category: string; label: string; description: string };
type Category = { key: string; label: string };
type NewOption = { label: string; description: string };

export default function ReferenceManager({
  initialOptions,
  categories,
}: {
  initialOptions: RefOption[];
  categories: Category[];
}) {
  const [options, setOptions] = useState<RefOption[]>(initialOptions);
  const [drafts, setDrafts] = useState<Record<string, NewOption>>(
    Object.fromEntries(categories.map((c) => [c.key, { label: "", description: "" }]))
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const byCategory = (cat: string) => options.filter((o) => o.category === cat);
  // Rebuild the flat list grouped by category order (used after a reorder).
  const regroup = (next: RefOption[]) =>
    categories.flatMap((c) => next.filter((o) => o.category === c.key));

  function editLocal(id: string, patch: Partial<RefOption>) {
    setOptions((os) => os.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  async function saveOption(o: RefOption) {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reference/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: o.label, description: o.description }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      setSavedId(o.id);
      setTimeout(() => setSavedId((id) => (id === o.id ? null : id)), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteOption(o: RefOption) {
    if (!confirm(`Delete "${o.label}"? Products using it will have that attribute cleared.`)) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reference/${o.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete.");
      setOptions((os) => os.filter((x) => x.id !== o.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setBusy(false);
    }
  }

  async function addOption(category: string) {
    const draft = drafts[category];
    setError("");
    if (!draft.label.trim()) {
      setError("Label is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, label: draft.label, description: draft.description }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't add the option.");
      setOptions((os) => [...os, data.option]);
      setDrafts((d) => ({ ...d, [category]: { label: "", description: "" } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the option.");
    } finally {
      setBusy(false);
    }
  }

  async function move(category: string, index: number, dir: "up" | "down") {
    const list = byCategory(category);
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    const previous = options;
    const next = regroup(options.filter((o) => o.category !== category).concat(list));
    setOptions(next); // optimistic
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reference`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: list.map((o) => o.id) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't reorder.");
    } catch (err) {
      setOptions(previous); // revert
      setError(err instanceof Error ? err.message : "Couldn't reorder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reference-admin">
      {categories.map((cat) => {
        const list = byCategory(cat.key);
        return (
          <div className="ref-category" key={cat.key}>
            <h3>{cat.label}</h3>
            <div className="ref-options">
              {list.length === 0 && <div className="empty">No options yet.</div>}
              {list.map((o, i) => (
                <div className="ref-option" key={o.id}>
                  <div className="field">
                    <label>Label</label>
                    <input
                      type="text"
                      value={o.label}
                      onChange={(e) => editLocal(o.id, { label: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>
                      Description <span>(shown on the card)</span>
                    </label>
                    <textarea
                      value={o.description}
                      onChange={(e) => editLocal(o.id, { description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="ref-option-actions">
                    <button
                      className="btn-sm btn-ghost-sm"
                      onClick={() => move(cat.key, i, "up")}
                      disabled={busy || i === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="btn-sm btn-ghost-sm"
                      onClick={() => move(cat.key, i, "down")}
                      disabled={busy || i === list.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button className="btn-sm btn-primary-sm" onClick={() => saveOption(o)} disabled={busy}>
                      {savedId === o.id ? "Saved ✓" : "Save"}
                    </button>
                    <button className="btn-sm btn-danger-sm" onClick={() => deleteOption(o)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ref-option ref-option-new">
              <div className="field">
                <label>New label</label>
                <input
                  type="text"
                  value={drafts[cat.key]?.label ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [cat.key]: { ...d[cat.key], label: e.target.value } }))
                  }
                  placeholder="Add an option…"
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  value={drafts[cat.key]?.description ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({
                      ...d,
                      [cat.key]: { ...d[cat.key], description: e.target.value },
                    }))
                  }
                  rows={2}
                />
              </div>
              <div className="ref-option-actions">
                <button
                  className="btn-sm btn-primary-sm"
                  onClick={() => addOption(cat.key)}
                  disabled={busy}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {error && <p className="err">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { CHANNELS, PRINCIPLES, PROSPECT_STATUSES, type Prospect, type Post } from "@/lib/partnerships";

export default function PartnershipTracker({
  initialProspects,
  doneKeys,
  initialPosts,
}: {
  initialProspects: Prospect[];
  doneKeys: string[];
  initialPosts: Post[];
}) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [done, setDone] = useState<Set<string>>(new Set(doneKeys));
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", channel: "", link: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggleCheck(channel: string, task: string, value: boolean) {
    const key = `${channel}::${task}`;
    setDone((prev) => {
      const n = new Set(prev);
      if (value) n.add(key);
      else n.delete(key);
      return n;
    });
    try {
      const res = await fetch("/api/admin/partnerships/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, task, done: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error();
    } catch {
      setDone((prev) => {
        const n = new Set(prev);
        if (value) n.delete(key);
        else n.add(key);
        return n;
      });
      setError("Couldn't save that — try again.");
    }
  }

  async function addProspect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!draft.name.trim()) {
      setError("Add a name.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/partnerships/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't add.");
      setProspects((p) => [data.prospect, ...p]);
      setDraft({ name: "", channel: "", link: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add.");
    } finally {
      setBusy(false);
    }
  }

  function editLocal(id: string, patch: Partial<Prospect>) {
    setProspects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function saveProspect(id: string, patch: Partial<Prospect>) {
    setError("");
    try {
      const res = await fetch(`/api/admin/partnerships/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  async function removeProspect(p: Prospect) {
    if (!confirm(`Remove ${p.name}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/partnerships/prospects/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't remove.");
      setProspects((ps) => ps.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove.");
    } finally {
      setBusy(false);
    }
  }

  function editPostLocal(id: string, patch: Partial<Post>) {
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function addPost() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/partnerships/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New post", channel: "", body: "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't add.");
      setPosts((ps) => [...ps, data.post]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add.");
    } finally {
      setBusy(false);
    }
  }

  async function savePost(post: Post) {
    setError("");
    try {
      const res = await fetch(`/api/admin/partnerships/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: post.title, channel: post.channel, body: post.body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      setSavedPostId(post.id);
      setTimeout(() => setSavedPostId((id) => (id === post.id ? null : id)), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  async function deletePost(post: Post) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/partnerships/posts/${post.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete.");
      setPosts((ps) => ps.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPost(post: Post) {
    try {
      await navigator.clipboard.writeText(post.body);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId((id) => (id === post.id ? null : id)), 1600);
    } catch {
      setError("Couldn't copy — select and copy manually.");
    }
  }

  const counts = PROSPECT_STATUSES.map((s) => ({
    status: s,
    n: prospects.filter((p) => p.status === s).length,
  }));
  const engaged = counts
    .filter((c) => c.status === "In conversation" || c.status === "Won")
    .reduce((a, c) => a + c.n, 0);

  return (
    <div className="tracker">
      <div className="tracker-goalwrap">
        <div className={`tracker-goal${engaged >= 1 ? " is-met" : ""}`}>
          <div>
            <div className="eyebrow">90-day goal</div>
            <strong>1 marketer engaged</strong>
            <p className="muted">A prospect &ldquo;In conversation&rdquo; or &ldquo;Won&rdquo; counts.</p>
          </div>
          <div className="tracker-goal-status">{engaged >= 1 ? "Met ✓" : `${engaged} / 1`}</div>
        </div>
        <div className="tracker-funnel">
          {counts.map((c) => (
            <span className="funnel-stat" key={c.status}>
              {c.status} <strong>{c.n}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="tracker-principles">
        <h3>Ground rules</h3>
        <ul>
          {PRINCIPLES.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="tracker-h2">The playbook</h2>
        <div className="tracker-channels">
          {CHANNELS.map((ch) => {
            const total = ch.moves.length;
            const doneCount = ch.moves.filter((_, i) => done.has(`${ch.key}::${i}`)).length;
            return (
              <div className="tracker-channel" key={ch.key}>
                <div className="tracker-channel-head">
                  <h3>
                    {ch.url ? (
                      <a href={ch.url} target="_blank" rel="noreferrer">
                        {ch.name} ↗
                      </a>
                    ) : (
                      ch.name
                    )}
                  </h3>
                  <span className={`count${doneCount === total ? " all-done" : ""}`}>
                    {doneCount}/{total}
                  </span>
                </div>
                <p className="muted">{ch.what}</p>
                <div className="tracker-moves">
                  {ch.moves.map((m, i) => {
                    const checked = done.has(`${ch.key}::${i}`);
                    return (
                      <label className={`check-line${checked ? " is-done" : ""}`} key={i}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleCheck(ch.key, String(i), e.target.checked)}
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="posts-head">
          <h2 className="tracker-h2">Outreach posts</h2>
          <button className="btn-sm btn-primary-sm" onClick={addPost} disabled={busy}>
            + New post
          </button>
        </div>
        <p className="muted posts-hint">
          Templates to copy and tweak — fill the {"{placeholders}"} and send. Hit Save to keep edits.
        </p>
        {posts.length === 0 ? (
          <div className="empty">No posts yet — add one.</div>
        ) : (
          posts.map((post) => (
            <div className="post-card" key={post.id}>
              <div className="post-head">
                <input
                  className="post-title"
                  value={post.title}
                  onChange={(e) => editPostLocal(post.id, { title: e.target.value })}
                />
                <input
                  className="post-channel"
                  value={post.channel}
                  placeholder="channel"
                  onChange={(e) => editPostLocal(post.id, { channel: e.target.value })}
                />
                <div className="post-actions">
                  <button className="btn-sm btn-ghost-sm" onClick={() => copyPost(post)}>
                    {copiedId === post.id ? "Copied ✓" : "Copy"}
                  </button>
                  <button className="btn-sm btn-primary-sm" onClick={() => savePost(post)}>
                    {savedPostId === post.id ? "Saved ✓" : "Save"}
                  </button>
                  <button className="btn-sm btn-danger-sm" onClick={() => deletePost(post)} disabled={busy}>
                    Delete
                  </button>
                </div>
              </div>
              <textarea
                value={post.body}
                onChange={(e) => editPostLocal(post.id, { body: e.target.value })}
                rows={9}
              />
            </div>
          ))
        )}
      </div>

      <div>
        <h2 className="tracker-h2">Prospects</h2>
        <form className="prospect-add" onSubmit={addProspect}>
          <input
            type="text"
            placeholder="Name / handle"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <select value={draft.channel} onChange={(e) => setDraft((d) => ({ ...d, channel: e.target.value }))}>
            <option value="">Channel…</option>
            {CHANNELS.map((c) => (
              <option key={c.key} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="url"
            placeholder="Profile link (optional)"
            value={draft.link}
            onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
          />
          <button className="btn-sm btn-primary-sm" type="submit" disabled={busy}>
            Add prospect
          </button>
        </form>

        {prospects.length === 0 ? (
          <div className="empty">No prospects yet — add the first growth person you&apos;re pursuing.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Next step</th>
                <th className="ta-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer" className="muted-link">
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </td>
                  <td className="muted">{p.channel || "—"}</td>
                  <td>
                    <select
                      value={p.status}
                      onChange={(e) => {
                        editLocal(p.id, { status: e.target.value });
                        saveProspect(p.id, { status: e.target.value });
                      }}
                    >
                      {PROSPECT_STATUSES.includes(p.status) ? null : (
                        <option value={p.status}>{p.status}</option>
                      )}
                      {PROSPECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="next-step"
                      value={p.nextStep}
                      placeholder="next move…"
                      onChange={(e) => editLocal(p.id, { nextStep: e.target.value })}
                      onBlur={(e) => saveProspect(p.id, { nextStep: e.target.value })}
                    />
                  </td>
                  <td className="ta-right actions">
                    <button className="btn-sm btn-danger-sm" onClick={() => removeProspect(p)} disabled={busy}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && <p className="err">{error}</p>}
    </div>
  );
}

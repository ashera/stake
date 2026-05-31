"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type ManagedUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  isBuilder: boolean;
  createdAt: string;
};

export default function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: ManagedUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", isAdmin: true, isBuilder: false });
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");
  // Per-row in-flight guard so a row's buttons disable while it mutates.
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't create the user.");
      setForm({ email: "", password: "", isAdmin: true, isBuilder: false });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the user.");
    } finally {
      setStatus("idle");
    }
  }

  async function removeUser(user: ManagedUser) {
    if (!confirm(`Delete ${user.email}? This can't be undone.`)) return;
    setError("");
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't delete the user.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the user.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="users">
      <form className="user-form" onSubmit={createUser}>
        <h3>Add a user</h3>
        <div className="row2">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="off"
              placeholder="person@email.com"
            />
          </div>
          <div className="field">
            <label>
              Password <span>(min 8 characters)</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.isAdmin}
            onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
          />
          Admin (can access this dashboard)
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.isBuilder}
            onChange={(e) => setForm((f) => ({ ...f, isBuilder: e.target.checked }))}
          />
          Builder (can be assigned to products)
        </label>
        <button className="btn-sm btn-primary-sm" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Adding…" : "Add user"}
        </button>
        {error && <p className="err">{error}</p>}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Added</th>
            <th className="ta-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialUsers.map((u) => {
            const isMe = u.id === currentUserId;
            const busy = busyId === u.id;
            return (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {isMe && <span className="you">you</span>}
                </td>
                <td className="roles">
                  {u.isAdmin && <span className="pill pill-admin">Admin</span>}
                  {u.isBuilder && <span className="pill pill-admin">Builder</span>}
                  {!u.isAdmin && !u.isBuilder && <span className="pill">User</span>}
                </td>
                <td className="muted">
                  {new Date(u.createdAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="ta-right actions">
                  <Link className="btn-sm btn-ghost-sm" href={`/admin/users/${u.id}`}>
                    Edit
                  </Link>
                  <button
                    className="btn-sm btn-danger-sm"
                    onClick={() => removeUser(u)}
                    disabled={busy || isMe}
                    title={isMe ? "You can't delete yourself" : "Delete user"}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

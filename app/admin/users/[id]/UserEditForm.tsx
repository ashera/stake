"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminUserEdit } from "@/lib/users";

export default function UserEditForm({ user, isSelf }: { user: AdminUserEdit; isSelf: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    familyName: user.familyName,
    bio: user.bio,
    isAdmin: user.isAdmin,
    isBuilder: user.isBuilder,
    password: "",
  });
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState("");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    setStatus("saving");
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        name: form.name,
        firstName: form.firstName,
        familyName: form.familyName,
        bio: form.bio,
        isAdmin: form.isAdmin,
        isBuilder: form.isBuilder,
      };
      if (form.password) payload.password = form.password;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  return (
    <>
      <div className="admin-head">
        <h1>Edit user</h1>
      </div>
      <p className="lede">
        <Link href="/admin/users" className="muted-link">
          ← All users
        </Link>
      </p>

      <form className="user-form" onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="field">
          <label>
            Nickname <span>(optional)</span>
          </label>
          <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="row2">
          <div className="field">
            <label>
              First name <span>(optional)</span>
            </label>
            <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </div>
          <div className="field">
            <label>
              Family name <span>(optional)</span>
            </label>
            <input type="text" value={form.familyName} onChange={(e) => update("familyName", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>
            Builder bio <span>(shown on their builder page)</span>
          </label>
          <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} />
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.isAdmin}
            disabled={isSelf}
            onChange={(e) => update("isAdmin", e.target.checked)}
          />
          Admin (can access this dashboard){isSelf && " — can't change your own"}
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.isBuilder}
            onChange={(e) => update("isBuilder", e.target.checked)}
          />
          Builder (can be assigned to products)
        </label>
        <div className="field">
          <label>
            New password <span>(leave blank to keep current)</span>
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>
        <button className="btn-sm btn-primary-sm" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save user"}
        </button>
        {error && <p className="err">{error}</p>}
      </form>
    </>
  );
}

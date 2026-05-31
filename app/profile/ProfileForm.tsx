"use client";

import { useState } from "react";

export default function ProfileForm({
  initialName,
  initialFirstName,
  initialFamilyName,
  initialBio,
  isBuilder,
  email,
  verified,
}: {
  initialName: string;
  initialFirstName: string;
  initialFamilyName: string;
  initialBio: string;
  isBuilder: boolean;
  email: string;
  verified: boolean;
}) {
  const [form, setForm] = useState({
    name: initialName,
    firstName: initialFirstName,
    familyName: initialFamilyName,
    bio: initialBio,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save.");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} disabled />
        <p className="note">{verified ? "Verified ✓" : "Not verified yet"}</p>
      </div>
      <div className="field">
        <label>
          Nickname <span>(what you go by · optional)</span>
        </label>
        <input type="text" value={form.name} onChange={update("name")} placeholder="Alex" />
      </div>
      <div className="row2">
        <div className="field">
          <label>
            First name <span>(optional)</span>
          </label>
          <input type="text" value={form.firstName} onChange={update("firstName")} placeholder="Alex" />
        </div>
        <div className="field">
          <label>
            Family name <span>(optional)</span>
          </label>
          <input type="text" value={form.familyName} onChange={update("familyName")} placeholder="Rivera" />
        </div>
      </div>
      {isBuilder && (
        <div className="field">
          <label>
            Builder bio <span>(shown on your public builder page)</span>
          </label>
          <textarea
            value={form.bio}
            onChange={update("bio")}
            rows={4}
            placeholder="A line or two about you and what you build."
          />
        </div>
      )}
      <button className="btn-sm btn-primary-sm" type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

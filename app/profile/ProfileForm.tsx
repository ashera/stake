"use client";

import { useState } from "react";

export default function ProfileForm({
  initialName,
  email,
  verified,
}: {
  initialName: string;
  email: string;
  verified: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
          Name <span>(or what you go by)</span>
        </label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
      </div>
      <button className="btn-sm btn-primary-sm" type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save"}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

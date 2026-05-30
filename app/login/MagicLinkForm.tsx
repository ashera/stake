"use client";

import { useState } from "react";

// "No password? Email me a sign-in link." For passwordless marketer leads to get
// back in — posts to /api/auth/magic-link (non-enumerating).
export default function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't send the link.");
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Couldn't send the link.");
    }
  }

  if (state === "sent") {
    return (
      <p className="note">
        If that email has an account, a sign-in link is on its way. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="magic">
      <div className="field">
        <label>No password? Email me a sign-in link</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@email.com"
        />
      </div>
      <button className="btn-sm btn-ghost-sm" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a link"}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

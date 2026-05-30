"use client";

import { useState } from "react";

// Shown to a signed-in user whose email isn't verified. Lets them resend the
// confirmation / sign-in link.
export default function VerifyBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function resend() {
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't resend.");
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Couldn't resend.");
    }
  }

  return (
    <div className="banner banner-warn">
      <div>
        <strong>Confirm your email.</strong> We sent a link to {email} — click it to secure your
        account so you can sign in from anywhere.
      </div>
      {state === "sent" ? (
        <span className="muted">Sent ✓</span>
      ) : (
        <button className="btn-sm btn-ghost-sm" onClick={resend} disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Resend link"}
        </button>
      )}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Set or change the signed-in user's password. `hasPassword` switches the copy
// between first-time set and change.
export default function SetPasswordForm({ hasPassword = false }: { hasPassword?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't save your password.");
      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Couldn't save your password.");
    }
  }

  if (status === "done") {
    return (
      <p className="note">
        {hasPassword ? "Password updated." : "Password set — you can log in any time with your email."}
      </p>
    );
  }

  return (
    <form className="secure-form" onSubmit={submit}>
      <div className="field">
        <label>{hasPassword ? "New password" : "Choose a password"}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </div>
      <button className="btn-sm btn-primary-sm" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Saving…" : hasPassword ? "Update password" : "Set password"}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

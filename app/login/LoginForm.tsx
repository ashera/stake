"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Enter your email and password.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Couldn't sign in.");
      // Server set the session cookie; reload through the router so the admin
      // layout re-runs its auth check.
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={update("email")}
          autoComplete="username"
          placeholder="you@email.com"
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <button className="submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className="err">{error}</p>}
    </form>
  );
}

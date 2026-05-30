"use client";

import { useState } from "react";

const REVSHARE_OPTIONS = [
  "Yes — that's the whole appeal",
  "Yes, if the product looks winnable",
  "Maybe, depends on the split",
  "No — I need cash",
];

export default function ApplyForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    link: "",
    proof: "",
    niche: "",
    revshare: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit() {
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Pop in at least a name and email so we can get back to you.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="ok">
        <div className="check">{"\u2713"}</div>
        <h3>Got it. Now the real part.</h3>
        <p>
          This is where a person reads what you wrote and decides if the Frockd shot is right for
          you. If it is, you&apos;ll hear from us to book the 20 minutes. No autoresponder games.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Tell us what you&apos;ve grown.</h2>
      <p className="lede">
        We don&apos;t want a CV. We want one honest signal that you can do this — the kind of thing
        that&apos;s hard to fake. Two minutes.
      </p>

      <div className="field">
        <label>
          Name <span>(or what you go by)</span>
        </label>
        <input type="text" value={form.name} onChange={update("name")} placeholder="Alex Rivera" />
      </div>

      <div className="row2">
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={update("email")} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>
            Link <span>(portfolio, LinkedIn, X…)</span>
          </label>
          <input type="url" value={form.link} onChange={update("link")} placeholder="https://" />
        </div>
      </div>

      <div className="field">
        <label>One product you grew — what was it, and what changed because of you?</label>
        <textarea
          value={form.proof}
          onChange={update("proof")}
          placeholder="e.g. Took a niche marketplace from 0 to 4k monthly buyers in 7 months via SEO + creator partnerships. Here's the data…"
        />
      </div>

      <div className="row2">
        <div className="field">
          <label>Your sharpest niche / channel</label>
          <input
            type="text"
            value={form.niche}
            onChange={update("niche")}
            placeholder="e.g. marketplace demand-side, paid social, programmatic SEO"
          />
        </div>
        <div className="field">
          <label>Would you take rev-share over cash?</label>
          <select value={form.revshare} onChange={update("revshare")}>
            <option value="">Choose one…</option>
            {REVSHARE_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <button className="submit" onClick={submit} disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Apply for the Frockd spot"}
      </button>
      {error && <p className="err">{error}</p>}
      <p className="note">
        By applying you&apos;re not committing to anything — this starts a conversation. We read every
        one personally (there&apos;s a human behind this, not an algorithm).
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const REVSHARE_OPTIONS = [
  "Yes — that's the whole appeal",
  "Yes, if the product looks winnable",
  "Maybe, depends on the split",
  "No — I need cash",
];

const STEPS = ["You", "Track record", "Fit", "Review"];

export default function ExpressInterestWizard({
  productId,
  productName,
  productCategory,
  signedInEmail,
}: {
  productId: string;
  productName: string;
  productCategory: string;
  signedInEmail: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: signedInEmail ?? "",
    password: "",
    link: "",
    proof: "",
    niche: "",
    revshare: "",
    note: "",
  });
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");
  const [needLogin, setNeedLogin] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function next() {
    setError("");
    if (step === 0 && !signedInEmail) {
      if (!form.name.trim() || !form.email.trim() || !form.email.includes("@")) {
        setError("Pop in your name and a valid email so we can get back to you.");
        return;
      }
      if (form.password && form.password.length < 8) {
        setError("If you set a password, make it at least 8 characters.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError("");
    setNeedLogin(false);
    setStatus("sending");
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.requiresLogin) setNeedLogin(true);
        throw new Error(data.error || "Something went wrong.");
      }
      router.push(`/deal/${data.dealId}`);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <section className="wizard">
      <div className="wizard-head">
        <Link href="/how-it-works#opportunities" className="muted-link">
          ← All opportunities
        </Link>
        <div className="eyebrow">Express interest</div>
        <h1>{productName}</h1>
        {productCategory && <p className="sub">{productCategory}</p>}
      </div>

      <ol className="wizard-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
            <span className="n">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="form-card">
        {step === 0 && (
          <div>
            <h2>About you</h2>
            <p className="lede">We just need a way to reach you. Two fields.</p>
            {signedInEmail ? (
              <p className="note">
                Signed in as <strong>{signedInEmail}</strong> — this will attach to your account.
              </p>
            ) : (
              <>
                <div className="field">
                  <label>Name <span>(or what you go by)</span></label>
                  <input type="text" value={form.name} onChange={set("name")} placeholder="Alex Rivera" />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
                </div>
                <div className="field">
                  <label>Password <span>(optional — set one to come back to your deal later)</span></label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                    placeholder="Leave blank for now if you like"
                  />
                  <p className="note">No pressure — you can secure your account from your deal page afterward.</p>
                </div>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2>What you&apos;ve grown</h2>
            <p className="lede">One honest signal that you can do this — the kind that&apos;s hard to fake.</p>
            <div className="field">
              <label>Link <span>(portfolio, LinkedIn, X…)</span></label>
              <input type="url" value={form.link} onChange={set("link")} placeholder="https://" />
            </div>
            <div className="field">
              <label>One product you grew — what was it, and what changed because of you?</label>
              <textarea
                value={form.proof}
                onChange={set("proof")}
                placeholder="e.g. Took a niche marketplace from 0 to 4k monthly buyers in 7 months via SEO + creator partnerships. Here's the data…"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>The fit</h2>
            <p className="lede">How you&apos;d approach this one.</p>
            <div className="row2">
              <div className="field">
                <label>Your sharpest niche / channel</label>
                <input
                  type="text"
                  value={form.niche}
                  onChange={set("niche")}
                  placeholder="e.g. marketplace demand-side, paid social"
                />
              </div>
              <div className="field">
                <label>Would you take rev-share over cash?</label>
                <select value={form.revshare} onChange={set("revshare")}>
                  <option value="">Choose one…</option>
                  {REVSHARE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Anything else? <span>(optional)</span></label>
              <textarea
                value={form.note}
                onChange={set("note")}
                placeholder="A first hunch on the growth lever, a question for the builder…"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>Look good?</h2>
            <p className="lede">Here&apos;s what we&apos;ll send. You can step back and edit.</p>
            <dl className="review">
              {!signedInEmail && (
                <>
                  <div><dt>Name</dt><dd>{form.name || "—"}</dd></div>
                  <div><dt>Email</dt><dd>{form.email || "—"}</dd></div>
                  <div><dt>Password</dt><dd>{form.password ? "Set" : "Skipped (you can add one later)"}</dd></div>
                </>
              )}
              <div><dt>Link</dt><dd>{form.link || "—"}</dd></div>
              <div><dt>Track record</dt><dd>{form.proof || "—"}</dd></div>
              <div><dt>Niche / channel</dt><dd>{form.niche || "—"}</dd></div>
              <div><dt>Rev-share</dt><dd>{form.revshare || "—"}</dd></div>
              {form.note && <div><dt>Note</dt><dd>{form.note}</dd></div>}
            </dl>
            {needLogin && (
              <p className="note">
                <Link href="/login" className="muted-link">Log in here</Link> to attach this to your account.
              </p>
            )}
          </div>
        )}

        <div className="wizard-nav">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={back} disabled={status === "sending"}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={submit} disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Express interest"}
            </button>
          )}
        </div>
        {error && <p className="err">{error}</p>}
      </div>
    </section>
  );
}

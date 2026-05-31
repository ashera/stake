// Minimal email sender. Uses Resend's HTTP API when RESEND_API_KEY is set;
// otherwise logs the message to the server console so the flow still works in
// dev / before a provider is configured (the concierge can relay the link).

import { logEvent } from "@/lib/events";

type SendArgs = { to: string; subject: string; html: string; text: string };

// Absolute base URL for links in emails. Prefers APP_URL; falls back to the
// forwarded host on the incoming request.
export function baseUrl(req: Request): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM || "Traxn <onboarding@resend.dev>";

  if (!key) {
    await logEvent({
      level: "warn",
      type: "email.skipped",
      message: `No RESEND_API_KEY — "${subject}" not sent to ${to}`,
      meta: { to, subject, link: text },
    });
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      await logEvent({
        level: "error",
        type: "email.failed",
        message: `Send failed (${res.status}) for "${subject}" to ${to}`,
        meta: { to, subject, status: res.status, detail },
      });
      return false;
    }
    await logEvent({ type: "email.sent", message: `Sent "${subject}" to ${to}`, meta: { to, subject } });
    return true;
  } catch (err) {
    await logEvent({
      level: "error",
      type: "email.failed",
      message: `Send errored for "${subject}" to ${to}`,
      meta: { to, subject, error: String(err) },
    });
    return false;
  }
}

// The verification / sign-in link email. `magic` switches the copy to a pure
// sign-in link (same link both verifies the address and signs the user in).
export async function sendVerificationEmail(to: string, link: string, magic = false): Promise<boolean> {
  const subject = magic ? "Your Traxn sign-in link" : "Confirm your email for Traxn";
  const lead = magic
    ? "Here's your sign-in link — it'll take you straight to your deals:"
    : "Confirm your email and we'll keep your Traxn deal tied to your account:";
  const html =
    `<p>${lead}</p>` +
    `<p><a href="${link}">${link}</a></p>` +
    `<p style="color:#888;font-size:13px">This link expires in 48 hours. If you didn't request it, ignore this email.</p>`;
  const text = `${lead}\n\n${link}\n\nThis link expires in 48 hours. If you didn't request it, ignore this email.`;
  return sendEmail({ to, subject, html, text });
}

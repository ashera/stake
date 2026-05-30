// Minimal email sender. Uses Resend's HTTP API when RESEND_API_KEY is set;
// otherwise logs the message to the server console so the flow still works in
// dev / before a provider is configured (the concierge can relay the link).

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
  const from = process.env.EMAIL_FROM || "Traxn <onboarding@resend.dev>";

  if (!key) {
    console.log(`[email] (no RESEND_API_KEY — not sent) to=${to} subject="${subject}"\n${text}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      console.error("[email] send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] error:", err);
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

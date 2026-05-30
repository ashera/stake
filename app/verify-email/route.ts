import { NextResponse } from "next/server";
import { verifyEmailToken, createSession } from "@/lib/auth";
import { baseUrl } from "@/lib/email";

export const runtime = "nodejs";

// GET /verify-email?token=... — confirm the email and sign the user in (so the
// link doubles as a magic-link return), then redirect to their deals.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const base = baseUrl(req);

  const userId = token ? await verifyEmailToken(token) : null;
  if (!userId) {
    return NextResponse.redirect(`${base}/login?verify=invalid`);
  }

  await createSession(userId);
  return NextResponse.redirect(`${base}/deals?verified=1`);
}

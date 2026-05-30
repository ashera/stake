import { NextResponse } from "next/server";
import { getCurrentUser, createEmailVerificationToken } from "@/lib/auth";
import { baseUrl, sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

// Resend the verification link to the signed-in user (from the deal page banner).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, already: true });
  }

  const token = await createEmailVerificationToken(user.id);
  if (token) await sendVerificationEmail(user.email, `${baseUrl(req)}/verify-email?token=${token}`);
  return NextResponse.json({ ok: true });
}

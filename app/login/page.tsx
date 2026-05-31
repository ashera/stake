import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";
import MagicLinkForm from "./MagicLinkForm";

export const metadata = { title: "Traxn — Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { verify?: string };
}) {
  // Already signed in? Send them where they belong.
  const user = await getCurrentUser();
  if (user) redirect(user.isAdmin ? "/admin" : "/deals");

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="brand">
          <span className="dot" />
          Traxn
        </Link>
        <h1>Sign in</h1>
        <p className="lede">Access your deals and account.</p>
        {searchParams.verify === "invalid" && (
          <div className="banner banner-warn">
            That link was invalid or expired — request a new one below.
          </div>
        )}
        <LoginForm />
        <div className="auth-divider">or</div>
        <MagicLinkForm />
      </div>
    </div>
  );
}

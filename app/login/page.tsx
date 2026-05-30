import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Stake — Sign in" };

// Already signed in as an admin? Skip the form.
export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user?.isAdmin) redirect("/admin");

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="brand">
          <span className="dot" />
          Stake <small>admin</small>
        </Link>
        <h1>Sign in</h1>
        <p className="lede">Admin access to the concierge dashboard.</p>
        <LoginForm />
      </div>
    </div>
  );
}

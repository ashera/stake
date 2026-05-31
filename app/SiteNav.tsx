import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import AccountMenu from "./AccountMenu";

// Shared public-site nav. Server component — resolves login state itself so pages
// don't have to thread it through.
export default async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <nav>
      <Link href="/" className="brand">
        <span className="dot" />
        Traxn
      </Link>
      <div className="nav-right">
        <Link className="nav-link" href="/opportunities">
          Opportunities
        </Link>
        <Link className="nav-link" href="/how-it-works">
          How it works
        </Link>
        {user ? (
          <AccountMenu label={user.displayName} isAdmin={user.isAdmin} />
        ) : (
          <Link className="nav-login" href="/login">
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}

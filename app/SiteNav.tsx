import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

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
      {user ? (
        <Link className="nav-account" href={user.isAdmin ? "/admin" : "/profile"}>
          {user.displayName}
        </Link>
      ) : (
        <Link className="nav-login" href="/login">
          Log in
        </Link>
      )}
    </nav>
  );
}

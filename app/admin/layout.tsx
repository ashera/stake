import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const metadata = { title: "Stake — Admin" };

// Authoritative gate for everything under /admin. API routes re-check on their
// own; this protects the rendered pages.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/login?denied=1");

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <div className="brand">
          <span className="dot" />
          Stake <small>admin</small>
        </div>
        <div className="admin-links">
          <Link href="/admin">Applications</Link>
          <Link href="/admin/users">Users</Link>
        </div>
        <div className="admin-who">
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}

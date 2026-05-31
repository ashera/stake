import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import UsersManager, { type ManagedUser } from "./UsersManager";

export const dynamic = "force-dynamic";

async function getUsers(): Promise<ManagedUser[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    `SELECT id, email, is_admin, is_builder, created_at FROM users ORDER BY created_at ASC`
  );
  return rows.map((r) => ({
    id: String(r.id),
    email: r.email,
    isAdmin: r.is_admin,
    isBuilder: r.is_builder,
    createdAt: r.created_at,
  }));
}

export default async function AdminUsers() {
  const [users, me] = await Promise.all([getUsers(), getCurrentUser()]);

  return (
    <section>
      <div className="admin-head">
        <h1>Users</h1>
        <span className="count">{users.length} total</span>
      </div>
      <p className="lede">
        Admin-only accounts. Anyone flagged as admin can access this dashboard.
      </p>
      <UsersManager initialUsers={users} currentUserId={me?.id ?? ""} />
    </section>
  );
}

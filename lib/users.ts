import { getPool } from "@/lib/db";

export type BuilderOption = { id: string; label: string };
export type BuilderProfile = { id: string; name: string; bio: string };
export type AdminUserEdit = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  familyName: string;
  bio: string;
  isAdmin: boolean;
  isBuilder: boolean;
};

type UserNameRow = {
  id: number | string;
  name: string | null;
  first_name: string | null;
  family_name: string | null;
  email: string;
  bio?: string | null;
};

// Admin-facing label: nickname → "First Family" → email (email ok internally).
function adminLabel(r: UserNameRow): string {
  const full = [r.first_name, r.family_name].map((x) => (x || "").trim()).filter(Boolean).join(" ");
  return (r.name && r.name.trim()) || full || r.email;
}

// Public-facing name: nickname → "First Family" → "" (never the email).
function publicName(r: UserNameRow): string {
  const full = [r.first_name, r.family_name].map((x) => (x || "").trim()).filter(Boolean).join(" ");
  return (r.name && r.name.trim()) || full || "";
}

// Builders, for the product wizard's builder dropdown.
export async function getBuilders(): Promise<BuilderOption[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const { rows } = await pool.query(
      `SELECT id, name, first_name, family_name, email FROM users
        WHERE is_builder = true ORDER BY lower(COALESCE(name, first_name, email)) ASC`
    );
    return (rows as UserNameRow[]).map((r) => ({ id: String(r.id), label: adminLabel(r) }));
  } catch {
    return [];
  }
}

// A single user for the admin edit page.
export async function getUserForAdmin(id: string): Promise<AdminUserEdit | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, first_name, family_name, bio, is_admin, is_builder
         FROM users WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      email: r.email,
      name: r.name ?? "",
      firstName: r.first_name ?? "",
      familyName: r.family_name ?? "",
      bio: r.bio ?? "",
      isAdmin: r.is_admin,
      isBuilder: r.is_builder,
    };
  } catch {
    return null;
  }
}

// A public builder profile, or null if the user isn't a (flagged) builder.
export async function getBuilderProfile(id: string): Promise<BuilderProfile | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, first_name, family_name, email, bio FROM users
        WHERE id = $1 AND is_builder = true`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0] as UserNameRow;
    return { id: String(r.id), name: publicName(r) || "A builder", bio: (r.bio || "").trim() };
  } catch {
    return null;
  }
}

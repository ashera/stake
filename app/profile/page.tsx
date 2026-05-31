import Link from "next/link";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import VerifyBanner from "../VerifyBanner";
import SetPasswordForm from "../SetPasswordForm";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traxn — your profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // getCurrentUser doesn't carry the name; fetch it for the form.
  let name = "";
  const pool = getPool();
  if (pool) {
    const { rows } = await pool.query(`SELECT name FROM users WHERE id = $1`, [user.id]);
    name = rows[0]?.name ?? "";
  }

  return (
    <div className="wrap">
      <SiteNav />

      <section className="deal-page">
        <div className="eyebrow">Account</div>
        <h1>Your profile</h1>

        {!user.emailVerified && <VerifyBanner email={user.email} />}

        <div className="deal-card">
          <ProfileForm initialName={name} email={user.email} verified={user.emailVerified} />
        </div>

        <div className="deal-card">
          <h3>{user.hasPassword ? "Change password" : "Set a password"}</h3>
          <p>
            {user.hasPassword
              ? "Update the password you use to sign in."
              : "Set a password so you can sign in from any device (otherwise use the emailed link)."}
          </p>
          <SetPasswordForm hasPassword={user.hasPassword} />
        </div>

        <p className="note">
          <Link href="/deals" className="muted-link">
            Your deals
          </Link>
          {user.isAdmin && (
            <>
              {" · "}
              <Link href="/admin" className="muted-link">
                Admin dashboard
              </Link>
            </>
          )}
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}

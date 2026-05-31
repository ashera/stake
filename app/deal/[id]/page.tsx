import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDealById } from "@/lib/deals";
import SiteNav from "../../SiteNav";
import SiteFooter from "../../SiteFooter";
import VerifyBanner from "../../VerifyBanner";
import SetPasswordForm from "../../SetPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traxn — your deal" };

export default async function DealPage({ params }: { params: { id: string } }) {
  const [deal, user] = await Promise.all([getDealById(params.id), getCurrentUser()]);

  if (!deal) notFound();
  if (!user) redirect("/login");
  const owner = user.id === deal.userId;
  if (!owner && !user.isAdmin) notFound();

  const rows: [string, string][] = [
    ["Link", deal.link],
    ["Track record", deal.proof],
    ["Niche / channel", deal.niche],
    ["Rev-share", deal.revshare],
    ["Note", deal.note],
  ];
  const created = new Date(deal.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="wrap">
      <SiteNav />

      <section className="deal-page">
        {owner && !user.emailVerified && <VerifyBanner email={user.email} />}
        <div className="eyebrow">{owner ? "Your deal" : "Deal"}</div>
        <div className="deal-title">
          <h1>{deal.productName ?? "General interest"}</h1>
          <span className="pill pill-status">{deal.status}</span>
        </div>
        <p className="sub">
          {owner ? (
            <>Submitted {created}. We read every one personally — you&apos;ll hear from us.</>
          ) : (
            <>
              {deal.userName || deal.userEmail} ({deal.userEmail}) · submitted {created}
            </>
          )}
        </p>

        <div className="deal-card">
          <dl className="review">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
        </div>

        {owner && !user.hasPassword && (
          <div className="deal-card secure">
            <h3>Come back any time</h3>
            <p>
              Set a password and you can return to this page from any device. No pressure — your deal
              is saved either way.
            </p>
            <SetPasswordForm />
          </div>
        )}

        <p className="note">
          {owner && (
            <>
              <Link href="/deals" className="muted-link">
                All your deals
              </Link>
              {" · "}
            </>
          )}
          <Link href="/how-it-works#opportunities" className="muted-link">
            Browse other opportunities →
          </Link>
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}

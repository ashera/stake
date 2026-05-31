import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDealsForUser } from "@/lib/deals";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";
import VerifyBanner from "../VerifyBanner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traxn — your deals" };

export default async function MyDeals({
  searchParams,
}: {
  searchParams: { verified?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const deals = await getDealsForUser(user.id);
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="wrap">
      <SiteNav />

      <section className="deal-page">
        <div className="eyebrow">Your deals</div>
        <h1>Where you&apos;ve expressed interest</h1>

        {searchParams.verified === "1" && (
          <div className="banner banner-ok">Email verified ✓ — you&apos;re all set.</div>
        )}
        {!user.emailVerified && <VerifyBanner email={user.email} />}

        {deals.length === 0 ? (
          <div className="empty">
            No deals yet.{" "}
            <Link href="/opportunities" className="muted-link">
              Browse opportunities →
            </Link>
          </div>
        ) : (
          <div className="my-deals">
            {deals.map((d) => (
              <Link href={`/deal/${d.id}`} className="my-deal" key={d.id}>
                <div>
                  <strong>{d.productName ?? "General interest"}</strong>
                  <span className="muted"> · {fmt(d.createdAt)}</span>
                </div>
                <span className="pill pill-status">{d.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

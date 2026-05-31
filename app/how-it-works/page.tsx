import { getDealTerms } from "@/lib/deal";
import SiteNav from "../SiteNav";
import SiteFooter from "../SiteFooter";

export const metadata = {
  title: "Traxn — how it works",
  description:
    "How Traxn works: we're a studio shipping live products with no audience. Partner with us on growth and take a real share of the revenue you create.",
};

export default async function HowItWorks() {
  const dealTerms = await getDealTerms();

  return (
    <div className="wrap">
      <SiteNav />

      <header className="page-head">
        <div className="eyebrow">How it works</div>
        <h1>
          You own growth. You take a <em>cut</em>.
        </h1>
        <p className="sub">
          We&apos;re a studio that ships live products with no audience — built, working, and quietly
          going nowhere. Pick one, own all of growth, and take a real share of every dollar you bring
          in. No retainer, no equity gamble — and we don&apos;t clip your cut.
        </p>
      </header>

      <div className="strip">
        <div className="strip-grid">
          <div className="for">
            <h2>
              This is <em>for you</em> if…
            </h2>
            <ul>
              <li>You&apos;d rather own outcomes than bill hours.</li>
              <li>You can look at a live product and tell in an hour if it&apos;s winnable.</li>
              <li>You want a portfolio of upside bets, not a single founder vow.</li>
              <li>You&apos;ve grown something before and have the receipts.</li>
            </ul>
          </div>
          <div className="notfor">
            <h2>
              It&apos;s <em>not</em> for you if…
            </h2>
            <ul>
              <li>You need cash up front, this month, guaranteed.</li>
              <li>You want a full client roster and a safe retainer.</li>
              <li>You&apos;re looking for a job with a title and a manager.</li>
              <li>&quot;Paid in maybe&quot; makes you flinch — and that&apos;s fair.</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="how">
        <div className="section-label">The arrangement</div>
        <h2 className="section-title">Three steps, no platform to learn.</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <h3>Pick a live product to grow</h3>
            <p>
              We ship new live products — mostly marketplaces — roughly every month. Browse what&apos;s
              open and pick one, or we&apos;ll point you to the sharpest fit. Twenty minutes with the
              builder to judge if it&apos;s winnable; walk away freely if it isn&apos;t. Do well, and
              you get first pick of the next.
            </p>
          </div>
          <div className="step">
            <div className="n">02</div>
            <h3>You own all of growth</h3>
            <p>
              Every channel is yours: demand, SEO, social, paid, partnerships. The builder keeps
              building. You don&apos;t ask permission to do your job — you run the growth function.
            </p>
          </div>
          <div className="step">
            <div className="n">03</div>
            <h3>You take a cut of what you create</h3>
            <p>
              Revenue starts at a clean zero baseline, so everything after you join is plausibly
              yours. We&apos;re the builder, so the numbers are ours and open to you — we pay your
              share directly, every month. No middleman taking a slice, no chasing for what
              you&apos;re owed.
            </p>
          </div>
        </div>

        <div className="deal">
          <div>
            <h3>The shape of the deal</h3>
            <p>
              Illustrative terms — every product is scoped individually. The point is alignment:
              we&apos;re builders too, so we only make money when the product does, exactly like you.
              The baseline starts at zero, so your contribution is never in dispute.
            </p>
            <p className="note">
              Judged on real sales, not vanity signups. A 90-day checkpoint keeps both sides honest —
              if it&apos;s not working, either side walks clean.
            </p>
          </div>
          <div className="terms">
            {dealTerms.map((t, i) => (
              <div className="term" key={t.id ?? i}>
                <span className="k">{t.label}</span>
                <span className="v">
                  {t.value}
                  {t.suffix && <small>{t.suffix}</small>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDealTerms } from "@/lib/deal";
import { getPublishedProducts } from "@/lib/products";
import { formatBadge } from "@/lib/badge";
import ApplyForm from "./ApplyForm";

export default async function Home() {
  const [user, dealTerms, products] = await Promise.all([
    getCurrentUser(),
    getDealTerms(),
    getPublishedProducts(),
  ]);

  return (
    <div className="wrap">
      <nav>
        <Link href="/" className="brand">
          <span className="dot" />
          Stake
        </Link>
        {user ? (
          user.isAdmin ? (
            <Link className="nav-account" href="/admin">
              {user.email}
            </Link>
          ) : (
            <span className="nav-account">{user.email}</span>
          )
        ) : (
          <Link className="nav-login" href="/login">
            Log in
          </Link>
        )}
      </nav>

      <header>
        <div className="eyebrow">For growth people who want a cut, not a contract</div>
        <h1>
          Own growth for products that already <em>work</em>.
        </h1>
        <p className="sub">
          There are good products sitting at zero audience — built, live, and quietly going nowhere.
          We hand you one, you own all of growth, and you take a real share of every dollar you bring
          in. No retainer. No equity gamble on a pitch deck. Just upside on something real.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#apply">
            Take a shot →
          </a>
          <a className="btn btn-ghost" href="#how">
            How it works
          </a>
        </div>
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

      <section className="how" id="how">
        <div className="section-label">How it works</div>
        <h2 className="section-title">Three steps, no platform to learn.</h2>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <h3>We match you to one live product</h3>
            <p>
              Not a marketplace to browse — a single, hand-picked product that works but has no
              audience. You get 20 minutes with the builder to judge whether it&apos;s winnable. Walk
              away freely if it isn&apos;t.
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
              yours. We sit in the payment flow, verify the numbers, and pay you monthly. No chasing
              the builder for your share.
            </p>
          </div>
        </div>

        <div className="deal">
          <div>
            <h3>The shape of the deal</h3>
            <p>
              Illustrative terms — every product is scoped individually. The point is alignment: you
              only win when the product wins, and the baseline starts at zero so your contribution is
              never in dispute.
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

      {products.length > 0 && (
        <section className="opp">
          <div className="section-label">Live opportunities</div>
          <h2 className="section-title">
            {products.length === 1
              ? "One product is on the table right now."
              : "Products on the table right now."}
          </h2>
          <div className="opp-cards">
            {products.map((p, i) => {
              const meta: [string, { label: string; description: string }][] = [
                ["Stage", p.stage],
                ["Your mandate", p.mandate],
                ["The lever", p.lever],
                ["Deal", p.deal],
              ];
              return (
                <div className="opp-card" key={p.id ?? i}>
                  <div className="opp-top">
                    <span className="badge">{formatBadge(p.status, p.spots)}</span>
                    <span style={{ color: "var(--bone-dim)", fontSize: 14 }}>{p.category}</span>
                  </div>
                  <div className="opp-body">
                    <div>
                      <h3>{p.name}</h3>
                      {p.description
                        .split(/\n\s*\n/)
                        .map((para) => para.trim())
                        .filter(Boolean)
                        .map((para, j) => (
                          <p key={j}>{para}</p>
                        ))}
                    </div>
                    <div className="opp-meta">
                      {meta
                        .filter(([, attr]) => attr.label)
                        .map(([lab, attr]) => (
                          <div className="meta-row" key={lab}>
                            <span className="lab">{lab}</span>
                            <span className="val">{attr.label}</span>
                            {attr.description && <span className="hint">{attr.description}</span>}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="apply" id="apply">
        <div className="form-card">
          <ApplyForm />
        </div>
      </section>

      <footer>
        <div>Stake · working name, change me</div>
        <div>A concierge experiment — humans behind the curtain, on purpose.</div>
      </footer>
    </div>
  );
}

import ApplyForm from "./ApplyForm";

export default function Home() {
  return (
    <div className="wrap">
      <nav>
        <div className="brand">
          <span className="dot" />
          Stake <small>working name</small>
        </div>
        <a className="navcta" href="#apply">
          Apply
        </a>
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
            <div className="term">
              <span className="k">Your share of net-new revenue</span>
              <span className="v">
                30<small>%</small>
              </span>
            </div>
            <div className="term">
              <span className="k">Revenue baseline at start</span>
              <span className="v">$0</span>
            </div>
            <div className="term">
              <span className="k">Active term</span>
              <span className="v">
                24<small>mo</small>
              </span>
            </div>
            <div className="term">
              <span className="k">Equity required</span>
              <span className="v">None</span>
            </div>
          </div>
        </div>
      </section>

      <section className="opp">
        <div className="section-label">The first live opportunity</div>
        <h2 className="section-title">One product is on the table right now.</h2>
        <div className="opp-card">
          <div className="opp-top">
            <span className="badge">Open · 1 spot</span>
            <span style={{ color: "var(--bone-dim)", fontSize: 14 }}>
              Formal-dress marketplace · Australia
            </span>
          </div>
          <div className="opp-body">
            <div>
              <h3>Frockd.com.au</h3>
              <p>
                A working marketplace where people list their formal dresses. The product is built
                and live — listings convert when buyers show up. Right now it has almost no audience.
              </p>
              <p>
                The interesting part: revenue is listing fees, but the real lever is{" "}
                <strong style={{ color: "var(--bone)" }}>buyer demand</strong>. Crack the buyer side
                and the rest follows. It&apos;s a clean, winnable puzzle for someone who knows how to
                manufacture demand in a niche.
              </p>
            </div>
            <div className="opp-meta">
              <div className="meta-row">
                <span className="lab">Stage</span>
                <span className="val">Live · ~zero traction</span>
              </div>
              <div className="meta-row">
                <span className="lab">Your mandate</span>
                <span className="val">All of growth</span>
              </div>
              <div className="meta-row">
                <span className="lab">The lever</span>
                <span className="val">Buyer demand</span>
              </div>
              <div className="meta-row">
                <span className="lab">Deal</span>
                <span className="val">Rev-share, $0 baseline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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

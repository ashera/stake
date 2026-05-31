# Traxn — Project Context & Handoff

> **Purpose of this file:** Paste this at the start of a new conversation to bring Claude back up to speed on this project. It captures the concept, the key decisions *and the reasoning behind them*, the current state of what's been built, and what's next. The reasoning matters as much as the conclusions — it's what stops us re-opening settled questions.

---

## One-liner

**Traxn** (domain `traxnhq.com`) is a **build studio** that ships live products with no audience and partners with growth people on **revenue-share** to scale them. The Traxn team are the builders; Traxn lists its *own* products and takes **no fee** — revenue is the studio's share of what those products earn. Kept builder-neutral so it *could* open to third-party builders later. Pilot product: **Frockd.com.au**; product #2: an e-bike marketplace. (See **Commercial model** below — this supersedes the earlier "two-sided marketplace + trust/verification/payout layer" framing.)

## Commercial model (current)

> Supersedes the "marketplace that takes a cut + trust/verification/payout layer" assumption in decision-chain item 8. We pivoted to a **studio**.

- **Traxn is a build studio, not a fee-taking marketplace.** The team are builders; we list our **own** live products and partner with growth people on **rev-share**. Traxn charges nothing. Revenue is the studio's share of revenue from its own products.
- **No third-party trust/payment layer needed.** Traxn is one side of every deal, so there's no stranger-to-stranger trust problem and no payment rail to build: we're the builder, the numbers are ours and shown openly, and we pay the marketer their share directly each month. The verification/escrow/payout plumbing from the original model is **not built and not needed** for now.
- **Studio now, option to open later — don't design into a corner.** The data model is already **builder-neutral** (products belong to a `builder_id`; builders are flagged users with public profiles), so opening to third-party builders would be a positioning + trust-layer change, not a re-architecture. Do **not** build fees, payments, revenue verification, or builder self-signup yet.
- **Cadence is the hook.** ~**1 new live product / month** → a portfolio/pipeline. The cadence *is* the pitch — a stream of upside bets, "always another coming" — matching the marketer ICP ("a portfolio of upside bets, not a single founder vow").
- **Thesis = marketplace growth.** Products so far (Frockd, the e-bike marketplace) are **marketplaces** → same growth lever (two-sided demand). Sharpens the pitch to "**marketplace-growth specialist across a portfolio**" and makes a marketer's skill compound. Risk: marketplace growth is the hardest kind and that talent is the scarcest.
- **Bench model.** Proven marketers get first pick of new products. The **bench of trusted growth partners is the compounding asset**, more than the products — each successful deal is the credential that staffs the next.
- **The bottleneck is marketers, not products.** Building is cheap; finding ~1 quality marketplace-growth partner/month is the constraint. **Success metric = active partnerships producing revenue, not products listed.**
- **90-day goal: 1 marketer *truly* engaged** — term sheet signed *and* actively working a product (not "expressed interest"). Case zero = Frockd.
- **Future conflict to manage (if/when opening up):** the studio would compete for the same marketers on a platform it controls (owns the `featured` slot). Design for fairness then.

## Who I am / origin

Adam — builds marketplace web apps (Next.js + TypeScript + Postgres on Railway). The idea came from his own pain: he can build products fast (faster now with AI), but shipped products sit unseen. The platform productises "I built it, now I can't market it."

---

## The decision chain (how we got here — don't re-litigate)

1. **Started broad:** "experts who build + marketers who promote." Too vague.
2. **Narrowed to co-founder matching** → then realised generic co-founder matching is effectively solved (YC's free, network-effect-heavy platform). Don't compete horizontally.
3. **Picked the wedge:** the *builder who ships but can't market*, paired with someone who owns go-to-market. Narrow + opinionated beats horizontal.
4. **Resolved the "other side":** it's a **marketer / growth person**, not an idea-haver. (Adam already has ideas; the gap is marketing.)
5. **Deal structure → rev-share.** Not equity (marketers won't bet on a pre-launch dream) and not cash retainer (bootstrapped builders don't have it). Rev-share aligns incentives.
6. **ICP locked:** builders with a **live, working product and little/no traction** — ideally **live-but-zero-revenue**, because at a $0 baseline attribution is clean (every dollar after the marketer joins is plausibly theirs). This kills the rev-share attribution problem.
7. **Scarce side = marketers.** Builders willing to deal are common; growth people who'll take rev-share over cash are not. Seed the marketer side first, concierge-style. Target subtype: upside-seekers / aspiring founders, early-career growth people needing a proof-point, and niche specialists — NOT in-demand full-roster pros.
8. **The real product is trust + diligence — but we DON'T certify.** Judging ideas = non-scalable curator who owns the blame when deals flop. Instead **facilitate**: force both sides to produce **costly signals** (a builder's verified revenue; an idea-haver's real waitlist/customer interviews; a marketer choosing rev-share over cash is itself a validation event) and make them legible to each other. Monetization = a cut of revenue flowing through the payment/verification layer.
9. **Parked for phase 2 — the mirror** (marketer brings idea, builder builds it for rev-share). More viable than it first looks because AI shrinks the build to a weekend-sized bet — BUT only if (a) the platform does real idea-validation and (b) the product is in the sweet spot: non-trivial enough to need a builder, not so complex the weekend bet becomes a month. Use milestone/escrowed deferred cash for this, NOT pure rev-share (no revenue to share until it ships). Don't run both directions at launch — splits liquidity across four marketplace corners.
10. **Build philosophy:** building is cheap now, so point the cheap build at the *scariest* assumption (do marketers respond?), not the easiest (the marketplace CRUD). First build = a marketer-facing landing page (demand test), with Adam as the concierge behind the curtain. Build the real platform only after marketers bite.

---

## Frockd pilot — the first live opportunity

- **Frockd.com.au** — Australian formal-dress marketplace; users list dresses for a **listing fee** (listing fee is the **only** revenue line; no success/commission fee).
- **Live, works, ~zero traction.** This is "case zero" — Adam should run the first real rev-share deal on his own product to learn and produce a case study.
- **Key Frockd-specific tension:** revenue (listing fees) is one step removed from what makes the marketplace healthy (**buyer demand** → dresses sell → sellers keep paying to list). So a marketer paid on listings could game it by flooding dead listings.
  - **Fix:** pay the marketer on listing-fee revenue, but **judge/renew them on completed sales** (the 90-day performance gate measures sales, not listings).

### Term sheet (illustrative — confirm before sending to a real marketer)
- Revenue shared: **net listing-fee revenue** (after payment processing)
- Baseline: **$0** at start date
- Share: **30%** of net-new (market band 25–40% for owning *all* growth; generous because it's his own pilot)
- Duration: **24 months active**, then declining tail (50% in mo 25–36, 25% in mo 37–48, then ends)
- Performance gate: **90-day checkpoint on completed sales**, either side can walk
- Scope: marketer owns all growth channels; Adam retains product ownership/roadmap; no equity, no IP transfer
- Reporting: monthly payout, read-access to revenue dashboard

### Where to find the first marketer
Indie Hackers, r/SaaS, r/marketing, MicroConf / SaaS-growth Slacks, build-in-public X circles, and warm second-degree network. Pitch ONE specific winnable project to ONE hand-picked person — never a generic "marketer wanted" post.

---

## Tech stack (matches Frockd)

- **Next.js 14 (App Router) + TypeScript**
- **Postgres** via `pg` (designed for **Railway**)
- No CSS framework — bespoke styles in `app/globals.css`
- Builds should be GitHub repos, pushed to Adam's account (no GitHub MCP connector available in the directory as of last check — use local scaffold + `gh repo create` or manual remote+push)

---

## What's been built so far

> **Current state of the app lives in [`docs/specs/`](./specs/)** — it now has admin auth + user/builder management, DB-backed products with an edit wizard, the deal entity + express-interest wizard, reference data, the `/opportunities` browse + detail pages, email verification / magic-link, and an in-app events log. The items below are **historical** (the original v0).

1. **`Frockd-Growth-Partnership.docx`** — concept one-pager + full term sheet (as a table) + next-step page.
2. **`stake-landing.html`** — original standalone landing page (single HTML file). Superseded by the repo below but still valid as a quick reference.
3. **`stake-repo.zip`** — the landing page rebuilt as a proper Next.js + TS + Postgres repo (the real v0). Builds cleanly. Structure:
   - `app/page.tsx` (server) + `app/ApplyForm.tsx` (client form) + `app/globals.css`
   - `app/api/apply/route.ts` — POSTs applications to Postgres (degrades to console-logging if no `DATABASE_URL`)
   - `lib/db.ts`, `db/schema.sql` (single `applications` table), `scripts/db-init.mjs`
   - README with local setup, Railway deploy, and GitHub push commands
   - Design: dark warm-ink theme, acid-green accent, Fraunces (display) + Hanken Grotesk (body). Deal numbers hardcoded in `page.tsx` as illustrative.

---

## Open questions / risks to keep watching

1. **Cold-start** — seeding the scarce marketer side is make-or-break. The landing page exists to test this.
2. **Attribution** — clean at $0 baseline; gets murky the moment there's an existing revenue baseline.
3. **Trust** — moot under the studio model (Traxn is the builder and pays the marketer directly). Becomes relevant again only if Traxn opens to third-party builders.
4. **Vibe-code tension** — if an idea is simple enough to build in a weekend, the marketer may not need a builder at all; builders are truly needed only for harder builds, which revive time-risk. Don't let the middle hollow out.
5. **Naming** — decided: **Traxn**, domain `traxnhq.com` (exact `traxn.com` taken; note possible confusion with the "Tracxn" company — worth a trademark check before heavy spend).

---

## Next steps (in order)

1. Push the repo to GitHub; deploy to Railway; wire `DATABASE_URL`; run `db:init`.
2. Confirm/lock the Frockd term-sheet numbers.
3. Put the landing page in front of 15–20 hand-picked growth people. Watch the **rate and quality** of applications — that's the demand signal.
4. **Run the Frockd deal for real** with one marketer. Document everything (vetting, which signals mattered, where trust wobbled, payout). This is case study zero.
5. Only then: build the **thin concierge dashboard** (next repo commit, same stack) to track applicants and manage the first deal. NOT the full two-sided platform.

---

## Working relationship notes

Adam values being pushed back on — challenge weak logic directly, surface tensions early, don't just agree. He successfully pushed back on me re: AI lowering the build cost (a valid correction). Don't invent numbers tied to his specific product economics — flag what only he can supply.

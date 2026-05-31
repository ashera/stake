// Static playbook content for the Partnership Tracker (no DB imports — safe to
// import from client components). The DB pieces (prospects, checklist progress)
// are queried in the admin page / API routes.

export type Channel = {
  key: string;
  name: string;
  url?: string;
  what: string;
  moves: string[];
};

// Golden rules that apply everywhere.
export const PRINCIPLES = [
  "Pitch ONE specific winnable project to ONE hand-picked person — never a generic “marketer wanted” post.",
  "Value first: contribute before you ask.",
  "Lead with the growth lever, not a product tour.",
  "Target upside-seekers — aspiring founders, early-career growth, niche specialists — not full-roster pros.",
  "Pitch the studio: “we ship a live marketplace a month, partner on rev-share, $0 baseline.”",
];

// Per-channel approach. `moves` are the trackable checklist items.
export const CHANNELS: Channel[] = [
  {
    key: "indiehackers",
    name: "Indie Hackers",
    url: "https://www.indiehackers.com",
    what: "Bootstrapped builder community — revenue-transparent, upside-oriented. Best single home for the studio rev-share story.",
    moves: [
      "Set up a profile and post a build-in-public update so you're a contributor, not a stranger.",
      "Publish one story post: shipping a live marketplace a month, partnering on rev-share at a $0 baseline (a story, not a job ad).",
      "Identify 5+ growth-minded members from their posts and comments.",
      "Engage genuinely on their threads before any DM.",
      "DM one hand-picked person a specific pitch — name the product and the 30% / $0 terms.",
    ],
  },
  {
    key: "rsaas",
    name: "r/SaaS",
    url: "https://www.reddit.com/r/SaaS/",
    what: "SaaS founders & operators — practical, blunt, strict self-promo rules. Builder-heavy, so hunt individuals.",
    moves: [
      "Read the subreddit's self-promo / “looking for partner” rules before posting anything.",
      "Add value in growth/marketing threads first to build credibility.",
      "Spot growth-leaning commenters; check profiles for marketplace / demand experience.",
      "Reach out 1:1 (or via an allowed promo thread) — never a generic “marketer wanted” post.",
    ],
  },
  {
    key: "rmarketing",
    name: "r/marketing",
    url: "https://www.reddit.com/r/marketing/",
    what: "Broad marketing subreddit — more pure marketers than r/SaaS.",
    moves: [
      "Engage in demand-gen / growth discussions to surface marketplace-savvy marketers.",
      "Look for people who talk about two-sided / demand problems (your thesis).",
      "DM the specific opportunity, leading with the growth lever.",
    ],
  },
  {
    key: "growth-communities",
    name: "Growth communities (RevGenius, Demand Curve, Slacks)",
    what: "Where pure growth talent congregates — likely your highest-yield channel for marketers.",
    moves: [
      "Join 1–2 (RevGenius, the Demand Curve community, a SaaS-growth Slack).",
      "Introduce yourself + the studio rev-share offer in the right channel (intros / partners).",
      "Hunt for marketplace-growth specialists — your best-fit prospects.",
      "DM specific people with the Frockd / e-bike pitch.",
    ],
  },
  {
    key: "build-in-public-x",
    name: "Build-in-public (X)",
    url: "https://x.com",
    what: "Founders & growth people sharing in the open — good for warming reputation + inbound.",
    moves: [
      "Post a build-in-public thread: shipping a marketplace a month, seeking growth partners on rev-share.",
      "Reply with substance on build-in-public + growth accounts (don't just broadcast).",
      "DM hand-picked growth people a specific, winnable pitch.",
    ],
  },
  {
    key: "microconf",
    name: "MicroConf / SaaS circles",
    what: "Bootstrapped SaaS network — best for warm intros.",
    moves: [
      "Tap MicroConf Connect / your network for a warm intro to a growth person.",
      "Ask second-degree contacts for one intro to someone who'd take upside.",
    ],
  },
];

export const PROSPECT_STATUSES = [
  "Identified",
  "Engaging",
  "Contacted",
  "In conversation",
  "Won",
  "Lost",
];

export type Prospect = {
  id: string;
  name: string;
  channel: string;
  link: string;
  status: string;
  nextStep: string;
  createdAt: string;
};

export type Post = {
  id: string;
  title: string;
  channel: string;
  body: string;
};

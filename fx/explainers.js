// Page explainers: which page gets which 3D section, where it goes (the
// section heading it sits next to), and its words, steps, live stat and data.
// Figures are illustrative and labelled as such on the page; facts about the
// business (founded 2016, 200+ creatives, 15+ services, 20,000+ businesses,
// team in EU · US · LATAM) come from the site itself.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---- SEO ----------------------------------------------------------------------
const RANKS = [48, 34, 22, 14, 9, 5, 3, 2, 1];
const rankAt = (p) => {
  const f = clamp(p, 0, 1) * (RANKS.length - 1);
  const i = Math.floor(f);
  return lerp(RANKS[i], RANKS[Math.min(i + 1, RANKS.length - 1)], f - i);
};
const SEO = {
  key: 'seo',
  eyebrow: '// how SEO builds over time',
  title: 'Climb to <em>page one.</em>',
  lede: 'SEO is slow at first, then it compounds. Here’s how a local business typically climbs Google over a year.',
  steps: [
    { title: 'Month 1: fix the basics', text: 'Speed, structure and the technical issues that stop Google from ranking you.' },
    { title: 'Months 2–4: publish helpful pages', text: 'Articles and service pages that answer what your customers actually search for.' },
    { title: 'Months 4–8: earn trust', text: 'Links from respected sites and reviews that show Google you’re the real deal.' },
    { title: 'Months 8–12: hold the top spots', text: 'Fresh content keeps you climbing while competitors stand still.' },
  ],
  stat: (p) => {
    const r = Math.round(rankAt(p));
    return [`#${r}`, `Month ${Math.round(p * 12)} · page ${Math.ceil(r / 10)} of Google`];
  },
  note: 'Illustrative climb for one search term; real timelines depend on your competition, website and budget.',
  pin: 2.4,
  scene: () => import('./three/ex-seo.js'),
  sceneOpts: { ranks: RANKS },
};

// ---- Conversion tracking ------------------------------------------------------
const TRACK_STEPS = [
  { title: 'They see your ad', text: 'We record which ad, audience and placement they saw.' },
  { title: 'They click', text: 'The click is tied to the ad, so you know which ads earn attention.' },
  { title: 'They visit your site', text: 'Page views and time on site show which ads bring real interest.' },
  { title: 'They add to cart', text: 'Add-to-carts and form starts reveal who is close to buying.' },
  { title: 'They buy', text: 'The sale is sent back to Meta and Google, so their algorithms find more buyers like this one.' },
];
const TRACK = {
  key: 'track',
  eyebrow: '// what tracking actually does',
  title: 'Follow <em>the customer.</em>',
  lede: 'Tracking records every step from ad to sale, so your budget goes to the ads that actually sell.',
  steps: TRACK_STEPS,
  stat: (p) => {
    const i = Math.min(TRACK_STEPS.length, Math.floor(p * TRACK_STEPS.length * 0.9999) + 1);
    return [`${i} of ${TRACK_STEPS.length}`, 'steps of the journey tracked'];
  },
  note: 'Simplified: real setups use the Meta Pixel and Conversions API, Google Ads conversion tracking and GA4.',
  pin: 2.2,
  scene: () => import('./three/ex-track.js'),
};

// ---- Short-form video hooks ---------------------------------------------------
const strong = (s) => 0.55 + 0.45 * Math.exp(-s / 4);
const weak = (s) => 0.2 + 0.8 * Math.exp(-s / 1.1);
const HOOK = {
  key: 'hook',
  eyebrow: '// why the hook matters',
  title: 'Win the <em>first 3 seconds.</em>',
  lede: 'Most viewers decide in the first three seconds whether to keep watching. Here’s what a strong hook does to the rest of the video.',
  steps: [
    { title: '0–3 seconds: the hook', text: 'A bold claim, a question or a surprising visual that stops the scroll.' },
    { title: '3–10 seconds: the value', text: 'Deliver what the hook promised, fast, with captions for people watching on mute.' },
    { title: '10–15 seconds: the payoff', text: 'The result or reveal, then one clear next step: follow, visit or book.' },
  ],
  stat: (p) => {
    const s = p * 15;
    return [`${Math.round(strong(s) * 100)}%`, `still watching at ${Math.round(s)}s with a strong hook, vs ${Math.round(weak(s) * 100)}% with a weak one`];
  },
  note: 'Illustrative retention curves; real numbers vary by platform, niche and audience.',
  pin: 2,
  scene: () => import('./three/ex-hook.js'),
  sceneOpts: { strong, weak },
};

// ---- Instagram growth -------------------------------------------------------------
const REAL = [450, 1000, 1650, 2400, 3300, 4300];
const BOUGHT = [5000, 5040, 5060, 5070, 5080, 5090];
const GROWTH = {
  key: 'growth',
  eyebrow: '// real vs. bought',
  title: 'Real followers <em>actually engage.</em>',
  lede: 'Bought followers look good for a week. Real ones like, comment, share and buy. Here’s the difference over six months.',
  steps: [
    { title: 'Month 1: the spike', text: 'Bought followers arrive overnight. Real growth starts small, with people who care about what you do.' },
    { title: 'Months 2–4: the gap', text: 'Real followers keep coming and keep engaging. Bought ones never like or comment, so Instagram shows your posts to fewer people.' },
    { title: 'Months 5–6: the result', text: 'A real audience reaches more people and brings customers; a bought one just sits there.' },
  ],
  stat: (p) => {
    const m = clamp(Math.ceil(p * 6), 1, 6);
    return [`${Math.round(REAL[m - 1] * 0.06)} vs ${Math.round(BOUGHT[m - 1] * 0.003)}`, `people engaging in month ${m}: real vs. bought followers`];
  },
  note: 'Illustrative comparison, assuming about 6% of real followers and 0.3% of bought ones engage each month.',
  pin: 2,
  scene: () => import('./three/ex-growth.js'),
  sceneOpts: { real: REAL, bought: BOUGHT },
};

// ---- Book a demo -------------------------------------------------------------------
const CALL_CARDS = [
  { time: '5 min', title: 'We get to know your business', text: 'Your goals, your customers and what you’ve tried so far.' },
  { time: '10 min', title: 'We show you real examples', text: 'Content we’d make for a business like yours, and how the platform works.' },
  { time: '5 min', title: 'You get a plan and a price', text: 'A clear recommendation. No pitch deck, no pressure, no obligation.' },
];
const CALL = {
  key: 'call',
  eyebrow: '// what happens on the call',
  title: '20 minutes. <em>No pressure.</em>',
  lede: 'Here’s exactly what to expect when you book a call with us.',
  steps: CALL_CARDS.map((c) => ({ title: `${c.title} (${c.time})`, text: c.text })),
  pin: 1.4,
  autoplay: 6,
  scene: () => import('./three/ex-call.js'),
  sceneOpts: { cards: CALL_CARDS },
};

// ---- Reseller -----------------------------------------------------------------------
const LAYERS = {
  key: 'layers',
  eyebrow: '// how white-label works',
  title: 'Your brand on top. <em>Our team underneath.</em>',
  lede: 'Your clients only ever see your brand. Underneath, a full creative team does the work.',
  steps: [
    { title: 'Your brand', text: 'Your name, logo and prices. Clients deal with you, never with us.' },
    { title: 'Planning and approvals', text: 'Content calendars, approval links and reports, all white-labelled.' },
    { title: 'The creative team', text: 'Designers, copywriters and video editors produce the work.' },
    { title: 'Quality and delivery', text: 'Every piece is checked and delivered on schedule, ready for you to send.' },
  ],
  pin: 2,
  scene: () => import('./three/ex-layers.js'),
  sceneOpts: {
    layers: [
      { name: 'Quality checks and delivery', face: 'Quality checks · on-time delivery' },
      { name: 'Designers, writers and editors', face: 'Designers · writers · video editors' },
      { name: 'Calendar, approvals and reports', face: 'Calendar · approvals · reports' },
      { name: 'Your brand', face: 'YOUR AGENCY' },
    ],
  },
};

// ---- About ---------------------------------------------------------------------------
const GLOBE = {
  key: 'globe',
  eyebrow: '// where we work',
  title: 'A remote team, <em>close to you.</em>',
  lede: 'Our creatives work across Europe, the US and Latin America, so there’s always someone on your time zone.',
  steps: [
    { title: '2016: founded', text: 'Started to make professional marketing affordable for small businesses.' },
    { title: '200+ creatives', text: 'Vetted designers, writers and editors across Europe, the US and Latin America.' },
    { title: '15+ services', text: 'Social, video, ads, SEO, email and more, under one subscription.' },
    { title: '20,000+ businesses', text: 'Served since 2016, from local shops to growing brands.' },
  ],
  pin: 2,
  scene: () => import('./three/ex-globe.js'),
  sceneOpts: {
    places: [
      { name: 'Europe', lat: 50, lon: 10 },
      { name: 'United States', lat: 39, lon: -98 },
      { name: 'Latin America', lat: -15, lon: -60, color: 0x0a0b10 },
    ],
  },
};

const PRICING = [/pricing\s*&\s*plans/i, /real results/i];
const PAGES = {
  'seo-services': { anchors: [/why businesses pick us/i, ...PRICING], def: SEO },
  'managed-seo': { anchors: [/from kickoff/i, ...PRICING], def: SEO },
  'seo-blog-posts': { anchors: PRICING, def: SEO },
  'seo-backlinks': { anchors: [/real links on real sites/i, /frequently asked/i], def: SEO },
  'conversion-tracking': { anchors: [/everything we set up/i, ...PRICING], def: TRACK },
  'short-form-video': { anchors: [/every video has one job/i, ...PRICING], def: HOOK },
  'instagram-growth': { anchors: [/fake followers/i, ...PRICING], def: GROWTH },
  'book-demo': { anchors: [/see how it works/i], position: 'after', def: CALL },
  reseller: { anchors: [/sell more/i, /real results/i], def: LAYERS },
  about: { anchors: [/principles behind/i, /real results/i], def: GLOBE },
};

// Explainer for the current page, or null.
export function explainerFor(pathname) {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');
  return PAGES[parts[0]] || null;
}

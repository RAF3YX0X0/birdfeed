// Pages the cloned site didn't have, asked for in the client's requirements
// (2026-10): Careers (linked from the footer only) and the Cookie policy.
// Plain pages: inject-fx.js adds the navbar, footer and the FX layer, and
// optimize-pages.js the SEO tags, like everywhere else.
//
//   node scripts/build-static-pages.js   (then inject-fx.js, optimize-pages.js)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://madmarketinghaseeb.vercel.app';
const EMAIL = 'hello@madmediamarketing.com';
const UPDATED = 'October 6, 2026';

const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const page = ({ slug, title, description, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | MadMarketing</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#F5F7FA">
<link rel="canonical" href="${SITE}/${slug}/">
<meta property="og:title" content="${title} | MadMarketing">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${SITE}/${slug}/">
<link rel="icon" type="image/svg+xml" href="/assets/madmarketing-mark.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/madmarketing-icon-32.png">
<link rel="apple-touch-icon" href="/assets/madmarketing-apple-touch.png">
<link rel="preload" as="font" type="font/woff2" href="/fonts/satoshi-variable.woff2" crossorigin><style>
@font-face { font-family: Satoshi; font-style: normal; font-weight: 100 900; font-display: swap; src: url(/fonts/inter-latin-wght-normal.woff2) format("woff2"); }
@font-face{font-family:Satoshi;font-style:normal;font-weight:300 900;font-display:swap;src:url(/fonts/satoshi-variable.woff2) format("woff2")}@font-face{font-family:"Satoshi Fallback";src:local("Arial");ascent-override:93.3%;descent-override:22.17%;line-gap-override:9.24%;size-adjust:108.25%}
body { margin: 0; background: #F5F7FA; color: #0A0A0A; font-family: Satoshi, Satoshi Fallback, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.stp { padding: 150px 24px 40px; }
.stp__in { max-width: 1080px; margin: 0 auto; }
.stp__k { display: inline-flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #4B5563; }
.stp__k::before { content: ''; width: 32px; height: 1px; background: #0066FF; }
.stp h1 { margin: 22px 0 0; max-width: 820px; font-size: clamp(42px, 6vw, 84px); font-weight: 600; line-height: 1.02; letter-spacing: -0.031em; text-wrap: balance; }
.stp h1 em { font-family: Satoshi, Satoshi Fallback, system-ui, sans-serif; font-style: normal; font-weight: inherit; font-size: 1em; letter-spacing: inherit; color: #0066FF; }
.stp__lede { max-width: 600px; margin: 22px 0 0; font-size: 18px; line-height: 1.6; color: #4B5563; }
.stp__meta { margin: 18px 0 0; font-size: 14px; color: #858C99; }
.stb { padding: 30px 24px 120px; }
.stb__in { max-width: 1080px; margin: 0 auto; }
.st-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.st-card { padding: 26px; border-radius: 26px; background: #fff; box-shadow: 0 0 0 1px #E5E7EB, 0 24px 50px -40px rgba(20, 30, 70, 0.45); }
.st-card b { display: block; font-size: 19px; font-weight: 600; letter-spacing: -0.02em; }
.st-card p { margin: 8px 0 0; font-size: 15px; line-height: 1.6; color: #4B5563; }
.st-h2 { margin: 0 0 22px; font-size: clamp(28px, 3.2vw, 40px); font-weight: 600; letter-spacing: -0.026em; }
.st-h2 em { font-family: Satoshi, Satoshi Fallback, system-ui, sans-serif; font-style: normal; font-weight: inherit; color: #0066FF; }
.st-apply { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 24px; margin-top: 56px; padding: clamp(26px, 4vw, 44px); border-radius: 32px; background: radial-gradient(80% 140% at 100% 0%, rgba(0, 102, 255, 0.5), rgba(0, 102, 255, 0) 65%), #0A0A0A; color: #fff; }
.st-apply h2 { margin: 0; font-size: clamp(26px, 3vw, 38px); font-weight: 600; letter-spacing: -0.026em; }
.st-apply p { margin: 10px 0 0; max-width: 560px; font-size: 16px; line-height: 1.6; color: rgba(255, 255, 255, 0.72); }
.st-btn { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 24px; border-radius: 999px; background: #0066FF; color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; white-space: nowrap; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 14px 30px -12px rgba(0, 102, 255, 0.9); }
.st-btn:hover { background: #0052CC; }
.st-doc > * { max-width: 760px; }
.st-doc h2 { margin: 44px 0 0; font-size: 24px; font-weight: 600; letter-spacing: -0.021em; }
.st-doc p, .st-doc li { font-size: 16.5px; line-height: 1.7; color: #1F2937; }
.st-doc ul { padding-left: 20px; }
.st-doc code { padding: 2px 7px; border-radius: 6px; background: #EEF1F5; font-size: 14px; }
.st-doc a { color: #0066FF; }
.st-table { width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 15px; }
.st-table th, .st-table td { padding: 12px 14px; border-bottom: 1px solid #E5E7EB; text-align: left; vertical-align: top; color: #1F2937; }
.st-table th { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #858C99; }
@media (max-width: 760px) {
  .stp { padding: 120px 20px 24px; }
  .stb { padding: 20px 20px 90px; }
  .st-grid { grid-template-columns: minmax(0, 1fr); }
  .st-apply { grid-template-columns: minmax(0, 1fr); }
  .st-table { font-size: 14px; }
}
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;

// ---- Careers --------------------------------------------------------------------------------
const roles = [
  ['Designers', 'Social posts, carousels, ads and landing pages that look like the brand they’re for.'],
  ['Video editors', 'Short-form video for Reels, TikTok and Shorts: hooks, pacing, captions.'],
  ['Writers', 'Captions, blog posts, emails and ad copy, in each client’s own voice.'],
  ['Ads specialists', 'Meta and Google campaigns, run and optimized every few days.'],
  ['SEO specialists', 'Content, links and technical fixes that move rankings.'],
  ['Account managers', 'The person a client talks to, who keeps the work on track.'],
];
const careers = page({
  slug: 'careers',
  title: 'Careers',
  description: 'Work at MadMarketing: designers, video editors, writers, ads and SEO specialists, and account managers. Send us your portfolio.',
  body: `<section class="stp"><div class="stp__in">
  <span class="stp__k">Careers</span>
  <h1>Make great marketing <em>with us.</em></h1>
  <p class="stp__lede">We’re a team of creatives and specialists making marketing for small businesses across the US. We’re always glad to meet people who are great at what they do.</p>
</div></section>
<section class="stb"><div class="stb__in">
  <h2 class="st-h2">Who we’re always glad <em>to hear from</em></h2>
  <div class="st-grid">${roles.map(([t, d]) => `<div class="st-card"><b>${t}</b><p>${d}</p></div>`).join('')}</div>
  <div class="st-apply">
    <div><h2>There are no open roles listed right now.</h2><p>Send your portfolio or CV and a short note about what you do best. Put the role in the subject line, and we’ll be in touch when something fits.</p></div>
    <a class="st-btn" href="mailto:${EMAIL}?subject=${encodeURIComponent('Careers: ')}">Email ${EMAIL} ${ARROW}</a>
  </div>
</div></section>`,
});

// ---- Cookie policy ------------------------------------------------------------------------------
// Only what the site actually does: no advertising or analytics cookies; a
// few small entries in the browser's own storage; Calendly on the demo page.
const cookies = page({
  slug: 'cookie-policy',
  title: 'Cookie Policy',
  description: 'How the MadMarketing website uses cookies and your browser’s storage, and how to control them.',
  body: `<section class="stp"><div class="stp__in">
  <span class="stp__k">Legal</span>
  <h1>Cookie <em>policy.</em></h1>
  <p class="stp__meta">Last updated ${UPDATED}</p>
</div></section>
<section class="stb"><div class="stb__in st-doc">
  <p>This policy explains how the MadMarketing website uses cookies and similar technologies, and how you can control them. It covers this website only. Our <a href="/privacy/">Privacy Policy</a> explains how we handle personal information more generally.</p>

  <h2>What cookies are</h2>
  <p>Cookies are small text files a website saves in your browser. Websites can also keep small pieces of information in your browser’s own storage (called local storage and session storage). Both let a site remember something between pages or visits.</p>

  <h2>What this website uses</h2>
  <p>We don’t use advertising or analytics cookies, and we don’t track you across other websites. The site keeps a few small entries in your browser’s storage so it works the way you’d expect. They stay on your device and aren’t sent to us.</p>
  <table class="st-table">
    <thead><tr><th>Name</th><th>Type</th><th>What it’s for</th><th>How long</th></tr></thead>
    <tbody>
      <tr><td><code>fx-seen</code></td><td>Session storage</td><td>Remembers that you’ve already seen the short intro animation, so it only plays on the first page of your visit.</td><td>Until you close the tab</td></tr>
      <tr><td><code>fb_demo_popup</code></td><td>Local storage</td><td>Remembers that you closed the “book a demo” prompt, so it doesn’t keep coming back.</td><td>Until you clear it</td></tr>
      <tr><td><code>fb_price_email</code>, <code>fb_exit_quote</code></td><td>Local storage</td><td>Remember whether you’ve already seen or used the offer to email you your plan’s price, so it isn’t shown again.</td><td>Until you clear it</td></tr>
    </tbody>
  </table>

  <h2>Third-party services</h2>
  <p>When you book a call on our <a href="/book-demo/">demo page</a>, the booking calendar is provided by Calendly. Calendly may set its own cookies to make the calendar work; these are covered by Calendly’s own cookie and privacy policies. Links to our Facebook page or to WhatsApp take you to those services, whose own policies then apply.</p>

  <h2>Controlling cookies and storage</h2>
  <p>You can block or delete cookies and site storage in your browser’s settings at any time. Clearing this site’s data resets the entries above; the site will still work, and the intro and prompts may simply show again.</p>

  <h2>Changes to this policy</h2>
  <p>If we add tools that use cookies, such as analytics or payments, we’ll update this page and the date above first.</p>

  <h2>Contact us</h2>
  <p>Questions about this policy? Email <a href="mailto:${EMAIL}">${EMAIL}</a>, or write to MadMarketing, 2055 Craigshire Dr, St. Louis, MO 63146, United States.</p>
</div></section>`,
});

for (const [slug, html] of [['careers', careers], ['cookie-policy', cookies]]) {
  fs.mkdirSync(path.join(ROOT, slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, slug, 'index.html'), html);
}
console.log('static pages: careers, cookie-policy');

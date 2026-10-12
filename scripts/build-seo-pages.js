// The pages the homepage copy links to (client brief, 2026-10): four service
// pages under /services/. The client
// hasn't written these pages yet: the copy follows the homepage's voice and
// makes no claims about results, rankings or numbers. Replace it with theirs
// when it arrives.
//
// Plain pages: inject-fx.js adds the navbar, footer and FX layer;
// optimize-pages.js the SEO tags.
//
//   node scripts/build-seo-pages.js   (then build-fx.js, optimize-pages.js)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://madmarketinghaseeb.vercel.app';
const EMAIL = 'hello@madmediamarketing.com';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GLYPH = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  cursor: '<path d="m4 4 7 17 2.5-7.5L21 11z"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  road: '<path d="M4 20 8 4M20 20 16 4M12 6v2M12 11v2M12 16v2"/>',
};
const glyph = (n, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[n] || GLYPH.sparkle}</svg>`;

const CSS = `
@font-face{font-family:Satoshi;font-style:normal;font-weight:300 900;font-display:swap;src:url(/fonts/satoshi-variable.woff2) format("woff2")}
@font-face{font-family:"Satoshi Fallback";src:local("Arial");ascent-override:93.3%;descent-override:22.17%;line-gap-override:9.24%;size-adjust:108.25%}
body{margin:0;background:#F5F7FA;color:#0A0A0A;font-family:Satoshi,"Satoshi Fallback",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sp{--blue:#0066FF;--ink:#0A0A0A;--muted:#4B5563;--faint:#858C99;--line:#E5E7EB}
.sp-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.sp .sp-k{display:inline-flex;align-items:center;gap:14px;margin:0;font-size:12px!important;line-height:1.3!important;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#4B5563}
.sp-k::before{content:'';width:34px;height:1.5px;border-radius:2px;background:linear-gradient(90deg,rgba(0,102,255,0),#0066FF)}
.sp-dark .sp-k{color:rgba(255,255,255,.62)}.sp-dark .sp-k::before{background:linear-gradient(90deg,rgba(77,148,255,0),#4D94FF)}
.sp h1,.sp h2{margin:0;font-weight:600;letter-spacing:-.031em;line-height:1.04;text-wrap:balance}
.sp h1{margin-top:20px;font-size:clamp(40px,5.4vw,72px)}
.sp h2{margin-top:16px;font-size:clamp(30px,3.6vw,48px)}
.sp h1 em,.sp h2 em{font-style:normal;color:#0066FF}.sp-dark h2 em{color:#4D94FF}
.sp-lede{max-width:620px;margin:22px 0 0;font-size:clamp(17px,1.4vw,19px);line-height:1.6;color:#4B5563}
.sp-btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.sp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:12px 26px;border-radius:999px;font-size:15px;font-weight:500;text-decoration:none;text-align:center;transition:transform .3s cubic-bezier(.22,1,.36,1),background .2s ease;cursor:pointer;border:0}
.sp-btn:hover{transform:translateY(-2px)}
.sp-btn--blue{background:#0066FF;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 10px 24px -10px rgba(0,102,255,.8)}.sp-btn--blue:hover{background:#0052CC}
.sp-btn--white{background:#fff;color:#0A0A0A;box-shadow:0 0 0 1px rgba(10,10,10,.08),0 8px 20px -12px rgba(20,30,70,.3)}
.sp-hero{padding:150px 0 40px}
.sp-hero__grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:48px;align-items:center}
.sp-hero__card{position:relative;padding:28px;border-radius:32px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 50px 100px -60px rgba(20,30,70,.55);transform:perspective(1400px) rotateY(-8deg) rotateX(4deg);transition:transform .8s cubic-bezier(.22,1,.36,1)}
.sp-hero__card:hover{transform:perspective(1400px) rotateY(0) rotateX(0)}
.sp-hero__card::before{content:'';position:absolute;inset:-40px -40px auto auto;width:220px;height:220px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,102,255,.25),transparent);z-index:-1}
.sp-hero__card h3{margin:0 0 16px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#858C99}
.sp-ticks{margin:0;padding:0;list-style:none;display:grid;gap:12px}
.sp-ticks li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px;line-height:1.45}
.sp-ticks i{flex:none;display:grid;place-items:center;width:22px;height:22px;margin-top:1px;border-radius:50%;background:#0066FF;color:#fff}
.sp-ticks--no i{background:#F1F2F4;color:#6B7280}
.sp-sec{padding:clamp(64px,8vw,110px) 0}
.sp-proof{padding-top:0}
.sp-proof__card{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(24px,4vw,56px);align-items:center;padding:clamp(24px,3.4vw,44px);border-radius:32px;background:#0A0A0A;color:#fff;overflow:hidden}
.sp-proof__card .sp-k{color:rgba(255,255,255,.62)}.sp-proof__card .sp-k::before{background:linear-gradient(90deg,rgba(77,148,255,0),#4D94FF)}
.sp-proof__card h2 em{color:#4D94FF}
.sp-proof__card>div>p{margin:16px 0 0;max-width:520px;font-size:17px;line-height:1.6;color:rgba(255,255,255,.72)}
.sp-proof__stats{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0 0;padding:0;list-style:none}
.sp-proof__stats li{flex:1 1 140px;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.sp-proof__stats b{display:block;font-size:30px;font-weight:600;letter-spacing:-.025em;color:#4D94FF}
.sp-proof__stats span{display:block;margin-top:6px;font-size:13px;line-height:1.4;color:rgba(255,255,255,.66)}
.sp-proof__src{margin:16px 0 0!important;font-size:12px!important;color:rgba(255,255,255,.45)!important}
.sp-proof__link{display:inline-flex;align-items:center;gap:8px;margin-top:22px;color:#fff;font-weight:600;font-size:15px;text-decoration:none}
.sp-proof__link:hover{color:#4D94FF}
.sp-proof__shot{display:block;justify-self:center;width:min(100%,290px);height:430px;object-fit:cover;object-position:top;border-radius:22px;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 40px 80px -40px rgba(0,102,255,.6)}
.sp-proof__bars{display:grid;gap:12px;margin:0;padding:22px;border-radius:22px;background:#fff;color:#0A0A0A;list-style:none}
.sp-proof__bars li{display:grid;grid-template-columns:minmax(96px,36%) 1fr auto;align-items:center;gap:12px;font-size:13.5px}
.sp-proof__bars i{height:10px;border-radius:99px;background:linear-gradient(90deg,#0066FF var(--w),#EEF1F5 var(--w))}
.sp-proof__bars b{font-variant-numeric:tabular-nums}
.sp-proof__bars small{grid-column:1/-1;font-size:11.5px;color:#858C99}
@media (max-width:860px){.sp-proof__card{grid-template-columns:minmax(0,1fr)}.sp-proof__shot{width:min(100%,260px);height:360px}}
.sp-head{max-width:760px}
.sp-head p{margin:16px 0 0;font-size:17px;line-height:1.6;color:#4B5563}
.sp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:40px}
.sp-card{padding:26px;border-radius:26px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 24px 50px -40px rgba(20,30,70,.45);transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
.sp-card:hover{transform:translateY(-4px);box-shadow:0 0 0 1px rgba(0,102,255,.35),0 30px 60px -36px rgba(0,102,255,.45)}
.sp-card__ic{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#EBF3FF;color:#0066FF}
.sp-card b{display:block;margin-top:18px;font-size:18px;font-weight:600;letter-spacing:-.015em}
.sp-card p{margin:8px 0 0;font-size:15px;line-height:1.6;color:#4B5563}
.sp-dark{margin:0 24px;border-radius:40px;padding:clamp(48px,6vw,80px) 0;color:#fff;background:radial-gradient(70% 90% at 85% 0%,rgba(0,102,255,.45),rgba(0,102,255,0) 65%),#0A0A0A}
.sp-steps{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:16px;margin:40px 0 0;padding:0;list-style:none}
.sp-step{position:relative;overflow:hidden;min-height:220px;padding:26px;border-radius:26px;background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);display:flex;flex-direction:column;justify-content:flex-end}
.sp-step__n{position:absolute;top:-.1em;right:.08em;font-size:130px;font-weight:800;line-height:1;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(77,148,255,.5) 55%,rgba(0,102,255,0) 92%);-webkit-background-clip:text;background-clip:text;color:transparent}
.sp-step b{font-size:20px;font-weight:600;letter-spacing:-.015em}
.sp-step p{margin:8px 0 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,.72)}
.sp-faq{display:grid;gap:10px;margin-top:36px;max-width:860px}
.sp-faq details{border-radius:20px;background:#fff;box-shadow:0 0 0 1px #E5E7EB}
.sp-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;padding:20px 24px;font-size:17px;font-weight:600}
.sp-faq summary::-webkit-details-marker{display:none}
.sp-faq summary::after{content:'+';flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#F1F2F4;font-weight:500;transition:transform .3s ease}
.sp-faq details[open] summary::after{transform:rotate(45deg);background:#0066FF;color:#fff}
.sp-faq p{margin:0;padding:0 24px 22px;font-size:15.5px;line-height:1.65;color:#4B5563}
.sp-cta{margin:0 24px clamp(64px,8vw,110px);padding:clamp(40px,5vw,64px);border-radius:36px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 40px 80px -60px rgba(20,30,70,.5);text-align:center}
.sp-cta h2{margin:0 auto;max-width:760px}
.sp-cta p{max-width:560px;margin:16px auto 0;font-size:17px;line-height:1.6;color:#4B5563}
.sp-cta .sp-btns{justify-content:center}
.sp-note{margin:14px 0 0;font-size:13px;line-height:1.55;color:#6B7280}
.sp-related{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.sp-related a{padding:8px 14px;border-radius:999px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;color:#0A0A0A;font-size:14px;text-decoration:none}
.sp-related a:hover{color:#0066FF;box-shadow:0 0 0 1px rgba(0,102,255,.4)}
.sp-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:36px}
.sp-two .sp-card b{margin:0 0 16px}
/* Application form */
.sp-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:32px;padding:clamp(24px,3vw,36px);border-radius:30px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 40px 80px -60px rgba(20,30,70,.5)}
.sp-field{display:flex;flex-direction:column;gap:8px}
.sp-field--wide{grid-column:1/-1}
.sp-field>span{font-size:14px;font-weight:600}
.sp-field>span small{font-weight:400;color:#858C99}
.sp-field input,.sp-field select,.sp-field textarea{width:100%;box-sizing:border-box;min-height:48px;padding:12px 16px;border:0;border-radius:14px;background:#F9FAFB;box-shadow:inset 0 0 0 1px #E2E5EA;font:inherit;font-size:15px;color:#0A0A0A}
.sp-field textarea{min-height:110px;resize:vertical}
.sp-field input:focus,.sp-field select:focus,.sp-field textarea:focus{outline:0;background:#fff;box-shadow:inset 0 0 0 1.5px #0066FF,0 0 0 4px rgba(0,102,255,.1)}
.sp-check{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.5;color:#1F2937}
.sp-check input{flex:none;width:18px;height:18px;margin-top:2px;accent-color:#0066FF}
.sp-form__foot{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}
.sp-msg{grid-column:1/-1;margin:0;padding:14px 18px;border-radius:16px;font-size:15px;line-height:1.5}
.sp-msg[hidden]{display:none}.sp-msg--ok{background:#EBF3FF;color:#0040A0}.sp-msg--err{background:#FDECEC;color:#A32121}
.sp-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
@media(max-width:900px){.sp-hero{padding:120px 0 24px}.sp-hero__grid,.sp-two{grid-template-columns:minmax(0,1fr)}.sp-hero__card{transform:none}.sp-grid,.sp-steps{grid-template-columns:minmax(0,1fr)}.sp-dark,.sp-cta{margin-left:12px;margin-right:12px;border-radius:28px}}
@media(max-width:640px){.sp-wrap{padding:0 16px}.sp-form{grid-template-columns:minmax(0,1fr)}}
`;

function page({ slug, title, description, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#F5F7FA">
<link rel="canonical" href="${SITE}/${slug}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}/${slug}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" type="image/svg+xml" href="/assets/madmarketing-mark-v2.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/madmarketing-icon-32-v2.png">
<link rel="apple-touch-icon" href="/assets/madmarketing-apple-touch-v2.png">
<link rel="preload" as="font" type="font/woff2" href="/fonts/satoshi-variable.woff2" crossorigin>
<style>${CSS}</style>
</head>
<body>
<main class="sp">
${body}
</main>
</body>
</html>
`;
}

const faqLd = (qa) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>`;
const serviceLd = (name, desc, slug) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name, description: desc, url: `${SITE}/${slug}/`, areaServed: 'US', provider: { '@type': 'Organization', name: 'MADMarketing', url: SITE + '/' } })}</script>`;

const RELATED = [
  ['/services/local-seo/', 'Local SEO'],
  ['/services/google-maps-seo/', 'Google Maps SEO'],
  ['/services/ai-search-optimization/', 'AI Search Visibility'],
  ['/services/google-ads/', 'Google Ads'],
  ['/pricing/', 'Pricing'],
];

const MAD = [
  ['M', 'Market Intelligence', 'We study search behavior, customer needs, competitors, and opportunities before choosing a direction.'],
  ['A', 'Attention & Authority', 'We build visibility and credibility through search, content, advertising, and brand experiences.'],
  ['D', 'Data-Driven Growth', 'We measure meaningful actions, explain performance, and refine the work that matters.'],
];

// Client work behind a service: real figures, each with its source (the
// full stories are on /case-studies/, from scripts/work-data.js).
const PROOF = {
  tgh: {
    name: 'The Gentry House', accent: 'Lake Saint Louis.',
    line: 'A premium barbershop whose website and Google Business Profile we run. Its site answers the searches locals make, and its profile carries the services, hours, booking link and photos.',
    stats: [['5.0★', 'on Google, from 201 reviews'], ['55', 'photos on its Google profile'], ['280', 'reviews across Google and Booksy']],
    src: 'Google Maps and Booksy, checked 13 October 2026',
    shot: ['/work/the-gentry-house/google-profile.webp', 408, 882, 'The Gentry House’s Google Business Profile: 5.0 from 201 reviews'],
    href: '/case-studies/#the-gentry-house',
  },
  smart: {
    name: 'Smart Cities UAE', accent: 'Dubai.',
    line: 'A construction and fit-out company that had never run Google Ads. We set up the account and conversion tracking, and launched its first search campaigns.',
    stats: [['4.29%', 'click-through rate, first month'], ['13.43%', 'conversion rate, first month'], ['AED 4.27', 'average cost per click']],
    src: 'Monthly performance report, February 2025 (Google Ads and Google Analytics)',
    bars: ['Website sessions by source, February 2025', [['Direct', 183], ['Organic search', 148], ['Paid search', 85], ['Referral', 18], ['Organic social', 12]]],
    href: '/case-studies/#smart-cities-uae',
  },
};
function proof(key) {
  const p = PROOF[key];
  if (!p) return '';
  const max = p.bars ? Math.max(...p.bars[1].map((r) => r[1])) : 0;
  const side = p.shot
    ? `<img class="sp-proof__shot" src="${p.shot[0]}" width="${p.shot[1]}" height="${p.shot[2]}" alt="${esc(p.shot[3])}" loading="lazy" decoding="async">`
    : `<ul class="sp-proof__bars"><li><small>${esc(p.bars[0])}</small></li>${p.bars[1].map(([l, v]) => `<li style="--w:${((v / max) * 100).toFixed(1)}%"><span>${esc(l)}</span><i></i><b>${v}</b></li>`).join('')}</ul>`;
  return `<section class="sp-sec sp-proof"><div class="sp-wrap"><div class="sp-proof__card">
  <div>
    <p class="sp-k">Client work</p>
    <h2>${esc(p.name)}, <em>${esc(p.accent)}</em></h2>
    <p>${esc(p.line)}</p>
    <ul class="sp-proof__stats">${p.stats.map(([b, t]) => `<li><b>${esc(b)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
    <p class="sp-proof__src">Source: ${esc(p.src)}.</p>
    <a class="sp-proof__link" href="${p.href}">Read the case study ${ARROW}</a>
  </div>
  ${side}
</div></div></section>`;
}

function servicePage(s) {
  const body = `<section class="sp-hero"><div class="sp-wrap sp-hero__grid">
  <div>
    <p class="sp-k">${esc(s.eyebrow)}</p>
    <h1>${s.h1}</h1>
    <p class="sp-lede">${esc(s.lede)}</p>
    <div class="sp-btns">
      <a class="sp-btn sp-btn--blue" href="/free-local-seo/">Try 30 Days of Local SEO — Free ${ARROW}</a>
      <a class="sp-btn sp-btn--white" href="/book-demo/">Book a call</a>
    </div>
    <p class="sp-note">$0 agency fee for eligible businesses. No credit card. No automatic subscription.</p>
  </div>
  <aside class="sp-hero__card" aria-label="What's included">
    <h3>What's included</h3>
    <ul class="sp-ticks">${s.included.map(([, t]) => `<li><i>${CHECK}</i>${esc(t)}</li>`).join('')}</ul>
  </aside>
</div></section>
<section class="sp-sec"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">The work</p><h2>${s.workTitle}</h2><p>${esc(s.workIntro)}</p></div>
  <div class="sp-grid">${s.included.map(([ic, t, d]) => `<div class="sp-card"><span class="sp-card__ic">${glyph(ic)}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>
${proof(s.proof)}
<section class="sp-dark"><div class="sp-wrap">
  <p class="sp-k">How we work</p>
  <h2>The <em>MAD Method.</em></h2>
  <ol class="sp-steps">${MAD.map(([l, t, d]) => `<li class="sp-step"><span class="sp-step__n" aria-hidden="true">${l}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
</div></section>
<section class="sp-sec"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Questions</p><h2>Frequently asked <em>questions.</em></h2></div>
  <div class="sp-faq">${s.faq.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  <div class="sp-related" aria-label="Related">${RELATED.filter(([h]) => h !== `/${s.slug}/`).map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</div>
</div></section>
<section class="sp-cta">
  <p class="sp-k">Start here</p>
  <h2>Your business deserves to be <em>easier to find.</em></h2>
  <p>Let’s understand your market and build a practical path to more visibility.</p>
  <div class="sp-btns"><a class="sp-btn sp-btn--blue" href="/free-local-seo/">Start Your Free Local SEO Challenge ${ARROW}</a><a class="sp-btn sp-btn--white" href="/pricing/">See pricing</a></div>
</section>
${serviceLd(s.name, s.description, s.slug)}
${faqLd(s.faq)}`;
  return page({ slug: s.slug, title: s.title, description: s.description, body });
}

const NO_GUARANTEE = ['Do you guarantee rankings?', 'No. Search placement is determined by search engines and varies by market, competition, relevance, and other factors. We report what was done, what changed, and what comes next.'];

const SERVICES = [
  {
    slug: 'services/local-seo',
    proof: 'tgh',
    name: 'Local SEO',
    title: 'Local SEO Services | MADMarketing',
    description: 'Local SEO from MADMarketing: Google Business Profile optimization, consistent listings, local research and clear reporting, so nearby customers can find you.',
    eyebrow: 'Local SEO',
    h1: 'Get found by customers <em>near you.</em>',
    lede: 'Improve how your business appears across local searches, business listings, and Google Maps. Local SEO is where we start most partnerships, because it’s where customers who are ready to buy are already looking.',
    workTitle: 'Everything that shapes <em>local visibility.</em>',
    workIntro: 'Local search rewards businesses that are relevant, nearby and trusted. We work on the signals you can influence and show you what changed.',
    included: [
      ['map', 'Google Business Profile optimization', 'Categories, services, hours, attributes, photos and descriptions that are accurate and complete.'],
      ['list', 'Citations and listings', 'Your name, address and phone consistent across the directories and listings that matter.'],
      ['search', 'Local keyword and competitor research', 'What people nearby search for, and what the businesses showing up are doing.'],
      ['pin', 'Location and service-area pages', 'Guidance and content for pages that explain where you work and what you offer there.'],
      ['star', 'Review strategy', 'A simple, policy-friendly process for asking for and responding to reviews.'],
      ['chart', 'Visibility reporting', 'Baseline and follow-up snapshots, and a plain-language summary of the work.'],
    ],
    faq: [
      ['What is local SEO?', 'Local SEO is the work of improving how a business appears in location-based searches, such as “near me” searches and Google Maps, through its Google Business Profile, listings, website and reviews.'],
      ['How long does local SEO take?', 'It depends on your market, your competition and where you’re starting from. We set expectations after an audit, and report what was done and what changed along the way.'],
      NO_GUARANTEE,
      ['Do I need a physical storefront?', 'No. Service-area businesses that visit customers can also have a Google Business Profile and benefit from local SEO.'],
      ['Can I try it before committing?', 'Yes. Eligible businesses can start with the MAD 30-Day Visibility Challenge, a defined local SEO scope for no agency fee.'],
    ],
  },
  {
    slug: 'services/google-maps-seo',
    proof: 'tgh',
    name: 'Google Maps SEO',
    title: 'Google Maps SEO & Google Business Profile Optimization | MADMarketing',
    description: 'Google Maps SEO from MADMarketing: strengthen the accuracy, relevance and completeness of your Google Business Profile so more local customers choose you.',
    eyebrow: 'Google Maps SEO',
    h1: 'Show up on the map <em>with confidence.</em>',
    lede: 'Strengthen the accuracy, relevance, and completeness of your Google Business Profile, the listing customers see when they search for businesses like yours on Google Maps.',
    workTitle: 'A profile that’s <em>complete and accurate.</em>',
    workIntro: 'Your Google Business Profile is often the first thing a customer sees. We make sure it says the right things, in the right places, and stays that way.',
    included: [
      ['key', 'Profile audit', 'A review of your profile against what Google asks for and what nearby competitors show.'],
      ['list', 'Categories and services', 'The primary and secondary categories, services and products that match what you do.'],
      ['photo', 'Photos and updates', 'Guidance on photos and posts that show customers what to expect.'],
      ['chat', 'Questions and reviews', 'A process for answering questions and responding to reviews.'],
      ['link', 'Name, address and phone consistency', 'The same details on your profile, your website and key listings.'],
      ['chart', 'Map visibility snapshots', 'Where your profile appears for the searches that matter, before and after the work.'],
    ],
    faq: [
      ['What is Google Maps SEO?', 'Google Maps SEO means improving your Google Business Profile and the signals around it so the profile is accurate, relevant and complete for the searches your customers make.'],
      ['Do I need access to my Google Business Profile?', 'Yes. We’ll ask you to add us as a manager, so the profile stays yours and you can remove access at any time.'],
      NO_GUARANTEE,
      ['What if I don’t have a profile yet?', 'We can help you create and verify one, following Google’s guidelines for your type of business.'],
    ],
  },
  {
    slug: 'services/ai-search-optimization',
    name: 'AI Search Visibility',
    title: 'AI Search Optimization | MADMarketing',
    description: 'AI search optimization from MADMarketing: structure useful content so customers and AI-powered search experiences can understand your expertise.',
    eyebrow: 'AI Search Visibility',
    h1: 'Be understood by <em>AI-powered search.</em>',
    lede: 'Structure useful content so customers and AI-powered search experiences can understand your expertise. Clear, well-organized information helps both people and machines describe your business accurately.',
    workTitle: 'Content that’s easy to <em>understand and cite.</em>',
    workIntro: 'AI-powered search experiences summarize what they can read and trust. We focus on making your expertise clear, consistent and easy to reference.',
    included: [
      ['pen', 'Answer-first content', 'Pages and articles that answer the questions customers actually ask, clearly and directly.'],
      ['code', 'Structured data', 'Schema markup that describes your business, services and FAQs in a machine-readable way.'],
      ['link', 'Consistent business information', 'The same facts about your business across your site, profiles and listings.'],
      ['search', 'Technical accessibility', 'Pages that load, render and can be crawled without obstacles.'],
      ['star', 'Expertise signals', 'Author details, credentials and sources that show why your content can be trusted.'],
      ['chart', 'Visibility checks', 'Periodic checks of how your business is described in search and AI answers.'],
    ],
    faq: [
      ['What is AI search optimization?', 'It’s the work of structuring your content and business information so AI-powered search experiences can understand and accurately describe your expertise.'],
      ['Is this different from SEO?', 'It builds on the same foundations (useful content, clear structure, accurate information) with extra attention to how answers are summarized.'],
      ['Can you guarantee my business appears in AI answers?', 'No. AI-powered search experiences decide what they show, and their answers vary. We focus on the parts you can influence and report what we did.'],
    ],
  },
  {
    slug: 'services/google-ads',
    proof: 'smart',
    name: 'Google Ads',
    title: 'Google Ads Management | MADMarketing',
    description: 'Google Ads management from MADMarketing: reach high-intent searchers with campaigns built around measurable outcomes like calls, inquiries and bookings.',
    eyebrow: 'Google Ads',
    h1: 'Reach people <em>ready to act.</em>',
    lede: 'Reach high-intent audiences with Google campaigns built around measurable outcomes: calls, inquiries, appointments and sales, not clicks for their own sake.',
    workTitle: 'Campaigns built around <em>real outcomes.</em>',
    workIntro: 'Paid search works best on top of strong foundations. We connect your campaigns to the actions that matter and keep improving what earns its budget.',
    included: [
      ['search', 'Keyword research', 'The searches that signal intent in your market, and the ones to exclude.'],
      ['target', 'Campaign structure', 'Campaigns and ad groups organized around your services and locations.'],
      ['pen', 'Ad copy and assets', 'Clear, relevant ads with the extensions that help customers take the next step.'],
      ['chart', 'Conversion tracking', 'Calls, forms and bookings measured, so you know what each campaign earns.'],
      ['cursor', 'Landing page alignment', 'Pages that match the ad and make it easy to act.'],
      ['wallet', 'Budget and bid management', 'Regular reviews of spend, search terms and results, with changes explained.'],
    ],
    faq: [
      ['How much should I spend on Google Ads?', 'It depends on your market, your goals and the cost of the searches you want to appear for. We recommend a starting budget after research, and you stay in control of it.'],
      ['Do you guarantee leads?', 'No. Results depend on your market, offer, budget and competition. We report what was done, what changed, and what comes next.'],
      ['Who owns the ad account?', 'You do. We work in your account, so your data and history stay with your business.'],
    ],
  },
];

// The free 30-day challenge (/free-local-seo/) is the ads landing page: scripts/build-landing.js.
const out = SERVICES.map((s) => [s.slug, servicePage(s)]);
for (const [slug, html] of out) {
  fs.mkdirSync(path.join(ROOT, slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, slug, 'index.html'), html);
}
console.log('seo pages:', out.map(([s]) => '/' + s + '/').join(' '));

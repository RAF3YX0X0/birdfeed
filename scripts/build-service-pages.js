// The service pages, the services index and the pricing page:
//   /services/ and the nine pages under it (the client's navigation),
//   /pricing/.
// What's offered and what it costs comes from scripts/offer-data.js (the
// client's "Services & Packages" document); client work and its figures
// from scripts/work-data.js. The copy makes no claims about results,
// rankings or numbers beyond those two sources.
//
// Plain pages: inject-fx.js adds the navbar, footer and FX layer;
// optimize-pages.js the SEO tags.
//
//   node scripts/build-service-pages.js   (then build-fx.js, optimize-pages.js)
const fs = require('fs');
const path = require('path');
const O = require('./offer-data');
const R = require('./offer-render');
const W = require('./work-data');

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
.sp-hero{padding:150px 0 40px;overflow-x:clip}
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
<style>${CSS}${EXTRA_CSS}${R.CSS}</style>
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

// Layout for the pieces this file adds to the page design above.
const EXTRA_CSS = `
.sp-hero--center{text-align:center;padding-bottom:16px}
.sp-hero--center .sp-lede{max-width:720px;margin-left:auto;margin-right:auto}
.sp-hero--center .sp-btns{justify-content:center}
.sp-sec--tight{padding-top:clamp(28px,4vw,48px)}
.sp-grid--2{grid-template-columns:repeat(2,minmax(0,1fr))}
.sp-card--plain b,.sp-card--link b{margin-top:0}
.sp-card--link{display:block;color:inherit;text-decoration:none}
.sp-card--link span{display:inline-flex;align-items:center;gap:8px;margin-top:16px;font-size:14px;font-weight:600;color:#0066FF}
.sp-fam--alt{background:#fff}
.sp-fam__head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px}
.sp-fam__links{display:flex;flex-wrap:wrap;gap:10px}
.sp-fam__links .sp-btn{min-height:44px;padding:10px 20px;font-size:14.5px}
.sp-price__body{margin-top:36px}
.sp-price__one{display:grid;grid-template-columns:minmax(0,420px) minmax(0,1fr);gap:24px;align-items:start}
.sp-price__side h3,.sp-price__addons h3{margin:0 0 14px;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#858C99}
.sp-price__side .pk-addons{grid-template-columns:minmax(0,1fr)}
.sp-price__addons{margin-top:28px}
.sp-price__addons .pk-addons{grid-template-columns:repeat(2,minmax(0,1fr))}
.sp-cases{padding-top:0}
.sp-cases__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-top:36px}
.sp-case{display:flex;flex-direction:column;gap:6px;padding:22px;border-radius:24px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;color:#0A0A0A;text-decoration:none;transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
.sp-case:hover{transform:translateY(-4px);box-shadow:0 0 0 1px #0066FF,0 30px 60px -36px rgba(0,102,255,.45)}
.sp-case__k{font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#858C99}
.sp-case>b{font-size:20px;font-weight:600;letter-spacing:-.02em}
.sp-case__fig{display:flex;flex-direction:column;gap:3px;margin-top:auto;padding-top:14px;border-top:1px solid #EEF1F5}
.sp-case__fig b{font-size:26px;font-weight:600;letter-spacing:-.025em;color:#0066FF}
.sp-case__fig small{font-size:12.5px;line-height:1.4;color:#6B7280}
.sp-case__go{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;font-weight:600;color:#0066FF}
.sp-gal{padding-bottom:0;overflow:hidden}
.sp-gal__row{--gut:max(24px,calc((100vw - 1132px)/2));display:flex;gap:14px;margin-top:36px;padding:0 var(--gut) 8px;scroll-padding-left:var(--gut);overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none}
.sp-gal__row::-webkit-scrollbar{display:none}
.sp-gal__row figure{flex:none;width:240px;margin:0;scroll-snap-align:start}
.sp-gal__row img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:18px;background:#EEF1F5;box-shadow:0 0 0 1px #E5E7EB}
.sp-gal__row figcaption{margin-top:8px;font-size:12.5px;color:#6B7280}
.sp-proof__shot--ad{width:min(100%,340px);height:auto}
@media(max-width:900px){.sp-grid--2,.sp-price__one,.sp-price__addons .pk-addons{grid-template-columns:minmax(0,1fr)}.sp-gal__row figure{width:200px}}
`;

// ---- shared pieces ---------------------------------------------------------------------
const RELATED = [...O.PAGES.map((p) => [p.href, p.name]), ['/pricing/', 'Pricing']];
const related = (self) => `<div class="sp-related" aria-label="Related">${RELATED.filter(([h]) => h !== self).map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join('')}</div>`;

const MAD = [
  ['M', 'Market Intelligence', 'We study search behavior, customer needs, competitors, and opportunities before choosing a direction.'],
  ['A', 'Attention & Authority', 'We build visibility and credibility through search, content, advertising, and brand experiences.'],
  ['D', 'Data-Driven Growth', 'We measure meaningful actions, explain performance, and refine the work that matters.'],
];
const method = () => `<section class="sp-dark"><div class="sp-wrap">
  <p class="sp-k">How we work</p>
  <h2>The <em>MAD Method.</em></h2>
  <ol class="sp-steps">${MAD.map(([l, t, d]) => `<li class="sp-step"><span class="sp-step__n" aria-hidden="true">${l}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
</div></section>`;

const TRIAL_NOTE = '$0 agency fee for eligible businesses. No credit card. No automatic subscription.';
const BTN = {
  challenge: `<a class="sp-btn sp-btn--blue" href="/free-local-seo/">Try 30 Days of Local SEO — Free ${ARROW}</a>`,
  call: `<a class="sp-btn sp-btn--blue" href="/book-demo/">Book a call ${ARROW}</a>`,
  callWhite: '<a class="sp-btn sp-btn--white" href="/book-demo/">Book a call</a>',
  pricing: '<a class="sp-btn sp-btn--white" href="/pricing/">See pricing</a>',
  services: '<a class="sp-btn sp-btn--white" href="/services/">All services</a>',
};
// Local SEO leads (the free challenge is its entry offer); the other
// services start with a call and a quote.
const heroBtns = (lead) => (lead === 'challenge'
  ? { btns: BTN.challenge + BTN.callWhite, note: TRIAL_NOTE }
  : { btns: BTN.call + BTN.pricing, note: 'Scoped and quoted to your business. Media budgets and third-party costs are quoted separately.' });

const closing = (lead) => `<section class="sp-cta">
  <p class="sp-k">Start here</p>
  ${lead === 'challenge'
    ? `<h2>Your business deserves to be <em>easier to find.</em></h2>
  <p>Let’s understand your market and build a practical path to more visibility.</p>
  <div class="sp-btns"><a class="sp-btn sp-btn--blue" href="/free-local-seo/">Start Your Free Local SEO Challenge ${ARROW}</a>${BTN.pricing}</div>`
    : `<h2>Tell us what you’re <em>trying to grow.</em></h2>
  <p>A 30-minute call to understand your business, then a scope and a quote you can say yes or no to.</p>
  <div class="sp-btns">${BTN.call}${BTN.pricing}</div>`}
</section>`;

// ---- client work behind a service ------------------------------------------------------
// Real figures, each with its source (the full stories are on /case-studies/).
const PROOF = {
  tgh: {
    name: 'The Gentry House', accent: 'Lake Saint Louis.',
    line: 'A premium barbershop whose website and Google Business Profile we run. Its site answers the searches locals make, and its profile carries the services, hours, booking link and photos.',
    stats: [['5.0★', 'on Google, from 201 reviews'], ['55', 'photos on its Google profile'], ['280', 'reviews across Google and Booksy']],
    src: `Google Maps and Booksy, checked ${W.CHECKED}`,
    shot: ['/work/the-gentry-house/google-profile.webp', 408, 882, 'The Gentry House’s Google Business Profile: 5.0 from 201 reviews'],
    href: '/case-studies/#the-gentry-house',
  },
  tghweb: {
    name: 'The Gentry House', accent: 'tghbarbershop.com.',
    line: 'We designed and built the barbershop’s website: its full service menu with prices, online booking, a gallery, a blog and a careers section.',
    stats: [['15', 'services listed with prices'], ['8', 'questions answered in its FAQ'], ['4', 'levels in its careers path']],
    src: `tghbarbershop.com, captured ${W.CHECKED}`,
    shot: ['/work/the-gentry-house/site-phone.webp', 780, 1500, 'The Gentry House’s website on a phone'],
    href: '/case-studies/#the-gentry-house',
  },
  tghads: {
    name: 'The Gentry House', accent: 'recruiting on Meta.',
    line: 'We run the barbershop’s ads on Facebook and Instagram. Live now: two recruiting ads for its Ballwin and Lake Saint Louis locations, each sending applicants to WhatsApp. They started on 12 October 2026, so there are no results to report yet.',
    stats: [['2', 'recruiting ads live'], ['2', 'locations hiring'], ['WhatsApp', 'where applicants are sent']],
    src: 'Meta Ad Library',
    shot: ['/work/the-gentry-house/ad-your-next-chair.webp', 480, 600, 'A Gentry House recruiting ad: “Your next chair is at TGH”', 'ad'],
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
  smartseo: {
    name: 'Smart Cities UAE', accent: 'Dubai.',
    line: 'For a construction and fit-out company we fixed website errors, set up its SEO and tracking, did the on-page SEO and researched its keywords. This is the first month we measured.',
    stats: [['148', 'sessions from organic search'], ['302', 'active users'], ['930', 'page views']],
    src: 'Monthly performance report, February 2025 (Google Analytics)',
    bars: ['Most-viewed pages, February 2025', [['Home', 495], ['Contact us', 117], ['Gallery', 43], ['About us', 21], ['Services', 16]]],
    href: '/case-studies/#smart-cities-uae',
  },
  tiktak: {
    name: 'TikTak Moving', accent: 'New York City.',
    line: 'Four weeks of social content for a mover that uses electric tuk-tuks: offer, comparison and proof posts, and reels shot on real moves.',
    stats: [['19', 'feed posts'], ['6', 'reels shot on real moves'], ['4.8★', 'on Google today, 23 reviews']],
    src: `The delivered calendar; Google rating checked ${W.CHECKED}`,
    shot: ['/work/tiktak-moving/truck-vs-rickshaw.webp', 1080, 1080, 'A TikTak post: truck vs. rickshaw', 'ad'],
    href: '/case-studies/#tiktak-moving',
  },
};
function proof(key) {
  const p = PROOF[key];
  if (!p) return '';
  const max = p.bars ? Math.max(...p.bars[1].map((r) => r[1])) : 0;
  const side = p.shot
    ? `<img class="sp-proof__shot${p.shot[4] ? ` sp-proof__shot--${p.shot[4]}` : ''}" src="${p.shot[0]}" width="${p.shot[1]}" height="${p.shot[2]}" alt="${esc(p.shot[3])}" loading="lazy" decoding="async">`
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

// The case studies of clients we did this for.
const bySlug = Object.fromEntries(W.CLIENTS.map((c) => [c.slug, c]));
function cases(slugs, title) {
  const list = (slugs || []).map((s) => bySlug[s]).filter(Boolean);
  if (!list.length) return '';
  return `<section class="sp-sec sp-cases"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Case studies</p><h2>${title}</h2></div>
  <div class="sp-cases__grid">${list.map((c) => `<a class="sp-case" href="/case-studies/#${esc(c.slug)}">
    <span class="sp-case__k">${esc(c.industry)}${c.location ? ` · ${esc(c.location.split(', ')[0])}` : ''}</span>
    <b>${esc(c.client)}</b>
    <span class="sp-case__fig"><b>${esc(c.metrics[0].value)}</b><small>${esc(c.metrics[0].label)}</small></span>
    <span class="sp-case__go">Case study ${ARROW}</span>
  </a>`).join('')}</div>
</div></section>`;
}

// A strip of the work itself (posts our team made for clients).
function gallery() {
  // One client after another, so the strip shows the range of the work.
  const piles = W.CLIENTS.map((c) => c.media.filter((m) => !m.kind && m.grid !== 0 && m.f).map((m) => ({ ...m, client: c.client }))).filter((l) => l.length);
  const posts = [];
  for (let i = 0; posts.length < 12 && piles.some((l) => i < l.length); i++) piles.forEach((l) => { if (i < l.length && posts.length < 12) posts.push(l[i]); });
  return `<section class="sp-sec sp-gal"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Our work</p><h2>Posts we’ve <em>made.</em></h2><p>Real posts, designed and written by our team for our clients.</p></div>
</div>
<div class="sp-gal__row">${posts.map((m) => `<figure><img src="${esc(m.src)}" alt="${esc(m.c)}" loading="lazy" decoding="async"><figcaption>${esc(m.client)}</figcaption></figure>`).join('')}</div>
<div class="sp-wrap"><div class="sp-btns"><a class="sp-btn sp-btn--white" href="/examples/">See all our work ${ARROW}</a></div></div>
</section>`;
}

// ---- how each service is priced -----------------------------------------------------------
const authority = O.PLANS.find((p) => p.key === 'authority');
function pricing(kind, name) {
  const head = (title, text) => `<div class="sp-head"><p class="sp-k">Pricing</p><h2>${title}</h2><p>${text}</p></div>`;
  const more = `<div class="sp-btns">${BTN.pricing}</div>`;
  if (kind === 'plans') {
    return `<section class="sp-sec sp-price"><div class="sp-wrap">
  ${head(`Three plans, <em>from ${O.money(O.FROM)} a month.</em>`, 'Launch pricing in US dollars. Eligible businesses can start with the free 30-day challenge and choose a plan afterwards.')}
  <div class="sp-price__body">${R.plans({ compact: true, cta: (p) => ['/pricing/', `What’s in ${p.name}`] })}</div>
  ${more}
</div></section>`;
  }
  if (kind === 'authority' || kind === 'ai') {
    const text = kind === 'ai'
      ? `Basic AEO and GEO recommendations are part of ${authority.name}. Audits and ongoing AI visibility work are scoped and quoted.`
      : `${authority.name} covers deeper website and local search optimization. E-commerce SEO is quoted based on store complexity.`;
    return `<section class="sp-sec sp-price"><div class="sp-wrap">
  ${head(`${esc(authority.name)}, <em>${O.money(authority.price)} a month.</em>`, text)}
  <div class="sp-price__body sp-price__one">
    <div class="pk-card is-rec"><h3 class="pk-card__name">${esc(authority.name)}</h3><span class="pk-card__line">${esc(authority.tagline)}</span><span class="pk-card__price"><b>${O.money(authority.price)}</b><span>/ month</span></span><span class="pk-card__builds">Everything in ${esc(authority.builds)}, plus</span><ul class="pk-list">${authority.items.map((t) => `<li><i>${CHECK}</i><span>${esc(t)}</span></li>`).join('')}</ul><span class="pk-card__cta"><a class="pk-btn" href="/pricing/">Compare all plans</a></span></div>
    ${kind === 'ai' ? `<div class="sp-price__side"><h3>Optional add-ons</h3>${R.addons(['AI Search Visibility Audit', 'AI Visibility Optimization'])}</div>` : ''}
  </div>
</div></section>`;
  }
  // Everything else is quoted: MAD Full Growth.
  return `<section class="sp-sec sp-price"><div class="sp-wrap">
  ${head('Quoted to <em>your scope.</em>', `${esc(name)} is part of ${O.FULL_GROWTH.name}: a plan built around what you need, with defined deliverables and a reporting cadence.`)}
  <div class="sp-price__body">${R.fullGrowth()}</div>
  ${kind === 'automation' ? `<div class="sp-price__addons"><h3>Optional add-ons</h3>${R.addons(['AI Lead Response Automation', 'AI Review Response Assistant', 'AI Content Repurposing', 'AI Marketing Reporting'])}</div>` : ''}
  ${more}
</div></section>`;
}

// ---- a service page --------------------------------------------------------------------------
function servicePage(s) {
  const { btns, note } = heroBtns(s.lead);
  const body = `<section class="sp-hero"><div class="sp-wrap sp-hero__grid">
  <div>
    <p class="sp-k">${esc(s.eyebrow)}</p>
    <h1>${s.h1}</h1>
    <p class="sp-lede">${esc(s.lede)}</p>
    <div class="sp-btns">${btns}</div>
    <p class="sp-note">${esc(note)}</p>
  </div>
  <aside class="sp-hero__card" aria-label="What's included">
    <h3>What's included</h3>
    <ul class="sp-ticks">${s.included.map(([, t]) => `<li><i>${CHECK}</i>${esc(t)}</li>`).join('')}</ul>
  </aside>
</div></section>
<section class="sp-sec"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">The work</p><h2>${s.workTitle}</h2><p>${esc(s.workIntro)}</p></div>
  <div class="sp-grid${s.included.length === 4 ? ' sp-grid--2' : ''}">${s.included.map(([ic, t, d]) => `<div class="sp-card"><span class="sp-card__ic">${glyph(ic)}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>
${s.gallery ? gallery() : ''}
${proof(s.proof)}
${pricing(s.pricing, s.name)}
${cases(s.cases, s.casesTitle || 'Clients we’ve <em>done this for.</em>')}
${method()}
<section class="sp-sec"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Questions</p><h2>Frequently asked <em>questions.</em></h2></div>
  <div class="sp-faq">${s.faq.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  ${related(`/${s.slug}/`)}
</div></section>
${closing(s.lead)}
${serviceLd(s.name, s.description, s.slug)}
${faqLd(s.faq)}`;
  return page({ slug: s.slug, title: s.title, description: s.description, body });
}

const NO_GUARANTEE = ['Do you guarantee rankings?', 'No. Search placement is determined by search engines and varies by market, competition, relevance, and other factors. We report what was done, what changed, and what comes next.'];
const OWN_ACCOUNTS = ['Who owns the accounts?', 'You do. You own your business profiles and advertising accounts. We work through role-based access and never ask for your passwords.'];
const AD_SPEND = ['Is ad spend included in your fee?', 'No. Advertising spend is excluded unless it’s written into your agreement, and media budgets and third-party costs are quoted separately.'];
const planLine = `${O.PLANS.map((p) => `${p.name} is ${O.money(p.price)} a month`).join(', ')}.`;

const SERVICES = [
  {
    slug: 'services/local-seo', lead: 'challenge', pricing: 'plans', proof: 'tgh', cases: ['the-gentry-house', 'smart-cities-uae'],
    name: 'Local SEO',
    title: 'Local SEO Services | MADMarketing',
    description: `Local SEO from MADMarketing: local keyword research, consistent listings, citation management and monthly reporting. Plans from ${O.money(O.FROM)} a month.`,
    eyebrow: 'Local SEO',
    h1: 'Get found by customers <em>near you.</em>',
    lede: 'Improve how your business appears across local searches, business listings, and Google Maps. Local SEO is where we start most partnerships, because it’s where customers who are ready to buy are already looking.',
    workTitle: 'Everything that shapes <em>local visibility.</em>',
    workIntro: 'Local search rewards businesses that are relevant, nearby and trusted. We work on the signals you can influence and show you what changed.',
    included: [
      ['search', 'Local keyword and competitor research', 'What people nearby search for, and what the businesses showing up are doing.'],
      ['list', 'Business listing consistency', 'Your name, address and phone consistent across the directories and listings that matter.'],
      ['link', 'Citation management', 'Submission or correction actions on relevant directories. Acceptance and indexing by third parties isn’t guaranteed.'],
      ['pin', 'On-page local signals', 'Pages that make clear where you work and what you offer there.'],
      ['star', 'Review workflow', 'A simple, policy-friendly process for asking for and responding to reviews.'],
      ['chart', 'Monitoring and monthly reporting', 'Visibility snapshots for your agreed keywords, and a plain-language summary of the work.'],
    ],
    faq: [
      ['What is local SEO?', 'Local SEO is the work of improving how a business appears in location-based searches, such as “near me” searches and Google Maps, through its Google Business Profile, listings, website and reviews.'],
      ['How much does local SEO cost?', `${planLine} Each plan starts with a written agreement that sets out billing, cancellation and deliverables.`],
      ['How long does local SEO take?', 'It depends on your market, your competition and where you’re starting from. We set expectations after an audit, and report what was done and what changed along the way.'],
      NO_GUARANTEE,
      ['Do I need a physical storefront?', 'No. Service-area businesses that visit customers can also have a Google Business Profile and benefit from local SEO.'],
      ['Can I try it before committing?', 'Yes. Eligible businesses can start with the MAD 30-Day Visibility Challenge, a defined local SEO scope for no agency fee. It never turns into a paid subscription without your approval.'],
    ],
  },
  {
    slug: 'services/google-maps-seo', lead: 'challenge', pricing: 'plans', proof: 'tgh', cases: ['the-gentry-house'],
    name: 'Google Maps SEO',
    title: 'Google Maps SEO & Google Business Profile Optimization | MADMarketing',
    description: 'Google Maps SEO from MADMarketing: profile audit, categories, services, business information, review workflow guidance and geo-grid observations for your Google Business Profile.',
    eyebrow: 'Google Maps SEO',
    h1: 'Show up on the map <em>with confidence.</em>',
    lede: 'Strengthen the accuracy, relevance, and completeness of your Google Business Profile, the listing customers see when they search for businesses like yours on Google Maps.',
    workTitle: 'A profile that’s <em>complete and accurate.</em>',
    workIntro: 'Your Google Business Profile is often the first thing a customer sees. We make sure it says the right things, in the right places, and stays that way.',
    included: [
      ['key', 'Profile audit', 'A review of your profile against what Google asks for and what nearby competitors show.'],
      ['list', 'Categories and services', 'The primary and secondary categories, services and products that match what you do.'],
      ['pen', 'Eligible field optimization', 'Business information, description, hours and attributes filled in accurately, where your profile is eligible.'],
      ['photo', 'Updates and posts', 'Profile updates and posts that show customers what to expect.'],
      ['chat', 'Review workflow guidance', 'A process for asking for reviews and responding to them.'],
      ['chart', 'Geo-grid observations', 'Where your profile appears across your area for the searches that matter, before and after the work.'],
    ],
    faq: [
      ['What is Google Maps SEO?', 'Google Maps SEO means improving your Google Business Profile and the signals around it so the profile is accurate, relevant and complete for the searches your customers make.'],
      ['Which plan includes Google Business Profile management?', `All three. ${planLine} They differ in how many citation actions, profile updates and website pages are covered each month.`],
      ['Do I need to give you my Google password?', 'No. You add us as a manager on your profile, so it stays yours and you can remove access at any time. We never ask for passwords.'],
      NO_GUARANTEE,
      ['What if I don’t have a profile yet?', 'We can help you create and verify one, following Google’s guidelines for your type of business. The free 30-day challenge needs a profile that’s already verified.'],
    ],
  },
  {
    slug: 'services/seo', lead: 'challenge', pricing: 'authority', proof: 'smartseo', cases: ['smart-cities-uae', 'the-gentry-house'],
    name: 'Search Engine Optimization',
    title: 'SEO Services: Technical, On-Page & Content SEO | MADMarketing',
    description: 'SEO from MADMarketing: technical audits and prioritized fixes, on-page optimization and content built around search intent, so your website is easier to discover, understand and use.',
    eyebrow: 'Search Engine Optimization',
    h1: 'Make your website <em>easier to find.</em>',
    lede: 'Make your website easier to discover, understand, and use. We work on the technical foundations, the pages themselves and the content around them, and start with the fixes that matter most.',
    workTitle: 'Technical, on-page <em>and content.</em>',
    workIntro: 'Search engines need to reach your pages, read them and understand what they offer. We audit all three and work through the fixes in order of priority.',
    included: [
      ['search', 'Technical SEO', 'Indexing, crawlability, redirects and canonicals, checked and fixed.'],
      ['code', 'On-page SEO', 'Metadata, internal linking and page structure that match what each page is about.'],
      ['list', 'Technical audits', 'A documented audit with prioritized fixes, so the most important work comes first.'],
      ['pen', 'Content SEO', 'Search-intent mapping, service pages, editorial planning, content refreshes and helpful resources.'],
      ['wallet', 'E-commerce SEO', 'Category and product SEO and technical recommendations, quoted based on store complexity.'],
      ['link', 'Local link outreach', 'Legitimate local link outreach, as part of the MAD Search Authority plan.'],
    ],
    faq: [
      ['What’s the difference between SEO and local SEO?', 'Local SEO focuses on location-based searches, Google Maps and your Google Business Profile. SEO here means your website itself: its technical health, its pages and its content.'],
      ['Which plan covers this work?', `${authority.name}, at ${O.money(authority.price)} a month. It adds technical SEO monitoring, two scoped content or page deliverables a month, local link outreach, basic AEO/GEO recommendations and a conversion tracking review to everything in MAD Local Growth.`],
      NO_GUARANTEE,
      ['Do you work on WordPress and Shopify sites?', 'Yes. Our website work covers WordPress and Shopify, from improvements to new builds.'],
      ['Is a new website included?', 'No. Substantial new page builds and extensive development are scoped and quoted separately.'],
    ],
  },
  {
    slug: 'services/ai-search-optimization', lead: 'challenge', pricing: 'ai',
    name: 'AI Search Visibility',
    title: 'AI Search Optimization: AEO & GEO | MADMarketing',
    description: 'AI search optimization from MADMarketing: answer engine optimization, generative engine optimization, structured data and AI visibility audits, with no inclusion guarantee.',
    eyebrow: 'AI Search Visibility · AEO & GEO',
    h1: 'Be understood by <em>AI-powered search.</em>',
    lede: 'Structure useful content so customers and AI-powered search experiences can understand your expertise. Clear, well-organized information helps both people and machines describe your business accurately.',
    workTitle: 'Content that’s easy to <em>understand and cite.</em>',
    workIntro: 'AI-powered search experiences summarize what they can read and trust. We focus on making your expertise clear, consistent and easy to reference.',
    included: [
      ['pen', 'Answer Engine Optimization (AEO)', 'Answer-first content, question research, FAQs, clear service definitions and structured information.'],
      ['sparkle', 'Generative Engine Optimization (GEO)', 'Entity clarity, AI-search readiness audits, useful evidence-backed content and observed AI brand mention tracking.'],
      ['code', 'Structured data', 'Appropriate organization, service, breadcrumb and other supported schema recommendations.'],
      ['chart', 'AI visibility audits', 'Documented prompt testing, observed mentions, content gaps and an improvement roadmap.'],
    ],
    faq: [
      ['What is AI search optimization?', 'It’s the work of structuring your content and business information so AI-powered search experiences can understand and accurately describe your expertise.'],
      ['What do AEO and GEO mean?', 'Answer engine optimization (AEO) is about answering the questions customers ask, clearly and directly. Generative engine optimization (GEO) is about making your business a clear, well-evidenced entity that AI search can describe.'],
      ['Is this different from SEO?', 'It builds on the same foundations (useful content, clear structure, accurate information) with extra attention to how answers are summarized.'],
      ['Can you guarantee my business appears in AI answers?', 'No. AI-powered search experiences decide what they show, and their answers vary. We focus on the parts you can influence, document what we observe and report what we did.'],
      ['How is it priced?', `Basic AEO and GEO recommendations are part of ${authority.name}, at ${O.money(authority.price)} a month. Audits and ongoing AI visibility work are scoped and quoted.`],
    ],
  },
  {
    slug: 'services/google-ads', lead: 'call', pricing: 'custom', proof: 'smart', cases: ['smart-cities-uae'],
    name: 'Google Ads',
    title: 'Google Ads Management | MADMarketing',
    description: 'Google Ads management from MADMarketing: search campaign strategy, keyword planning, ad copy, negative keywords, tracking, bidding reviews and reporting.',
    eyebrow: 'Google Ads',
    h1: 'Reach people <em>ready to act.</em>',
    lede: 'Reach high-intent audiences with Google campaigns built around measurable outcomes: calls, inquiries, appointments and sales, not clicks for their own sake.',
    workTitle: 'Campaigns built around <em>real outcomes.</em>',
    workIntro: 'Paid search works best on top of strong foundations. We connect your campaigns to the actions that matter and keep improving what earns its budget.',
    included: [
      ['target', 'Search campaign strategy', 'Campaigns and ad groups organized around your services and locations.'],
      ['search', 'Keyword planning', 'The searches that signal intent in your market, and the negative keywords to exclude.'],
      ['pen', 'Ad copy', 'Clear, relevant ads with the assets that help customers take the next step.'],
      ['chart', 'Tracking', 'Calls, forms and bookings measured, with GA4, GTM and conversion events set up properly.'],
      ['wallet', 'Bidding reviews', 'Regular reviews of spend, search terms and bids, with changes explained.'],
      ['list', 'Reporting', 'What ran, what it cost and what it led to, in plain language.'],
    ],
    faq: [
      ['How much should I spend on Google Ads?', 'It depends on your market, your goals and the cost of the searches you want to appear for. We recommend a starting budget after research, and you stay in control of it.'],
      AD_SPEND,
      ['Do you guarantee leads?', 'No. We don’t guarantee leads, traffic or ROAS. Results depend on your market, offer, budget and competition. We report what was done, what changed, and what comes next.'],
      OWN_ACCOUNTS,
      ['Do you run ads on other platforms?', 'Yes. We also run Meta ads, and TikTok, LinkedIn, YouTube and other channels where they’re relevant, each scoped separately.'],
    ],
  },
  {
    slug: 'services/meta-ads', lead: 'call', pricing: 'custom', proof: 'tghads', cases: ['the-gentry-house', 'freshul', 'she-avenue'],
    name: 'Meta Ads',
    title: 'Meta Ads Management: Facebook & Instagram Advertising | MADMarketing',
    description: 'Meta ads from MADMarketing: Facebook and Instagram creative strategy, audience testing, lead funnels, retargeting and performance reviews, with proper measurement.',
    eyebrow: 'Meta Ads',
    h1: 'Reach the right people on <em>Facebook and Instagram.</em>',
    lede: 'Facebook and Instagram campaigns built on creative strategy, audience testing and lead funnels, with retargeting and regular performance reviews. You see what ran, what it cost and what it led to.',
    workTitle: 'From the creative <em>to the follow-through.</em>',
    workIntro: 'Paid social works when the creative, the audience and the next step line up. We plan and test each one, and review performance with you.',
    included: [
      ['pen', 'Creative strategy', 'The messages, formats and ad creatives each campaign needs.'],
      ['target', 'Audience testing', 'Structured tests to find the audiences that respond.'],
      ['cursor', 'Lead funnels', 'Lead forms and landing pages that turn a click into an inquiry.'],
      ['link', 'Retargeting', 'Campaigns for people who have already visited or engaged.'],
      ['chart', 'Measurement', 'GA4, GTM, pixels and conversion APIs where applicable, with event design and funnel analysis.'],
      ['wallet', 'Performance reviews', 'Regular reviews of spend and results, with changes explained.'],
    ],
    faq: [
      AD_SPEND,
      OWN_ACCOUNTS,
      ['Do you make the ad creatives?', 'Yes. Creative production covers graphics, carousels, short-form reels, ad creatives and video edits.'],
      ['Do you run ads on other platforms?', 'Yes, where they’re relevant: Google Ads, and TikTok, LinkedIn, YouTube and other channels, each scoped separately.'],
      ['Do you guarantee leads or ROAS?', 'No. We don’t guarantee ROAS, traffic or lead volumes. We report what was done, what changed, and what comes next.'],
    ],
  },
  {
    slug: 'services/social-media-marketing', lead: 'call', pricing: 'custom', proof: 'tiktak', gallery: true,
    cases: ['the-gentry-house', 'tiktak-moving', 'freshul', 'wezatech', 'luxury-connection-tourism', 'pink-salt', 'wecreative'],
    name: 'Social Media Marketing',
    title: 'Social Media Marketing & Creative | MADMarketing',
    description: 'Social media marketing from MADMarketing: channel strategy, content calendars, posting workflows, creative production, branding, and UGC and influencer support.',
    eyebrow: 'Social Media Marketing',
    h1: 'Social media that looks <em>like your brand.</em>',
    lede: 'Channel strategy, content calendars and posting workflows, with the creative to fill them: graphics, carousels, short-form reels and ad creatives made for your brand.',
    workTitle: 'Management, creative <em>and brand.</em>',
    workIntro: 'Four parts of the same job. Take the ones you need, and we set the scope, the posting workflow and the reporting with you.',
    included: [
      ['list', 'Social media management', 'Channel strategy, content calendars, posting workflows, moderation scope and reporting.'],
      ['photo', 'Creative production', 'Graphics, carousels, short-form reels, ad creatives, video edits and brand-aligned messaging.'],
      ['sparkle', 'Branding', 'Identity systems, creative direction, brand guidelines and campaign concepts.'],
      ['chat', 'UGC and influencer support', 'Creator briefs, sourcing support and campaign coordination, subject to separate budgets.'],
    ],
    faq: [
      ['Which platforms do you manage?', 'That’s set in your channel strategy. We plan the channels, the content calendar and the posting workflow with you.'],
      ['Do you make the content as well?', 'Yes. Creative production covers graphics, carousels, short-form reels, ad creatives and video edits, with messaging that fits your brand.'],
      ['Can you work with creators and influencers?', 'Yes. We write creator briefs, support sourcing and coordinate campaigns. Creator fees are a separate budget.'],
      ['How is social media priced?', `It’s quoted to your scope as part of ${O.FULL_GROWTH.name}, with defined deliverables and a reporting cadence. On-site filming and high-volume creative production are scoped separately.`],
    ],
  },
  {
    slug: 'services/web-design', lead: 'call', pricing: 'custom', proof: 'tghweb', cases: ['the-gentry-house', 'growzium', 'smart-cities-uae'],
    name: 'Web Design & Conversion',
    title: 'Web Design, Landing Pages & CRO | MADMarketing',
    description: 'Websites and conversion from MADMarketing: WordPress and Shopify development, landing pages, conversion rate optimization and website maintenance.',
    eyebrow: 'Web & Conversion',
    h1: 'Turn visits into <em>calls and bookings.</em>',
    lede: 'Turn visits into calls, inquiries, appointments, and sales. We build and improve websites and landing pages, then keep working on whatever gets in a customer’s way.',
    workTitle: 'Build it, then <em>make it convert.</em>',
    workIntro: 'A page has one job: help the right visitor take the next step. We design for that, measure it and keep improving it.',
    included: [
      ['code', 'Website development', 'WordPress and Shopify development or improvement, responsive pages and technical handoff.'],
      ['cursor', 'Landing pages', 'Offer positioning, UX copy, lead forms, booking integrations and conversion-focused page design.'],
      ['chart', 'Conversion rate optimization', 'Form friction, CTA clarity, page hierarchy, user journeys, analytics and iterative testing.'],
      ['clock', 'Website maintenance', 'Updates, monitoring and maintenance, as defined in your agreement.'],
    ],
    faq: [
      ['Which platforms do you build on?', 'WordPress and Shopify: new builds, or improvements to the site you already have, with responsive pages and a technical handoff.'],
      ['Can you build just a landing page?', 'Yes. Landing pages cover offer positioning, UX copy, lead forms, booking integrations and conversion-focused design.'],
      ['Is hosting included?', 'No. Hosting, premium software and extensive development are excluded unless they’re written into your agreement.'],
      ['Do you maintain websites after launch?', 'Yes. Updates, monitoring and maintenance are available, defined separately in your agreement.'],
    ],
  },
  {
    slug: 'services/marketing-automation', lead: 'call', pricing: 'automation',
    name: 'Marketing Automation',
    title: 'Marketing Automation & CRM Setup | MADMarketing',
    description: 'Marketing automation from MADMarketing: CRM setup, permission-based lead follow-up, AI-assisted workflows and reporting automation.',
    eyebrow: 'Marketing Automation',
    h1: 'Follow up faster, <em>with less manual work.</em>',
    lede: 'A CRM pipeline with clear stages and lead routing, permission-based email and SMS follow-up, and dashboards that show where each lead came from and where it stands.',
    workTitle: 'From first inquiry <em>to booked.</em>',
    workIntro: 'Automation supports your team; it doesn’t replace their judgment. Messages are permission-based, and AI-assisted drafts come with review and privacy safeguards.',
    included: [
      ['list', 'CRM setup', 'GoHighLevel or another suitable CRM: pipeline configuration, stages and lead routing.'],
      ['chat', 'Lead follow-up', 'Permission-based email and SMS reminders, booking workflows, notifications and handoffs.'],
      ['sparkle', 'AI-assisted workflows', 'Response drafting and workflow support, with review and privacy safeguards.'],
      ['chart', 'Reporting automation', 'Dashboards, KPI summaries and lead-source and sales-stage data in one place.'],
    ],
    faq: [
      ['Which CRM do you use?', 'GoHighLevel, or another CRM that suits your business. We configure the pipeline, its stages and lead routing.'],
      ['Do you message people without their consent?', 'No. Email and SMS follow-up is permission-based.'],
      ['How is AI used?', 'For response drafting and workflow support, with review and privacy safeguards.'],
      ['How is automation priced?', 'It’s quoted to your scope. Custom integrations, premium software and usage costs are quoted separately.'],
    ],
  },
];

// ---- /services/ -----------------------------------------------------------------------------
function servicesIndex() {
  const slug = 'services';
  const title = 'Digital Marketing Services | MADMarketing';
  const description = 'MADMarketing’s services: local SEO and Google Maps visibility, AI search visibility, paid advertising, social media and creative, websites and conversion, and marketing automation.';
  const body = `<section class="sp-hero sp-hero--center"><div class="sp-wrap">
  <p class="sp-k">Services</p>
  <h1>Start where customers <em>are looking.</em></h1>
  <p class="sp-lede">MADMarketing is a full-service digital marketing agency, leading with local SEO and Google Maps visibility for US local businesses. Start with the service you need and expand when it makes business sense.</p>
  <div class="sp-btns">${BTN.challenge}${BTN.pricing}</div>
  <p class="sp-note">${esc(TRIAL_NOTE)}</p>
</div></section>
${O.FAMILIES.map((f, i) => {
    const pages = O.PAGES.filter((p) => p.family === f.key);
    return `<section class="sp-sec sp-fam${i % 2 ? ' sp-fam--alt' : ''}" id="${f.key}"><div class="sp-wrap">
  <div class="sp-fam__head">
    <div class="sp-head"><p class="sp-k">${esc(f.tag)}</p><h2>${esc(f.name)}</h2></div>
    <div class="sp-fam__links">${pages.map((p) => `<a class="sp-btn sp-btn--white" href="${p.href}">${esc(p.name)} ${ARROW}</a>`).join('')}</div>
  </div>
  <div class="sp-grid${f.services.length === 4 ? ' sp-grid--2' : ''}">${f.services.map(([n, d]) => `<div class="sp-card sp-card--plain"><b>${esc(n)}</b><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>`;
  }).join('\n')}
<section class="sp-sec sp-price"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Pricing</p><h2>Local SEO plans <em>from ${O.money(O.FROM)} a month.</em></h2><p>Everything beyond local SEO is scoped and quoted as ${esc(O.FULL_GROWTH.name)}.</p></div>
  <div class="sp-price__body">${R.plans({ compact: true, cta: (p) => ['/pricing/', `What’s in ${p.name}`] })}</div>
</div></section>
${method()}
${closing('challenge')}`;
  return page({ slug, title, description, body });
}

// ---- /pricing/ --------------------------------------------------------------------------------
function pricingPage() {
  const slug = 'pricing';
  const title = `Pricing: Local SEO Plans from ${O.money(O.FROM)}/month | MADMarketing`;
  const description = `MADMarketing pricing: ${O.PLANS.map((p) => `${p.name} ${O.money(p.price)}/month`).join(', ')}, and ${O.FULL_GROWTH.name} on a custom quote. Eligible local businesses can start with 30 days free.`;
  const faq = [
    ['Which plan should I start with?', `${O.PLANS[1].name} is the plan we recommend. ${O.PLANS[0].name} is the entry-level plan for local presence management, and ${O.PLANS[2].name} adds deeper website and local search optimization.`],
    ['Is there a contract?', 'Each monthly plan starts with a written agreement that sets out billing, cancellation, service levels and deliverables, so you know the terms before you start.'],
    ['Do I have to pay after the free 30 days?', 'No. The MAD 30-Day Visibility Challenge has no agency fee, needs no credit card and never turns into a paid subscription without your explicit approval.'],
    ['Is ad spend included?', 'No. Advertising spend, hosting, paid directory listings, premium software and extensive development are excluded unless they’re written into your agreement.'],
    [`What does ${O.FULL_GROWTH.name} cost?`, 'It’s quoted to your scope: a custom combination of SEO, paid ads, social media, website/CRO and automation, with defined deliverables, account responsibilities and a reporting cadence. Media budgets and third-party costs are quoted separately.'],
    NO_GUARANTEE,
    ['Will you need my passwords?', 'No. You own your business profiles and advertising accounts. We work through role-based access and never ask for passwords.'],
  ];
  const offersLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: 'Local SEO', serviceType: 'Local SEO', areaServed: 'US', provider: { '@type': 'Organization', name: 'MADMarketing', url: SITE + '/' }, url: `${SITE}/pricing/`, offers: O.PLANS.map((p) => ({ '@type': 'Offer', name: p.name, description: p.short, priceCurrency: 'USD', price: String(p.price), priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'USD', unitText: 'MONTH' } })) })}</script>`;
  const body = `<section class="sp-hero sp-hero--center"><div class="sp-wrap">
  <p class="sp-k">Pricing</p>
  <h1>Local SEO plans, <em>priced plainly.</em></h1>
  <p class="sp-lede">Three monthly plans for local search, and a custom plan when you want more channels. Eligible local businesses can start with 30 days free.</p>
  <div class="sp-btns">${BTN.challenge}${BTN.callWhite}</div>
  <p class="sp-note">Launch pricing, in US dollars.</p>
</div></section>
<section class="sp-sec sp-sec--tight" id="plans"><div class="sp-wrap">
  ${R.plans({ headingTag: 'h2' })}
  ${R.fullGrowth({ headingTag: 'h2' })}
</div></section>
<section class="sp-sec sp-sec--tight" id="free-trial"><div class="sp-wrap">
  ${R.challenge()}
</div></section>
<section class="sp-sec" id="add-ons"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Optional add-ons</p><h2>Add what <em>you need.</em></h2><p>${O.SHOW_ADDON_PRICES ? 'Add any of these to a plan.' : 'Each add-on is scoped and quoted with your plan.'}</p></div>
  <div class="sp-price__body">${R.addons()}</div>
</div></section>
<section class="sp-sec sp-fam--alt" id="other-services"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Beyond local SEO</p><h2>One partner. <em>Multiple ways to grow.</em></h2><p>When your search foundations are strong, our team can support the next chapter. These services are scoped and quoted as ${esc(O.FULL_GROWTH.name)}.</p></div>
  <div class="sp-grid">${O.FAMILIES.filter((f) => f.key !== 'search').map((f) => { const p = O.PAGES.find((x) => x.family === f.key); return `<a class="sp-card sp-card--link" href="${p.href}"><b>${esc(f.name)}</b><p>${esc(f.services.map(([n]) => n).join(', '))}.</p><span>${esc(O.PAGES.filter((x) => x.family === f.key).map((x) => x.name).join(' · '))} ${ARROW}</span></a>`; }).join('')}<a class="sp-card sp-card--link" href="/services/"><b>All services</b><p>Every service in one place, by family.</p><span>See the full list ${ARROW}</span></a></div>
</div></section>
<section class="sp-sec" id="how-pricing-works"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Good to know</p><h2>How we work <em>with you.</em></h2></div>
  <div class="sp-grid">${O.RULES.map(([t, d]) => `<div class="sp-card sp-card--plain"><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
</div></section>
<section class="sp-sec sp-sec--tight"><div class="sp-wrap">
  <div class="sp-head"><p class="sp-k">Questions</p><h2>Frequently asked <em>questions.</em></h2></div>
  <div class="sp-faq">${faq.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  ${related('/pricing/')}
</div></section>
${closing('challenge')}
${offersLd}
${faqLd(faq)}`;
  return page({ slug, title, description, body });
}

// ---- write ---------------------------------------------------------------------------------------
const out = [...SERVICES.map((s) => [s.slug, servicePage(s)]), ['services', servicesIndex()], ['pricing', pricingPage()]];
for (const [slug, html] of out) {
  fs.mkdirSync(path.join(ROOT, slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, slug, 'index.html'), html);
}
// The plans' stylesheet for the homepage (fx/packages.css, bundled by inject-fx.js).
fs.writeFileSync(path.join(ROOT, 'fx', 'packages.css'), `/* Generated by scripts/build-service-pages.js from scripts/offer-render.js. Do not edit by hand. */${R.CSS}`);
console.log('service pages:', out.map(([s]) => '/' + s + '/').join(' '));

// ---- menus ---------------------------------------------------------------------------------------
// The Services menu (desktop dropdown, phone menu) and the footer's service
// columns list exactly the pages above, between markers in the partials.
const MENU = [
  ['Search & AI visibility', ['/services/local-seo/', '/services/google-maps-seo/', '/services/seo/', '/services/ai-search-optimization/']],
  ['Ads & social', ['/services/google-ads/', '/services/meta-ads/', '/services/social-media-marketing/']],
  ['Web & automation', ['/services/web-design/', '/services/marketing-automation/']],
];
const pageOf = (href) => O.PAGES.find((p) => p.href === href);
const between = (file, name, html) => {
  const f = path.join(ROOT, 'fx', 'partials', file);
  const s = fs.readFileSync(f, 'utf8');
  const a = `<!-- ${name} -->`;
  const b = `<!-- /${name} -->`;
  const i = s.indexOf(a);
  const j = s.indexOf(b);
  if (i === -1 || j === -1) throw new Error(`no ${name} markers in ${file}`);
  fs.writeFileSync(f, s.slice(0, i + a.length) + '\n' + html + '\n' + s.slice(j));
};
between('nav.html', 'menu:services', `${MENU.map(([k, hrefs], gi) => `          <div class="hx-dd__group"><p class="hx-dd__k">${esc(k)}</p>${hrefs.map((h) => { const p = pageOf(h); return `<a href="${h}"><b>${esc(p.name)}</b><span>${esc(p.line)}</span></a>`; }).join('')}${gi === MENU.length - 1 ? '<a href="/free-local-seo/"><b>Free 30-day challenge</b><span>Local SEO for eligible businesses</span></a>' : ''}</div>`).join('\n')}
          <a class="hx-dd__all" href="/services/">All services <i aria-hidden="true">→</i></a>`);
between('nav.html', 'menu:services-phone', `${O.PAGES.map((p) => `        <a href="${p.href}">${esc(p.name)}</a>`).join('\n')}
        <a href="/services/">All services</a>`);
between('footer.html', 'menu:footer', MENU.map(([k, hrefs], gi) => `        <div class="ft-col">
          <p class="ft-col__k">${esc(k)}</p>
${hrefs.map((h) => `          <a href="${h}">${esc(pageOf(h).name)}</a>`).join('\n')}${gi === 0 ? '\n          <a href="/free-local-seo/">Free 30-Day Local SEO</a>' : ''}${gi === 1 ? '\n          <a href="/examples/">Our Work</a>' : ''}${gi === 2 ? '\n          <a href="/services/">All Services</a>\n          <a href="/pricing/">Pricing</a>' : ''}
        </div>`).join('\n'));
console.log('menus: nav.html, footer.html');

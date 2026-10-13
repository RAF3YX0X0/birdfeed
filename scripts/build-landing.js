// The ads landing page for the MAD 30-Day Visibility Challenge (client brief,
// 2026-10: "Landing Page Copy • Qualification Form • FAQs • Conversion Funnel
// • CRM Automation", plus two visual references). Separate from the
// homepage: its own announcement bar, anchor nav and footer (no site menu, so
// ad visitors stay on the offer), no intro curtain, a two-step qualification
// form and a sticky Apply button on phones.
//
// Copy is the client's. The references' made-up proof (testimonials, "#1
// ranking", rating counts, tool logos, "Most popular") is left out, as the
// brief itself asks: only genuine results and real testimonials.
//
// Also builds /trial-terms/, which gathers the trial terms the brief states.
//
//   node scripts/build-landing.js   (then build-fx.js, optimize-pages.js)
// The form posts to api/free-local-seo.js.
const fs = require('fs');
const path = require('path');
const O = require('./offer-data');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://madmarketinghaseeb.vercel.app';
const EMAIL = 'hello@madmediamarketing.com';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ARROW = '<svg class="lp-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DOWN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const G = {
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1"/>',
  hand: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11"/><path d="M3 11l4-4 4 2 3-2 4 3 3 3-6 6"/><path d="M7 7 3 11l5 5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  road: '<path d="M4 20 8 4M20 20 16 4M12 6v2M12 11v2M12 16v2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  badge: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  form: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  audit: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.5-4.5M8 10.5l2 2 3.5-3.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  report: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 7.6 20 18M8.6 16.4 20 6"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  car: '<path d="M5 17h14M4 13l2-5h12l2 5v4H4z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  store: '<path d="M4 9h16l-1-5H5zM5 9v11h14V9"/><path d="M10 20v-5h4v5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
};
const ic = (n, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[n]}</svg>`;

// ---- Copy (the client's) ---------------------------------------------------------------
const PROBLEMS = [
  'Competitors may appear more prominently on Google Maps.',
  'Business information may be incomplete or inconsistent.',
  'Customers may struggle to find accurate service information.',
  'Your website may not communicate where you operate.',
  'You may not know which local keywords matter most.',
];
const INCLUDED = [
  ['badge', 'Google Business Profile Audit & Optimization', 'Review eligible profile fields, services, categories and description.'],
  ['search', 'Local SEO & Competitor Analysis', 'Research local keywords and nearby competitors.'],
  ['link', '10 Local Citation Actions', 'Submit or correct up to 10 relevant business listings.'],
  ['chart', 'Local Search Visibility Tracking', 'Baseline and follow-up ranking snapshots with comparable methodology.'],
  ['star', 'Review Growth Recommendations', 'Ethical strategy for genuine customer reviews.'],
  ['road', '90-Day Growth Roadmap', 'Prioritized recommendations for continued optimization.'],
];
const BENEFITS = [
  ['eye', 'More Discoverability', 'Help search engines understand your business and the services you offer.'],
  ['shield', 'Stronger Local Credibility', 'Present consistent, accurate information wherever customers find you.'],
  ['smile', 'Better Customer Experience', 'Make it easier for potential customers to locate, contact, and learn about your business.'],
  ['layers', 'Long-Term Growth Foundations', 'Build a stronger base for ongoing local SEO and digital marketing.'],
];
const MAD = [
  ['M', 'Market Intelligence', 'We study your local market, competitors, customers, and search opportunities before building a strategy.'],
  ['A', 'Attention & Authority', 'We help your business become easier to discover and more credible through accurate information, relevant content, and stronger local search foundations.'],
  ['D', 'Data-Driven Growth', 'We track what matters, explain the results, and use real insights to recommend the next steps.'],
];
const STEPS = [
  ['form', 'Apply', 'Tell us about your business and the area you serve. We’ll review your eligibility and local SEO opportunities.'],
  ['audit', 'Get Your Visibility Audit', 'Our team assesses your Google Business Profile, website, citations, and local competitors.'],
  ['gear', 'We Get to Work', 'Over 30 days, we complete the agreed optimization tasks, citation actions, and visibility tracking.'],
  ['report', 'Review Your Results', 'Receive a report showing what was completed, what changed, what remains in progress, and what we recommend next.'],
];
const WHO = [
  ['scissors', 'Barbershops and hair salons'],
  ['sparkle', 'Cleaning and facility services'],
  ['wrench', 'HVAC, plumbing, electrical, and home services'],
  ['car', 'Auto detailing and automotive services'],
  ['dumbbell', 'Fitness studios and wellness businesses'],
  ['store', 'Other eligible service-area or storefront businesses'],
];
const REPORT = [
  'Starting local visibility snapshot',
  'Google Business Profile optimization summary',
  'Citation submission/correction log',
  'Relevant keyword and competitor observations',
  'Follow-up visibility snapshot',
  'Next-step growth recommendations',
];
// The plans and their prices: scripts/offer-data.js (the client's rate card).
const PLANS = O.PLANS.map((p) => [p.name, O.money(p.price), p.short]);
const RULES = [
  ['Legitimate local business', 'Required'],
  ['Verified Google Business Profile', 'Required before trial activation'],
  ['Authorized decision-maker', 'Required'],
  ['Supported service market', 'Required'],
  ['Google Business Profile manager access', 'Required before work begins'],
  ['Website', 'Preferred'],
  ['Suspended profile', 'Manual review'],
  ['Capacity', 'Admission subject to available slots'],
];
const FAQ = [
  ['Is the trial really free?', 'Yes. Eligible businesses receive the agreed 30-day Local SEO work for $0 agency fees. No credit card is required. Any optional third-party paid tools or services must be separately approved and paid for by the business in advance.'],
  ['Will you get my business to #1 on Google?', 'No. No agency can honestly guarantee a particular Google ranking. We optimize your local search foundations and document progress.'],
  ['Do I need a website?', 'A website is helpful but not mandatory for the basic trial. Your business must have an existing verified Google Business Profile and meet our eligibility requirements.'],
  ['What are local citations?', 'Business information listings or mentions on relevant websites and directories. Consistent business information helps customers find accurate details and supports a well-maintained local presence.'],
  ['How long does SEO take?', 'Results vary and may take weeks or months. The 30-day trial demonstrates real work, establishes a useful baseline, and identifies future opportunities.'],
  ['What happens after 30 days?', 'You receive a report and an optional proposal. You can subscribe to an ongoing plan or stop. There is no automatic paid renewal.'],
  ['Do you need my Google password?', 'No. Never share your Google password. If you’re approved, you grant us appropriate manager access to your Google Business Profile, and you keep ownership of it.'],
  ['Will you create reviews or guarantee leads?', 'No. No fake reviews, manipulated engagement, guaranteed leads or guaranteed ranking positions. We follow legitimate review practices.'],
  ['Is every business accepted?', 'No. Applications are screened for business legitimacy, profile status, location, eligibility, scope and team capacity.'],
];

// ---- Styles ------------------------------------------------------------------------------
const CSS = `
@font-face{font-family:Satoshi;font-style:normal;font-weight:300 900;font-display:swap;src:url(/fonts/satoshi-variable.woff2) format("woff2")}
@font-face{font-family:"Satoshi Fallback";src:local("Arial");ascent-override:93.3%;descent-override:22.17%;line-gap-override:9.24%;size-adjust:108.25%}
html{scroll-behavior:smooth}
body{margin:0;background:#fff;color:#0A0A0A;font-family:Satoshi,"Satoshi Fallback",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.lp,.lp-nav,.lp-bar,.lp-foot,.lp-sticky{--blue:#0066FF;--blue-d:#0052CC;--ink:#0A0A0A;--muted:#4B5563;--faint:#6B7280;--line:#E5E7EB;--soft:#F5F7FA}
.lp *,.lp-nav *,.lp-foot *,.lp-sticky *{box-sizing:border-box}
.lp{overflow-x:clip}
.lp section[id]{scroll-margin-top:84px}
.lp-in{max-width:1200px;margin:0 auto;padding:0 24px}
/* Announcement bar + nav */
.lp-bar{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 16px;background:#0A0A0A;color:#fff;font-size:12.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;text-align:center;line-height:1.4}
.lp-bar i{flex:none;width:7px;height:7px;border-radius:50%;background:#2E86FF;box-shadow:0 0 0 0 rgba(46,134,255,.6);animation:lp-ping 2s ease-out infinite}
@keyframes lp-ping{70%{box-shadow:0 0 0 8px rgba(46,134,255,0)}100%{box-shadow:0 0 0 0 rgba(46,134,255,0)}}
.lp-nav{position:sticky;top:0;z-index:80;background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(16px) saturate(180%);backdrop-filter:blur(16px) saturate(180%);border-bottom:1px solid rgba(10,10,10,.06)}
.lp-nav .lp-in{display:flex;align-items:center;justify-content:space-between;gap:20px;height:68px}
.lp-nav__logo img{display:block;width:172px;height:auto}
.lp-nav__links{display:flex;gap:4px}
.lp-nav__links a{padding:10px 14px;border-radius:999px;color:#0A0A0A;font-size:14.5px;font-weight:500;text-decoration:none;transition:background .2s ease}
.lp-nav__links a:hover{background:rgba(10,10,10,.05)}
/* Buttons */
.lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:14px 28px;border:0;border-radius:999px;font:600 15.5px/1.2 Satoshi,"Satoshi Fallback",system-ui,sans-serif;text-decoration:none;text-align:center;cursor:pointer;transition:transform .3s cubic-bezier(.22,1,.36,1),background .2s ease,box-shadow .3s ease}
.lp-btn:hover{transform:translateY(-2px)}
.lp-btn:hover .lp-arrow{transform:translateX(3px)}
.lp-arrow{transition:transform .3s cubic-bezier(.22,1,.36,1)}
.lp-btn--blue{background:#0066FF;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 14px 30px -12px rgba(0,102,255,.85)}
.lp-btn--blue:hover{background:#0052CC}
.lp-btn--white{background:#fff;color:#0A0A0A;box-shadow:0 0 0 1px rgba(10,10,10,.1),0 8px 20px -12px rgba(20,30,70,.3)}
.lp-btn--sm{min-height:42px;padding:10px 20px;font-size:14px}
/* Type */
.lp-k{display:inline-flex;align-items:center;gap:14px;margin:0;font-size:12.5px!important;line-height:1.3!important;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#0066FF}
.lp-k::before{content:'';width:34px;height:1.5px;border-radius:2px;background:linear-gradient(90deg,rgba(0,102,255,0),#0066FF)}
.lp-dark .lp-k{color:#7DB2FF}.lp-dark .lp-k::before{background:linear-gradient(90deg,rgba(125,178,255,0),#7DB2FF)}
.lp h1,.lp h2,.lp h3{margin:0;letter-spacing:-.03em;text-wrap:balance}
.lp h1{margin-top:20px;font-size:clamp(40px,5.1vw,70px);font-weight:800;line-height:1.02}
.lp h2{margin-top:16px;font-size:clamp(32px,3.8vw,52px);font-weight:800;line-height:1.04}
.lp h1 em,.lp h2 em{font-style:normal;color:#0066FF}
.lp-dark h2 em{color:#4D94FF}
.lp-p{margin:18px 0 0;max-width:640px;font-size:clamp(16.5px,1.3vw,18.5px);line-height:1.65;color:#4B5563}
.lp-dark .lp-p{color:rgba(255,255,255,.72)}
.lp-note{margin:14px 0 0;font-size:13px;line-height:1.55;color:#6B7280}
.lp-center{text-align:center}.lp-center .lp-p{margin-left:auto;margin-right:auto}
.lp-sec{padding:clamp(72px,9vw,120px) 0}
.lp-sec--soft{background:#F5F7FA}
.lp-head{max-width:780px}
.lp-center .lp-head{margin:0 auto}
/* Brush strokes */
.lp-brush{position:relative;display:inline-block;white-space:nowrap}
.lp-brush svg{position:absolute;left:-2%;right:-2%;bottom:-.16em;width:104%;height:.3em;overflow:visible}
.lp-brush path{fill:none;stroke:#0066FF;stroke-width:5;stroke-linecap:round;stroke-dasharray:400;stroke-dashoffset:400;animation:lp-draw 1.1s cubic-bezier(.65,0,.35,1) .6s forwards}
@keyframes lp-draw{to{stroke-dashoffset:0}}
.lp-dashes{position:absolute;overflow:visible}
.lp-dashes path{fill:none;stroke:#0066FF;stroke-width:4;stroke-linecap:round;stroke-dasharray:40;stroke-dashoffset:40;animation:lp-draw .5s ease-out forwards}
.lp-dashes path:nth-child(2){animation-delay:.12s}.lp-dashes path:nth-child(3){animation-delay:.24s}
/* Hero */
.lp-hero{position:relative;padding:clamp(48px,6vw,84px) 0 clamp(48px,6vw,72px);overflow:hidden}
.lp-hero::before{content:'';position:absolute;right:-10%;top:-20%;width:60vw;height:60vw;max-width:820px;max-height:820px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,102,255,.12),rgba(0,102,255,0));pointer-events:none}
.lp-hero__grid{position:relative;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr);gap:clamp(32px,4vw,64px);align-items:center}
.lp-hero__title{position:relative}
.lp-hero__title .lp-dashes{right:-8px;top:-18px;width:54px;height:48px}
.lp-fee{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:6px 22px;max-width:560px;margin-top:28px;padding:20px 26px;border-radius:24px;background:linear-gradient(180deg,#F6FAFF,#EEF5FF);box-shadow:inset 0 0 0 1.5px #D3E3FF}
.lp-fee b{font-size:clamp(56px,6vw,76px);font-weight:900;line-height:.9;letter-spacing:-.04em;color:#0066FF}
.lp-fee span{padding-left:22px;border-left:1.5px solid #C6DAFF;font-size:clamp(18px,1.8vw,24px);font-weight:700;line-height:1.15;letter-spacing:.02em;text-transform:uppercase}
.lp-fee span small{display:block;font-weight:500;color:#1F2937}
.lp-fee p{grid-column:1/-1;margin:6px 0 0;font-size:14.5px;color:#1F2937}
.lp-fee .lp-dashes{right:18px;top:16px;width:44px;height:40px}
.lp-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
/* Hero visual: a Google-style local search, the profile being optimized */
.lp-vis{position:relative;min-height:540px;perspective:1600px}
.lp-vis__blob{position:absolute;inset:8% 4% 6% 10%;border-radius:50%;background:radial-gradient(closest-side,#DCE9FF,rgba(220,233,255,0))}
.lp-g{position:absolute;left:4%;right:14%;top:2%;padding:18px;border-radius:28px;background:#fff;box-shadow:0 0 0 1px rgba(10,10,10,.05),0 50px 90px -40px rgba(20,40,110,.45);transform:rotateY(-10deg) rotateX(5deg);transform-style:preserve-3d;transition:transform .9s cubic-bezier(.22,1,.36,1);animation:lp-float 7s ease-in-out infinite}
.lp-vis:hover .lp-g{transform:rotateY(-4deg) rotateX(2deg)}
@keyframes lp-float{50%{translate:0 -8px}}
.lp-g__brand{font-size:24px;font-weight:600;letter-spacing:-.02em;font-family:"Product Sans",Satoshi,system-ui,sans-serif}
.lp-g__brand span:nth-child(1),.lp-g__brand span:nth-child(4){color:#4285F4}.lp-g__brand span:nth-child(2),.lp-g__brand span:nth-child(6){color:#EA4335}.lp-g__brand span:nth-child(3){color:#FBBC05}.lp-g__brand span:nth-child(5){color:#34A853}
.lp-g__search{display:flex;align-items:center;gap:10px;margin-top:12px;padding:11px 16px;border-radius:999px;box-shadow:0 0 0 1px #E5E7EB,0 6px 16px -10px rgba(20,30,70,.3);font-size:14.5px;color:#1F2937}
.lp-g__search svg{color:#4285F4;flex:none}
.lp-g__q::after{content:'';display:inline-block;width:1.5px;height:1em;margin-left:2px;vertical-align:-2px;background:#1F2937;animation:lp-caret 1s steps(1) infinite}
@keyframes lp-caret{50%{opacity:0}}
.lp-map{position:relative;height:200px;margin-top:14px;overflow:hidden;border-radius:18px;background:#EEF2F6}
.lp-map svg{position:absolute;inset:0;width:100%;height:100%}
.lp-pin{position:absolute;width:26px;height:34px;margin:-34px 0 0 -13px;animation:lp-drop .7s cubic-bezier(.34,1.56,.64,1) both}
.lp-pin svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25))}
.lp-pin--you{width:40px;height:52px;margin:-52px 0 0 -20px;animation-delay:.9s;z-index:2}
.lp-pin--you::after{content:'';position:absolute;left:50%;bottom:-6px;width:34px;height:12px;margin-left:-17px;border-radius:50%;background:rgba(0,102,255,.35);animation:lp-pulse 2.2s ease-out 1.6s infinite}
@keyframes lp-drop{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:none}}
@keyframes lp-pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.4);opacity:0}}
.lp-res{display:grid;gap:8px;margin-top:12px}
.lp-res__row{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;box-shadow:0 0 0 1px #EEF0F3}
.lp-res__row--you{background:#F5F9FF;box-shadow:0 0 0 1.5px #0066FF,0 16px 30px -18px rgba(0,102,255,.6);animation:lp-rise .8s cubic-bezier(.22,1,.36,1) 1.4s both}
@keyframes lp-rise{from{opacity:0;transform:translateY(14px)}}
.lp-res__ava{width:40px;height:40px;border-radius:12px;background:#E5E7EB}
.lp-res__row--you .lp-res__ava{display:grid;place-items:center;background:#0066FF;color:#fff}
.lp-res__row b{display:block;font-size:14.5px}
.lp-res__row small{display:block;margin-top:3px;font-size:12px;color:#6B7280}
.lp-res__bar{display:block;height:8px;border-radius:4px;background:#EEF0F3}
.lp-res__bar+.lp-res__bar{width:60%;margin-top:6px}
.lp-res__go{display:flex;gap:6px}
.lp-res__go i{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#EBF3FF;color:#0066FF;font-style:normal}
.lp-fc{position:absolute;padding:16px 18px;border-radius:22px;background:#fff;box-shadow:0 0 0 1px rgba(10,10,10,.05),0 40px 70px -36px rgba(20,40,110,.5)}
.lp-fc h4{margin:0;font-size:13px;font-weight:700;letter-spacing:-.01em}
.lp-fc small{display:block;margin-top:2px;font-size:11.5px;color:#6B7280}
.lp-fc--profile{right:0;top:18%;width:228px;animation:lp-float 8s ease-in-out .8s infinite}
.lp-ticks{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:9px}
.lp-ticks li{display:flex;align-items:center;gap:10px;font-size:13px;color:#1F2937}
.lp-ticks i{flex:none;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#E5E7EB;color:#fff;transition:background .4s ease,transform .4s cubic-bezier(.34,1.56,.64,1)}
.lp-ticks i svg{opacity:0;transition:opacity .3s ease}
.is-on.lp-ticks li i,.is-on .lp-ticks li i{background:#16A34A;transform:scale(1.08)}
.is-on.lp-ticks li i svg,.is-on .lp-ticks li i svg{opacity:1}
.is-on .lp-ticks li:nth-child(2) i,.is-on.lp-ticks li:nth-child(2) i{transition-delay:.25s}.is-on .lp-ticks li:nth-child(2) i svg{transition-delay:.25s}
.is-on .lp-ticks li:nth-child(3) i,.is-on.lp-ticks li:nth-child(3) i{transition-delay:.5s}.is-on .lp-ticks li:nth-child(3) i svg{transition-delay:.5s}
.is-on .lp-ticks li:nth-child(4) i,.is-on.lp-ticks li:nth-child(4) i{transition-delay:.75s}.is-on .lp-ticks li:nth-child(4) i svg{transition-delay:.75s}
.is-on .lp-ticks li:nth-child(5) i,.is-on.lp-ticks li:nth-child(5) i{transition-delay:1s}.is-on .lp-ticks li:nth-child(5) i svg{transition-delay:1s}
.is-on .lp-ticks li:nth-child(6) i,.is-on.lp-ticks li:nth-child(6) i{transition-delay:1.25s}.is-on .lp-ticks li:nth-child(6) i svg{transition-delay:1.25s}
.lp-fc--chart{right:4%;bottom:2%;width:250px;animation:lp-float 9s ease-in-out 1.6s infinite}
.lp-fc--chart svg{display:block;width:100%;height:84px;margin-top:10px;overflow:visible}
.lp-fc--chart .lp-line{fill:none;stroke:#0066FF;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:300;stroke-dashoffset:300;transition:stroke-dashoffset 1.6s cubic-bezier(.65,0,.35,1) .3s}
.lp-fc--chart .lp-base{fill:none;stroke:#C9CED6;stroke-width:2;stroke-dasharray:4 5}
.lp-fc--chart.is-on .lp-line{stroke-dashoffset:0}
.lp-fc__legend{display:flex;gap:14px;margin-top:8px;font-size:11px;color:#6B7280}
.lp-fc__legend i{display:inline-block;width:14px;height:3px;margin-right:6px;vertical-align:2px;border-radius:2px;background:#0066FF}
.lp-fc__legend i.is-base{background:#C9CED6}
.lp-caption{position:absolute;left:6%;bottom:-6px;font-size:11px;color:#9CA3AF}
/* Trust row */
.lp-trust{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:clamp(36px,5vw,56px);border-radius:24px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 30px 60px -48px rgba(20,30,70,.5)}
.lp-trust div{display:flex;align-items:center;gap:16px;padding:22px 26px}
.lp-trust div+div{border-left:1px solid #E5E7EB}
.lp-trust span{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:#EBF3FF;color:#0066FF}
.lp-trust b{font-size:16px;font-weight:600;line-height:1.3}
/* Problem */
.lp-prob{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-top:40px}
.lp-prob li{list-style:none;display:flex;flex-direction:column;gap:16px;padding:22px;border-radius:22px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;font-size:15.5px;line-height:1.5;color:#1F2937}
.lp-prob span{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:#FFF1E6;color:#E06B00}
.lp-prob{padding:0;margin-left:0;margin-right:0}
.lp-close{margin:34px 0 0;font-size:clamp(20px,2vw,26px);font-weight:700;letter-spacing:-.02em}
.lp-close em{font-style:normal;color:#0066FF}
/* Offer */
.lp-inc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:44px 0 0;padding:0;list-style:none;counter-reset:inc}
.lp-inc li{position:relative;padding:26px;border-radius:26px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 24px 50px -40px rgba(20,30,70,.45);transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
.lp-inc li:hover{transform:translateY(-4px);box-shadow:0 0 0 1px rgba(0,102,255,.35),0 30px 60px -36px rgba(0,102,255,.45)}
.lp-inc li::after{counter-increment:inc;content:counter(inc,decimal-leading-zero);position:absolute;top:24px;right:26px;font-size:13px;font-weight:700;color:#C9CED6}
.lp-ic{display:grid;place-items:center;width:50px;height:50px;border-radius:16px;background:#EBF3FF;color:#0066FF}
.lp-inc b{display:block;margin-top:20px;font-size:18px;font-weight:700;letter-spacing:-.015em;line-height:1.25}
.lp-inc p{margin:8px 0 0;font-size:15px;line-height:1.6;color:#4B5563}
.lp-price{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:24px;margin-top:22px;padding:clamp(26px,3vw,40px);border-radius:30px;color:#fff;background:radial-gradient(70% 140% at 100% 0%,rgba(0,102,255,.55),rgba(0,102,255,0) 60%),#0A0A0A}
.lp-price__k{margin:0;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.lp-price__v{margin:6px 0 0;font-size:clamp(30px,3.6vw,46px);font-weight:800;letter-spacing:-.03em}
.lp-price__v b{color:#4D94FF}
.lp-price p{margin:8px 0 0;font-size:15px;color:rgba(255,255,255,.72)}
/* Why local SEO matters */
.lp-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,5vw,72px);align-items:center}
.lp-ben{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 26px;margin-top:34px}
.lp-ben div{display:flex;gap:14px}
.lp-ben .lp-ic{flex:none;width:46px;height:46px;border-radius:14px}
.lp-ben b{display:block;font-size:16.5px;font-weight:700}
.lp-ben p{margin:4px 0 0;font-size:14.5px;line-height:1.55;color:#4B5563}
.lp-ba{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.lp-ba__card{padding:20px;border-radius:24px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 40px 70px -50px rgba(20,30,70,.55)}
.lp-ba__card:last-child{box-shadow:0 0 0 1.5px #0066FF,0 40px 70px -40px rgba(0,102,255,.5)}
.lp-ba__tag{display:inline-block;padding:6px 12px;border-radius:999px;background:#F1F2F4;font-size:12.5px;font-weight:700}
.lp-ba__card:last-child .lp-ba__tag{background:#0066FF;color:#fff}
.lp-ba ul{margin:16px 0 0;padding:0;list-style:none;display:grid;gap:11px}
.lp-ba li{display:flex;align-items:center;gap:10px;font-size:14px;color:#1F2937}
.lp-ba li i{flex:none;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;font-style:normal;font-size:12px;font-weight:700}
.lp-ba__card:first-child li i{background:#FDECEC;color:#D93A3A}
.lp-ba__card:last-child li i{background:#16A34A;color:#fff}
.lp-ba__note{grid-column:1/-1;margin:2px 0 0;font-size:12px;color:#9CA3AF;text-align:center}
/* Why MAD */
.lp-dark{color:#fff;background:radial-gradient(60% 80% at 85% 0%,rgba(0,102,255,.4),rgba(0,102,255,0) 65%),radial-gradient(50% 60% at 0% 100%,rgba(0,102,255,.2),rgba(0,102,255,0) 70%),#0A0A0A}
.lp-mad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:44px 0 0;padding:0;list-style:none}
.lp-mad li{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;min-height:330px;padding:28px;border-radius:28px;background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);transition:box-shadow .4s ease,transform .5s cubic-bezier(.22,1,.36,1)}
.lp-mad li:hover{transform:translateY(-6px);box-shadow:inset 0 0 0 1px rgba(77,148,255,.55),0 30px 60px -30px rgba(0,102,255,.6)}
.lp-mad__l{position:absolute;top:-.12em;right:.06em;font-size:clamp(150px,15vw,220px);font-weight:900;line-height:1;background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(77,148,255,.55) 55%,rgba(0,102,255,0) 92%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lp-mad b{font-size:22px;font-weight:700;letter-spacing:-.02em}
.lp-mad b span{color:#4D94FF}
.lp-mad p{margin:10px 0 0;font-size:15.5px;line-height:1.6;color:rgba(255,255,255,.72)}
.lp-tag{margin:34px 0 0;font-size:clamp(20px,2.2vw,28px);font-weight:800;letter-spacing:-.02em}
.lp-tag em{font-style:normal;color:#4D94FF}
/* How it works */
.lp-steps{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin:48px 0 0;padding:0;list-style:none}
.lp-steps::before{content:'';position:absolute;left:12%;right:12%;top:34px;height:2px;background:repeating-linear-gradient(90deg,#C6DAFF 0 8px,transparent 8px 16px)}
.lp-steps li{position:relative;text-align:center}
.lp-steps__ic{position:relative;display:grid;place-items:center;width:68px;height:68px;margin:0 auto;border-radius:22px;background:#fff;color:#0066FF;box-shadow:0 0 0 1px #E5E7EB,0 20px 40px -24px rgba(0,102,255,.55)}
.lp-steps__n{display:block;margin-top:20px;font-size:12.5px;font-weight:700;letter-spacing:.14em;color:#0066FF}
.lp-steps b{display:block;margin-top:6px;font-size:19px;font-weight:700;letter-spacing:-.015em}
.lp-steps p{margin:8px auto 0;max-width:260px;font-size:15px;line-height:1.6;color:#4B5563}
.lp-after{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px 24px;margin-top:44px;padding:22px 26px;border-radius:22px;background:#F5F7FA;text-align:center}
.lp-after p{margin:0;max-width:600px;font-size:15.5px;line-height:1.55;color:#1F2937}
/* Who */
.lp-who{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:40px 0 0;padding:0;list-style:none}
.lp-who li{display:flex;align-items:center;gap:16px;padding:20px 22px;border-radius:22px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;font-size:16px;font-weight:600;line-height:1.35;transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
.lp-who li:hover{transform:translateY(-3px);box-shadow:0 0 0 1px rgba(0,102,255,.35),0 24px 50px -36px rgba(0,102,255,.5)}
.lp-who .lp-ic{flex:none}
.lp-fit{display:flex;gap:14px;align-items:flex-start;margin-top:22px;padding:20px 24px;border-radius:22px;background:#EBF3FF;color:#0B2A66;font-size:15.5px;line-height:1.55}
.lp-fit svg{flex:none;color:#0066FF;margin-top:2px}
/* Transparent results */
.lp-doc{position:relative;padding:28px;border-radius:28px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 60px 100px -60px rgba(20,30,70,.6);transform:perspective(1400px) rotateY(-6deg) rotateX(3deg);transition:transform .8s cubic-bezier(.22,1,.36,1)}
.lp-doc:hover{transform:none}
.lp-doc__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:18px;border-bottom:1px solid #E5E7EB}
.lp-doc__head b{font-size:17px;font-weight:700}
.lp-doc__head small{display:block;margin-top:2px;font-size:12.5px;color:#6B7280}
.lp-doc__logo{width:44px;height:44px;border-radius:12px;background:#0A0A0A url(/assets/madmarketing-mark-white.svg) center/70% no-repeat}
.lp-doc .lp-ticks{gap:14px;margin-top:18px}
.lp-doc .lp-ticks li{font-size:15px}
.lp-doc .lp-ticks i{width:24px;height:24px}
.lp-promise{margin-top:28px;padding:20px 24px;border-left:3px solid #0066FF;border-radius:0 18px 18px 0;background:#F5F7FA;font-size:17px;font-weight:600;line-height:1.5}
/* Plans */
.lp-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:44px}
.lp-plan{display:flex;flex-direction:column;padding:28px;border-radius:28px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 30px 60px -48px rgba(20,30,70,.5);transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
.lp-plan:hover{transform:translateY(-4px)}
.lp-plan--mid{box-shadow:0 0 0 2px #0066FF,0 40px 70px -40px rgba(0,102,255,.55)}
.lp-plan h3{font-size:19px;font-weight:700}
.lp-plan__price{margin:14px 0 0;font-size:44px;font-weight:800;letter-spacing:-.04em}
.lp-plan__price small{font-size:16px;font-weight:500;letter-spacing:0;color:#6B7280}
.lp-plan p{flex:1;margin:12px 0 0;font-size:15px;line-height:1.6;color:#4B5563}
.lp-plan .lp-btn{margin-top:22px}
/* Apply */
.lp-apply{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,5vw,64px);align-items:start}
.lp-rules{margin:30px 0 0;padding:0;list-style:none;border-radius:22px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;overflow:hidden}
.lp-rules li{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 18px;font-size:14.5px}
.lp-rules li+li{border-top:1px solid #EEF0F3}
.lp-rules em{flex:none;padding:5px 10px;border-radius:999px;background:#F1F2F4;color:#1F2937;font-size:12px;font-style:normal;font-weight:600;text-align:right}
.lp-rules em.is-req{background:#EBF3FF;color:#0052CC}
.lp-form{position:relative;padding:clamp(24px,3vw,36px);border-radius:30px;background:#fff;box-shadow:0 0 0 1px #E5E7EB,0 60px 100px -60px rgba(20,30,70,.6)}
.lp-form__steps{display:flex;gap:10px;margin:0 0 24px;padding:0;list-style:none}
.lp-form__steps li{flex:1;padding-top:12px;border-top:3px solid #E5E7EB;font-size:13px;font-weight:600;color:#9CA3AF;transition:border-color .3s ease,color .3s ease}
.lp-form__steps li.is-on{border-color:#0066FF;color:#0A0A0A}
.lp-form__steps li small{display:block;font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0066FF}
.lp-step{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.lp-step[hidden]{display:none}
.lp-field{display:flex;flex-direction:column;gap:8px}
.lp-field--wide{grid-column:1/-1}
.lp-field>span{font-size:14px;font-weight:600}
.lp-field>span small{font-weight:400;color:#6B7280}
.lp-field input,.lp-field select,.lp-field textarea{width:100%;min-height:50px;padding:12px 16px;border:0;border-radius:14px;background:#F9FAFB;box-shadow:inset 0 0 0 1px #E2E5EA;font:inherit;font-size:15px;color:#0A0A0A;transition:box-shadow .2s ease,background .2s ease}
.lp-field textarea{min-height:100px;resize:vertical}
.lp-field input:focus,.lp-field select:focus,.lp-field textarea:focus{outline:0;background:#fff;box-shadow:inset 0 0 0 1.5px #0066FF,0 0 0 4px rgba(0,102,255,.1)}
.lp-field.is-bad input,.lp-field.is-bad select{box-shadow:inset 0 0 0 1.5px #D93A3A}
.lp-radios{display:flex;flex-wrap:wrap;gap:8px}
.lp-radios label{position:relative}
.lp-radios input{position:absolute;opacity:0;pointer-events:none}
.lp-radios span{display:inline-flex;align-items:center;min-height:44px;padding:10px 18px;border-radius:999px;background:#F9FAFB;box-shadow:inset 0 0 0 1px #E2E5EA;font-size:14.5px;font-weight:500;cursor:pointer;transition:background .2s ease,box-shadow .2s ease,color .2s ease}
.lp-radios input:checked+span{background:#0066FF;color:#fff;box-shadow:none}
.lp-radios input:focus-visible+span{outline:2px solid #0066FF;outline-offset:2px}
.lp-check{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.5;color:#1F2937}
.lp-check input{flex:none;width:18px;height:18px;margin-top:2px;accent-color:#0066FF}
.lp-check a{color:#0066FF}
.lp-form__foot{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:6px}
.lp-back{padding:10px 4px;border:0;background:none;color:#4B5563;font:inherit;font-size:14.5px;font-weight:600;cursor:pointer}
.lp-back:hover{color:#0A0A0A}
.lp-msg{margin:0 0 16px;padding:14px 18px;border-radius:16px;font-size:15px;line-height:1.5}
.lp-msg[hidden]{display:none}.lp-msg--ok{background:#EBF3FF;color:#0040A0}.lp-msg--err{background:#FDECEC;color:#A32121}
.lp-done{text-align:center;padding:30px 10px}
.lp-done[hidden]{display:none}
.lp-done span{display:inline-grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#16A34A;color:#fff}
.lp-done h3{margin-top:18px;font-size:26px;font-weight:800}
.lp-done p{margin:10px auto 0;max-width:420px;font-size:15.5px;line-height:1.6;color:#4B5563}
.lp-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
/* FAQ */
.lp-faq{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(32px,5vw,64px);align-items:start}
.lp-faq__list{display:grid;gap:10px}
.lp-faq details{border-radius:20px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;transition:box-shadow .3s ease}
.lp-faq details[open]{box-shadow:0 0 0 1.5px #0066FF,0 24px 50px -36px rgba(0,102,255,.5)}
.lp-faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;list-style:none;cursor:pointer;font-size:16.5px;font-weight:700}
.lp-faq summary::-webkit-details-marker{display:none}
.lp-faq summary::after{content:'+';flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#F1F2F4;font-size:18px;font-weight:500;transition:transform .3s ease,background .3s ease,color .3s ease}
.lp-faq details[open] summary::after{transform:rotate(45deg);background:#0066FF;color:#fff}
.lp-faq details p{margin:0;padding:0 24px 22px;font-size:15.5px;line-height:1.65;color:#4B5563}
/* Final CTA */
.lp-final{margin:0 24px;padding:clamp(48px,6vw,84px) clamp(24px,5vw,72px);border-radius:40px;display:grid;grid-template-columns:minmax(0,1.2fr) auto;gap:28px;align-items:center}
.lp-final h2{margin-top:14px}
.lp-final__big{margin:16px 0 0;font-size:clamp(18px,1.8vw,22px);font-weight:700;color:#fff}
.lp-final__checks{display:flex;flex-wrap:wrap;gap:10px 22px;margin:22px 0 0;padding:0;list-style:none}
.lp-final__checks li{display:flex;align-items:center;gap:8px;font-size:14px;color:rgba(255,255,255,.8)}
.lp-final__checks i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#0066FF;color:#fff}
/* Footer */
.lp-foot{margin-top:clamp(48px,6vw,80px);padding:48px 0 36px;background:#0A0A0A;color:rgba(255,255,255,.7);font-size:14px}
.lp-foot__top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:28px}
.lp-foot__logo img{display:block;width:180px;height:auto}
.lp-foot__tag{margin:12px 0 0;color:#fff;font-weight:600}
.lp-foot__svc{margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.5)}
.lp-foot a{color:rgba(255,255,255,.85);text-decoration:none}
.lp-foot a:hover{color:#fff}
.lp-foot__contact,.lp-foot__nav{display:grid;gap:10px;align-content:start}
.lp-foot__h{display:block;margin-bottom:4px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.lp-foot__contact a{display:inline-flex;align-items:center;gap:10px}
.lp-foot__contact svg{color:#4D94FF}
.lp-foot__links{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,.1)}
.lp-foot__legal{margin:18px 0 0;font-size:12.5px;line-height:1.6;color:rgba(255,255,255,.45)}
/* Client work: one real, authorized example (figures from scripts/work-data.js) */
.lp-proof{display:grid;grid-template-columns:230px minmax(0,1fr);gap:clamp(20px,3vw,36px);align-items:center;margin-top:clamp(40px,5vw,64px);padding:18px;border-radius:30px;background:#0A0A0A;color:#fff}
.lp-proof img{display:block;width:100%;height:240px;object-fit:cover;object-position:top;border-radius:18px}
.lp-proof__k{display:block;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#4D94FF}
.lp-proof__t{display:block;margin-top:10px;font-size:clamp(20px,2.2vw,28px);font-weight:600;letter-spacing:-.02em;line-height:1.2}
.lp-proof__stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.lp-proof__stats span{padding:10px 16px;border-radius:14px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font-size:14px;color:rgba(255,255,255,.72)}
.lp-proof__stats b{margin-right:6px;font-size:18px;color:#fff}
.lp-proof__src{display:block;margin-top:14px;font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.5)}
/* Sticky Apply (phones) */
.lp-sticky{position:fixed;z-index:90;left:12px;right:12px;bottom:12px;display:none}
.lp-sticky .lp-btn{width:100%}
html[data-fx-landing] .mm-help__btn{bottom:84px}
/* Responsive */
@media (max-width:1100px){.lp-nav__links{display:none}.lp-inc,.lp-who,.lp-plans,.lp-mad{grid-template-columns:repeat(2,minmax(0,1fr))}.lp-steps{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:36px}.lp-steps::before{display:none}}
@media (max-width:960px){.lp-hero__grid,.lp-split,.lp-apply,.lp-faq{grid-template-columns:minmax(0,1fr)}.lp-vis{min-height:500px;max-width:560px;width:100%;margin:0 auto}.lp-final{grid-template-columns:minmax(0,1fr);margin:0 12px;border-radius:30px}.lp-doc{transform:none}}
@media (max-width:720px){
  .lp-in{padding:0 16px}
  .lp-bar{font-size:10.5px;letter-spacing:.08em}
  .lp-nav .lp-in{height:60px}.lp-nav__logo img{width:140px}
  .lp-nav .lp-btn{min-height:38px;padding:8px 16px;font-size:13.5px}
  .lp-trust{grid-template-columns:minmax(0,1fr)}.lp-trust div+div{border-left:0;border-top:1px solid #E5E7EB}.lp-trust div{padding:16px 20px}
  .lp-inc,.lp-who,.lp-plans,.lp-mad,.lp-steps,.lp-ben,.lp-ba,.lp-step{grid-template-columns:minmax(0,1fr)}
  .lp-mad li{min-height:240px}
  .lp-fee{padding:18px 20px;gap:4px 16px}.lp-fee span{padding-left:16px}
  .lp-ctas .lp-btn{width:100%}
  .lp-price{grid-template-columns:minmax(0,1fr)}
  .lp-vis{min-height:470px}
  .lp-g{left:0;right:6%}
  .lp-fc--profile{width:196px;top:auto;bottom:22%;right:-4px}
  .lp-fc--chart{display:none}
  .lp-sticky{display:block;transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .3s ease}
  .lp-sticky.is-hidden{transform:translateY(130%);opacity:0;pointer-events:none}
  .lp-foot{padding-bottom:96px}
  .lp-proof{grid-template-columns:minmax(0,1fr)}.lp-proof img{height:200px}
}
@media (prefers-reduced-motion:reduce){.lp *,.lp-bar i{animation:none!important;transition:none!important}.lp-brush path,.lp-dashes path{stroke-dashoffset:0}.lp-fc--chart .lp-line{stroke-dashoffset:0}}
`;

// ---- Markup ------------------------------------------------------------------------------
const brush = (words) => `<span class="lp-brush">${words}<svg viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12 C 60 4, 150 3, 297 9"/></svg></span>`;
const dashes = '<svg class="lp-dashes" viewBox="0 0 54 48" aria-hidden="true"><path d="M30 4 L22 18"/><path d="M38 22 L52 16"/><path d="M36 34 L50 40"/></svg>';
const pin = (fill) => `<svg viewBox="0 0 26 34"><path d="M13 33s-11-11.5-11-19.5a11 11 0 0 1 22 0C24 21.5 13 33 13 33z" fill="${fill}"/><circle cx="13" cy="13.5" r="4.5" fill="#fff"/></svg>`;

const heroVisual = `<div class="lp-vis" aria-hidden="true">
  <div class="lp-vis__blob"></div>
  <div class="lp-g">
    <div class="lp-g__brand"><span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></div>
    <div class="lp-g__search">${ic('search', 18)}<span class="lp-g__q" data-lp-type="barbershop near me|plumber near me|hvac repair near me|cleaning service near me|auto detailing near me">barbershop near me</span></div>
    <div class="lp-map">
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice"><rect width="400" height="200" fill="#EEF2F6"/><path d="M-10 150 Q 90 120 180 160 T 410 130 V 210 H -10z" fill="#D6E6FB"/><rect x="40" y="20" width="70" height="46" rx="6" fill="#DDEFD9"/><rect x="250" y="110" width="80" height="40" rx="6" fill="#DDEFD9"/><g stroke="#fff" stroke-width="9" fill="none"><path d="M-10 90 H 410"/><path d="M150 -10 V 210"/><path d="M300 -10 L 260 210"/><path d="M-10 30 L 410 70"/></g><g stroke="#F8FAFC" stroke-width="4" fill="none"><path d="M60 -10 V 210"/><path d="M-10 175 H 410"/><path d="M360 -10 V 210"/></g></svg>
      <span class="lp-pin" style="left:22%;top:40%;animation-delay:.3s">${pin('#9CA3AF')}</span>
      <span class="lp-pin" style="left:70%;top:30%;animation-delay:.45s">${pin('#9CA3AF')}</span>
      <span class="lp-pin" style="left:82%;top:72%;animation-delay:.6s">${pin('#9CA3AF')}</span>
      <span class="lp-pin lp-pin--you" style="left:48%;top:62%">${pin('#0066FF')}</span>
    </div>
    <div class="lp-res">
      <div class="lp-res__row lp-res__row--you"><span class="lp-res__ava">${ic('store', 20)}</span><span><b>Your Business</b><small>Open · Hours, services &amp; photos up to date</small></span><span class="lp-res__go"><i>${ic('pin', 14)}</i><i>${ic('globe', 14)}</i></span></div>
      <div class="lp-res__row"><span class="lp-res__ava"></span><span><span class="lp-res__bar" style="width:70%"></span><span class="lp-res__bar"></span></span><span></span></div>
    </div>
  </div>
  <div class="lp-fc lp-fc--profile" data-lp-on>
    <h4>Google Business Profile</h4><small>Optimization checklist</small>
    <ul class="lp-ticks">${['Business information', 'Categories & services', 'Photos & posts', 'Citations', 'Reviews strategy'].map((t) => `<li><i>${CHECK}</i>${esc(t)}</li>`).join('')}</ul>
  </div>
  <div class="lp-fc lp-fc--chart" data-lp-on>
    <h4>Visibility tracking</h4><small>Comparable searches, before and after</small>
    <svg viewBox="0 0 220 84"><path class="lp-base" d="M4 62 H 216"/><path class="lp-line" d="M4 66 C 40 64, 60 58, 90 52 S 150 30, 216 16"/></svg>
    <div class="lp-fc__legend"><span><i class="is-base"></i>Baseline</span><span><i></i>Follow-up</span></div>
  </div>
  <span class="lp-caption">Illustration</span>
</div>`;

const DISCLAIMER = 'Google and Google Maps are trademarks of Google LLC. MADMarketing is an independent marketing agency and is not affiliated with or endorsed by Google.';

const landing = `<!doctype html>
<html lang="en" data-fx-landing>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Free Local SEO for 30 Days: The MAD Visibility Challenge | MADMarketing</title>
<meta name="description" content="30 days of local SEO work for $0 in agency fees: Google Business Profile optimization, competitor analysis, 10 citation actions, visibility tracking and a 90-day roadmap. No credit card.">
<meta name="theme-color" content="#FFFFFF">
<link rel="canonical" href="${SITE}/free-local-seo/">
<meta property="og:type" content="website">
<meta property="og:title" content="Your Next Customer Is Searching on Google. Will They Find You? | MADMarketing">
<meta property="og:description" content="Try the MAD 30-Day Visibility Challenge: 30 days of local SEO work, $0 agency fee. No credit card, no automatic subscription.">
<meta property="og:url" content="${SITE}/free-local-seo/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The MAD 30-Day Visibility Challenge | MADMarketing">
<meta name="twitter:description" content="30 days of local SEO work. $0 agency fee. Limited trial capacity.">
<link rel="icon" type="image/svg+xml" href="/assets/madmarketing-mark-v2.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/madmarketing-icon-32-v2.png">
<link rel="apple-touch-icon" href="/assets/madmarketing-apple-touch-v2.png">
<link rel="preload" as="font" type="font/woff2" href="/fonts/satoshi-variable.woff2" crossorigin>
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>
</head>
<body>
<div class="lp-bar"><i aria-hidden="true"></i>New client offer: 30 days of local SEO work. $0 agency fee. Limited trial capacity.</div>
<header class="lp-nav">
  <div class="lp-in">
    <a class="lp-nav__logo" href="/" aria-label="MADMarketing home"><img src="/assets/madmarketing-logo-v4.svg" alt="MADMarketing" width="172" height="25"></a>
    <nav class="lp-nav__links" aria-label="On this page"><a href="#how">How It Works</a><a href="#included">What’s Included</a><a href="#why">Why MAD</a><a href="#faqs">FAQs</a></nav>
    <a class="lp-btn lp-btn--blue lp-btn--sm" href="#apply" data-lp-cta="nav">Apply Now</a>
  </div>
</header>
<main class="lp" id="top">

<section class="lp-hero">
  <div class="lp-in">
    <div class="lp-hero__grid">
      <div>
        <p class="lp-k">Local businesses deserve more visibility.</p>
        <h1 class="lp-hero__title">Your Next Customer Is Searching on Google. <em>Will They ${brush('Find You?')}</em></h1>
        <p class="lp-p">Your competitors are showing up in local searches. Your business deserves a chance to stand out, too. At MADMarketing, we help local businesses strengthen their presence on Google Search and Maps through smarter optimization, accurate listings, and data-driven strategies.</p>
        <div class="lp-fee">
          <b>$0</b><span>Agency fee<small>for 30 days</small></span>
          <p>Try our 30-Day Local Visibility Challenge. No credit card required. No automatic subscription. No obligation to continue.</p>
          ${dashes}
        </div>
        <div class="lp-ctas">
          <a class="lp-btn lp-btn--blue" href="#apply" data-lp-cta="hero">Apply for My Free 30-Day Trial ${ARROW}</a>
          <a class="lp-btn lp-btn--white" href="#included">See What’s Included ${DOWN}</a>
        </div>
        <p class="lp-note">Available to eligible businesses with an existing verified Google Business Profile. Results and rankings vary.</p>
      </div>
      ${heroVisual}
    </div>
    <div class="lp-trust">
      <div><span>${ic('shield', 24)}</span><b>No Upfront<br>Agency Fee</b></div>
      <div><span>${ic('lock', 24)}</span><b>No Credit Card<br>Required</b></div>
      <div><span>${ic('hand', 24)}</span><b>No Obligation<br>to Continue</b></div>
    </div>
  </div>
</section>

<section class="lp-sec lp-sec--soft">
  <div class="lp-in">
    <div class="lp-head">
      <p class="lp-k">The problem</p>
      <h2>Great Businesses Shouldn’t Be <em>Hard to Find.</em></h2>
      <p class="lp-p">You might provide exceptional services. You might have loyal customers. You might even have a beautiful website. But if potential customers can’t easily discover your business when searching locally, you’re missing opportunities.</p>
    </div>
    <ul class="lp-prob">${PROBLEMS.map((t) => `<li><span>${ic('alert', 20)}</span>${esc(t)}</li>`).join('')}</ul>
    <p class="lp-close">Good businesses need more than great service. <em>They need visibility.</em></p>
  </div>
</section>

<section class="lp-sec" id="included">
  <div class="lp-in">
    <div class="lp-head">
      <p class="lp-k">Introducing the MAD 30-Day Visibility Challenge</p>
      <h2>Let Us Show You What <em>Smarter Local SEO</em> Looks Like.</h2>
      <p class="lp-p">For 30 days, our team will work on the foundations of your local search presence. What’s included, absolutely free in agency fees:</p>
    </div>
    <ol class="lp-inc">${INCLUDED.map(([i, t, d]) => `<li><span class="lp-ic">${ic(i, 24)}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
    <div class="lp-price">
      <div>
        <p class="lp-price__k">Your trial price</p>
        <p class="lp-price__v"><b>$0</b> agency fee</p>
        <p>No credit card. No hidden agency fee. No automatic paid renewal.</p>
      </div>
      <a class="lp-btn lp-btn--blue" href="#apply" data-lp-cta="offer">Check If My Business Qualifies ${ARROW}</a>
    </div>
    <p class="lp-note">Directory publication and indexing are controlled by third parties. Google ranking positions, traffic increases, and new leads are not guaranteed.</p>
  </div>
</section>

<section class="lp-sec lp-sec--soft">
  <div class="lp-in lp-split">
    <div>
      <p class="lp-k">Why local SEO matters</p>
      <h2>Being Great Isn’t Enough If Customers <em>Can’t Find You.</em></h2>
      <p class="lp-p">When people need a local service, many begin by searching online. Your Google presence helps potential customers discover your business, understand your services, read customer reviews, and decide whether to contact you.</p>
      <div class="lp-ben">${BENEFITS.map(([i, t, d]) => `<div><span class="lp-ic">${ic(i, 22)}</span><span><b>${esc(t)}</b><p>${esc(d)}</p></span></div>`).join('')}</div>
      <p class="lp-close" style="font-size:clamp(18px,1.7vw,22px)">Visibility creates opportunity. <em>Smart marketing helps turn opportunity into customers.</em></p>
    </div>
    <div class="lp-ba" aria-label="The work, before and after the 30 days">
      <div class="lp-ba__card"><span class="lp-ba__tag">Before</span><ul>${['Profile fields incomplete', 'Categories and services unclear', 'Listings inconsistent', 'No baseline to measure from', 'No plan for what’s next'].map((t) => `<li><i>!</i>${esc(t)}</li>`).join('')}</ul></div>
      <div class="lp-ba__card"><span class="lp-ba__tag">After 30 days</span><ul>${['Profile reviewed and optimized', 'Categories and services aligned', 'Up to 10 listings submitted or corrected', 'Baseline and follow-up snapshots', '90-day roadmap ready'].map((t) => `<li><i>✓</i>${esc(t)}</li>`).join('')}</ul></div>
      <p class="lp-ba__note">What the 30 days cover. Rankings and results vary.</p>
    </div>
  </div>
</section>

<section class="lp-sec lp-dark" id="why">
  <div class="lp-in">
    <div class="lp-head">
      <p class="lp-k">Why MADMarketing?</p>
      <h2>Ordinary Thinking Doesn’t Build <em>Extraordinary Brands.</em></h2>
      <p class="lp-p">We don’t believe in random marketing. We believe in the MAD Method.</p>
    </div>
    <ol class="lp-mad">${MAD.map(([l, t, d]) => `<li><span class="lp-mad__l" aria-hidden="true">${l}</span><b><span>${l} —</span> ${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
    <p class="lp-tag">Think MAD. <em>Grow Beyond Ordinary.</em></p>
  </div>
</section>

<section class="lp-sec" id="how">
  <div class="lp-in lp-center">
    <div class="lp-head">
      <p class="lp-k">How the challenge works</p>
      <h2>Four Simple Steps. <em>One Smarter Start.</em></h2>
    </div>
    <ol class="lp-steps">${STEPS.map(([i, t, d], n) => `<li><span class="lp-steps__ic">${ic(i, 28)}</span><span class="lp-steps__n">STEP 0${n + 1}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
    <div class="lp-after">
      <p>If you want continued help, choose a monthly growth plan. If not, your free trial ends without an automatic charge.</p>
      <a class="lp-btn lp-btn--blue" href="#apply" data-lp-cta="how">Start My Free Application ${ARROW}</a>
    </div>
  </div>
</section>

<section class="lp-sec lp-sec--soft">
  <div class="lp-in">
    <div class="lp-head">
      <p class="lp-k">Who is this for?</p>
      <h2>Built for Ambitious <em>Local Businesses.</em></h2>
      <p class="lp-p">Whether you’re building a new customer base or strengthening an established local presence, our challenge may be a fit.</p>
    </div>
    <ul class="lp-who">${WHO.map(([i, t]) => `<li><span class="lp-ic">${ic(i, 22)}</span>${esc(t)}</li>`).join('')}</ul>
    <p class="lp-fit">${ic('badge', 22)}<span><b>Best fit:</b> an established, legitimate business with a verified Google Business Profile, a clear service area, and a desire to invest in sustainable visibility.</span></p>
  </div>
</section>

<section class="lp-sec">
  <div class="lp-in lp-split">
    <div>
      <p class="lp-k">Transparent results</p>
      <h2>No Mystery. No Empty Promises. <em>Just Work You Can See.</em></h2>
      <p class="lp-p">Throughout your challenge, we document the work completed. Your final report includes everything we did and what we recommend next.</p>
      <p class="lp-promise">We guarantee the agreed work and transparent reporting, not a specific Google ranking.</p>
    </div>
    <div class="lp-doc" data-lp-on>
      <div class="lp-doc__head"><span><b>Your 30-day visibility report</b><small>What your final report includes</small></span><span class="lp-doc__logo" aria-hidden="true"></span></div>
      <ul class="lp-ticks">${REPORT.map((t) => `<li><i>${CHECK}</i>${esc(t)}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="lp-in">
    <div class="lp-proof" data-lp-on>
      <img src="/work/the-gentry-house/google-profile.webp" width="408" height="882" alt="The Gentry House’s Google Business Profile, rated 5.0 from 201 reviews" loading="lazy" decoding="async">
      <div>
        <span class="lp-proof__k">Client work · The Gentry House, Lake Saint Louis</span>
        <span class="lp-proof__t">A barbershop whose website and Google Business Profile we run.</span>
        <span class="lp-proof__stats"><span><b>5.0★</b>on Google</span><span><b>201</b>Google reviews</span><span><b>55</b>profile photos</span></span>
        <span class="lp-proof__src">Google Maps, checked 13 October 2026. One client’s profile, shown with permission. It isn’t a promise of results.</span>
      </div>
    </div>
  </div>
</section>

<section class="lp-sec lp-sec--soft">
  <div class="lp-in">
    <div class="lp-head">
      <p class="lp-k">After the 30 days</p>
      <h2>Love the Direction? <em>Let’s Keep Growing.</em></h2>
      <p class="lp-p">Your trial is only the beginning. If you’d like our team to continue building your local visibility, we offer flexible monthly plans.</p>
    </div>
    <div class="lp-plans">${PLANS.map(([n, p, d], i) => `<div class="lp-plan${i === 1 ? ' lp-plan--mid' : ''}"><h3>${esc(n)}</h3><p class="lp-plan__price">${p}<small>/month</small></p><p>${esc(d)}</p><a class="lp-btn ${i === 1 ? 'lp-btn--blue' : 'lp-btn--white'}" href="#apply" data-lp-cta="plan">Start with the free trial</a></div>`).join('')}</div>
    <p class="lp-note">These are proposed ongoing packages. Your final recommendation will depend on your business needs, and packages and scopes are confirmed in a separate proposal. No subscription is required to complete the free trial.</p>
  </div>
</section>

<section class="lp-sec" id="apply">
  <div class="lp-in lp-apply">
    <div>
      <p class="lp-k">Apply now</p>
      <h2>Check If Your Business <em>Qualifies.</em></h2>
      <p class="lp-p">Two short steps. We review every application for eligibility and available capacity, then reply by email.</p>
      <ul class="lp-rules" aria-label="Qualification rules">${RULES.map(([r, h]) => `<li><span>${esc(r)}</span><em class="${/^Required/.test(h) ? 'is-req' : ''}">${esc(h)}</em></li>`).join('')}</ul>
    </div>
    <div class="lp-form">
      <ol class="lp-form__steps" aria-hidden="true"><li class="is-on"><small>Step 1</small>Business information</li><li><small>Step 2</small>Eligibility</li></ol>
      <p class="lp-msg" role="alert" hidden></p>
      <form id="lp-form" novalidate>
        <div class="lp-step" data-step="1">
          <label class="lp-field"><span>Full name</span><input name="fullName" autocomplete="name" required maxlength="100"></label>
          <label class="lp-field"><span>Business email</span><input name="email" type="email" autocomplete="email" required maxlength="200"></label>
          <label class="lp-field"><span>Business name</span><input name="business" autocomplete="organization" required maxlength="150"></label>
          <label class="lp-field"><span>Industry</span><input name="industry" list="lp-industries" required maxlength="100" placeholder="e.g. Barbershop, HVAC"></label>
          <datalist id="lp-industries">${['Barbershop', 'Hair salon', 'Cleaning services', 'HVAC', 'Plumbing', 'Electrical', 'Home services', 'Auto detailing', 'Automotive services', 'Fitness studio', 'Wellness'].map((v) => `<option value="${v}">`).join('')}</datalist>
          <label class="lp-field lp-field--wide"><span>Website URL <small>(optional)</small></span><input name="website" type="url" inputmode="url" placeholder="https://" maxlength="300"></label>
          <div class="lp-form__foot"><span class="lp-note" style="margin:0">Takes about two minutes.</span><button class="lp-btn lp-btn--blue" type="button" data-lp-next>Continue ${ARROW}</button></div>
        </div>
        <div class="lp-step" data-step="2" hidden>
          <label class="lp-field lp-field--wide"><span>Google Maps / Business Profile link <small>(optional)</small></span><input name="gbpLink" type="url" inputmode="url" placeholder="https://maps.google.com/…" maxlength="500"></label>
          <fieldset class="lp-field lp-field--wide" style="border:0;margin:0;padding:0"><span style="font-size:14px;font-weight:600">Is your Google Business Profile verified?</span>
            <div class="lp-radios">${['Yes', 'No', 'Unsure'].map((v) => `<label><input type="radio" name="gbpVerified" value="${v}" required><span>${v}</span></label>`).join('')}</div></fieldset>
          <label class="lp-field"><span>Phone number</span><input name="phone" type="tel" autocomplete="tel" required maxlength="40"></label>
          <label class="lp-field"><span>City</span><input name="city" autocomplete="address-level2" required maxlength="100"></label>
          <label class="lp-field"><span>State</span><input name="state" autocomplete="address-level1" required maxlength="100"></label>
          <label class="lp-field"><span>Country</span><select name="country" autocomplete="country-name" required><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Other</option></select></label>
          <label class="lp-field lp-field--wide"><span>Biggest local marketing challenge <small>(optional)</small></span><textarea name="challenge" maxlength="2000" placeholder="e.g. Competitors show up above us on Google Maps"></textarea></label>
          <label class="lp-hp" aria-hidden="true">Leave this empty <input name="company_url" tabindex="-1" autocomplete="off"></label>
          <label class="lp-check lp-field--wide"><input type="checkbox" name="authorized" value="yes" required><span>I’m the owner of this business, or authorized to make marketing decisions for it.</span></label>
          <label class="lp-check lp-field--wide"><input type="checkbox" name="consent" value="yes" required><span>I agree that MADMarketing may contact me about this application. See the <a href="/privacy/">privacy policy</a> and <a href="/trial-terms/">trial terms</a>.</span></label>
          <div class="lp-form__foot"><button class="lp-back" type="button" data-lp-back>← Back</button><button class="lp-btn lp-btn--blue" type="submit">Submit Application ${ARROW}</button></div>
        </div>
      </form>
      <div class="lp-done" hidden><span>${ic('shield', 30)}</span><h3>Application received.</h3><p>Thanks for applying for the MAD 30-Day Visibility Challenge. We’ll review your business, Google presence and eligibility, and if your business qualifies, we’ll contact you with next steps.</p></div>
    </div>
  </div>
</section>

<section class="lp-sec lp-sec--soft" id="faqs">
  <div class="lp-in lp-faq">
    <div class="lp-head">
      <p class="lp-k">FAQs</p>
      <h2>Frequently Asked <em>Questions.</em></h2>
      <p class="lp-p">Still unsure? Email <a href="mailto:${EMAIL}" style="color:#0066FF">${EMAIL}</a>.</p>
    </div>
    <div class="lp-faq__list">${FAQ.map(([q, a], i) => `<details${i ? '' : ' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
  </div>
</section>

<section class="lp-sec" style="padding-bottom:0">
  <div class="lp-final lp-dark">
    <div>
      <p class="lp-k">Ready to do something MAD?</p>
      <h2>Let’s Make Your Business <em>Easier to Find.</em></h2>
      <p class="lp-p">Stop guessing about your local search presence. Let our team show you what smarter optimization looks like.</p>
      <p class="lp-final__big">30 days. Real work. $0 agency fee.</p>
      <ul class="lp-final__checks"><li><i>${CHECK}</i>No credit card</li><li><i>${CHECK}</i>No automatic subscription</li><li><i>${CHECK}</i>Limited trial capacity</li></ul>
    </div>
    <a class="lp-btn lp-btn--blue" href="#apply" data-lp-cta="final">Check My Eligibility ${ARROW}</a>
  </div>
</section>

</main>
<footer class="lp-foot">
  <div class="lp-in">
    <div class="lp-foot__top">
      <div>
        <a class="lp-foot__logo" href="/" aria-label="MADMarketing home"><img src="/assets/madmarketing-logo-white-v4.svg" alt="MADMarketing" width="180" height="26" loading="lazy"></a>
        <p class="lp-foot__tag">Think MAD. Grow Beyond Ordinary.</p>
        <p class="lp-foot__svc">Local SEO · Google Maps · SEO · GEO · AEO · Paid Advertising · Digital Growth</p>
      </div>
      <nav class="lp-foot__nav" aria-label="MADMarketing website">
        <b class="lp-foot__h">Explore MADMarketing</b>
        <a href="/">Main website</a>
        <a href="/services/local-seo/">Local SEO</a>
        <a href="/services/google-maps-seo/">Google Maps SEO</a>
        <a href="/services/ai-search-optimization/">AI Search Optimization</a>
        <a href="/services/google-ads/">Google Ads Management</a>
        <a href="/services/">All services</a>
      </nav>
      <div class="lp-foot__contact">
        <b class="lp-foot__h">Contact</b>
        <a href="mailto:${EMAIL}">${ic('mail', 18)}${EMAIL}</a>
        <a href="/">${ic('globe', 18)}madmediamarketing.com</a>
      </div>
    </div>
    <nav class="lp-foot__links" aria-label="Legal"><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms of Service</a><a href="/trial-terms/">Trial Terms</a><a href="mailto:${EMAIL}">Contact</a></nav>
    <p class="lp-foot__legal">© MADMarketing. All rights reserved. ${DISCLAIMER}</p>
  </div>
</footer>
<div class="lp-sticky"><a class="lp-btn lp-btn--blue" href="#apply" data-lp-cta="sticky">Apply for My Free 30-Day Trial ${ARROW}</a></div>
<script>(${landingClient.toString()})(${JSON.stringify(EMAIL)});</script>
</body>
</html>
`;

// ---- The page's own behaviour (runs in the browser) ---------------------------------
function landingClient(EMAIL) {
  var d = document;
  var track = function (event, extra) {
    try {
      (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: event }, extra || {}));
      if (event === 'application_submit') {
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
        if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
      }
    } catch (e) {}
  };

  // In-page links: the site's smooth scroll if it's running, else the browser's.
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var el = id ? d.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    if (a.dataset.lpCta) track('cta_click', { cta: a.dataset.lpCta });
    var y = el.getBoundingClientRect().top + window.scrollY - (id === 'top' ? 9999 : 76);
    if (window.__fxLenis) window.__fxLenis.scrollTo(Math.max(0, y));
    else window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
  });

  // Checklists tick and the chart draws once they're on screen.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-on'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -15% 0px' });
  d.querySelectorAll('[data-lp-on]').forEach(function (el) { io.observe(el); });

  // The search box types a few local searches.
  var q = d.querySelector('[data-lp-type]');
  if (q && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var words = q.getAttribute('data-lp-type').split('|');
    var wi = 0, ci = words[0].length, del = true;
    setTimeout(function step() {
      var w = words[wi];
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; } }
      else { ci++; if (ci >= words[wi].length) { del = true; q.textContent = words[wi]; return setTimeout(step, 2200); } }
      q.textContent = words[wi].slice(0, Math.max(0, ci));
      setTimeout(step, del ? 35 : 70);
    }, 2600);
  }

  // Sticky Apply button (phones): hidden while the hero's own buttons or the
  // form are on screen.
  var sticky = d.querySelector('.lp-sticky');
  var watched = [d.querySelector('.lp-hero .lp-ctas'), d.getElementById('apply')].filter(Boolean);
  var visible = new Set();
  var so = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
    sticky.classList.toggle('is-hidden', visible.size > 0);
  });
  watched.forEach(function (el) { so.observe(el); });

  // ---- The two-step application -------------------------------------------------------
  var form = d.getElementById('lp-form');
  var box = form.closest('.lp-form');
  var msg = box.querySelector('.lp-msg');
  var done = box.querySelector('.lp-done');
  var marks = box.querySelectorAll('.lp-form__steps li');
  var steps = form.querySelectorAll('.lp-step');
  var started = false;
  var params = new URLSearchParams(location.search);
  var attribution = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) { if (params.get(k)) attribution[k] = params.get(k).slice(0, 200); });
  attribution.referrer = (d.referrer || '').slice(0, 300);

  function say(text, ok) { msg.hidden = !text; msg.className = 'lp-msg ' + (ok ? 'lp-msg--ok' : 'lp-msg--err'); msg.textContent = text || ''; }
  function valid(step) {
    var ok = true;
    step.querySelectorAll('input, select, textarea').forEach(function (el) {
      var good = el.checkValidity();
      var field = el.closest('.lp-field');
      if (field) field.classList.toggle('is-bad', !good);
      if (!good) ok = false;
    });
    return ok;
  }
  function show(n) {
    steps.forEach(function (s) { s.hidden = s.getAttribute('data-step') !== String(n); });
    marks.forEach(function (m, i) { m.classList.toggle('is-on', i < n); });
    var first = form.querySelector('[data-step="' + n + '"] input, [data-step="' + n + '"] select');
    if (first) first.focus({ preventScroll: true });
  }
  form.addEventListener('focusin', function () { if (!started) { started = true; track('application_start'); } });
  form.querySelector('[data-lp-next]').addEventListener('click', function () {
    if (!valid(steps[0])) return say('Please fill in the required fields.', false);
    say('');
    track('application_step', { step: 2 });
    show(2);
  });
  form.querySelector('[data-lp-back]').addEventListener('click', function () { say(''); show(1); });

  function mailto(data) {
    var lines = Object.keys(data).map(function (k) { return k + ': ' + data[k]; });
    location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('30-Day Visibility Challenge application: ' + (data.business || '')) + '&body=' + encodeURIComponent(lines.join('\n'));
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(steps[0])) { show(1); return say('Please fill in the required fields.', false); }
    if (!valid(steps[1])) return say('Please answer the required questions and tick both boxes.', false);
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
    if (data.company_url) return;
    delete data.company_url;
    Object.assign(data, attribution, { page: location.pathname });
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    say('');
    var finish = function () {
      form.hidden = true;
      box.querySelector('.lp-form__steps').hidden = true;
      done.hidden = false;
      track('application_submit', { gbp_verified: data.gbpVerified, country: data.country });
    };
    fetch('/api/free-local-seo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.status === 200 && res.body.ok) return finish();
        if (res.body && res.body.error) { say(res.body.error, false); btn.disabled = false; return; }
        throw new Error('unavailable');
      })
      .catch(function () {
        // The form service isn't connected yet: send it by email instead.
        say('Opening your email app to send your application. If nothing opens, email ' + EMAIL + '.', true);
        btn.disabled = false;
        mailto(data);
      });
  });
}

// ---- Trial terms (from the terms the brief states) ---------------------------------------
const TERMS = [
  ['The offer', ['The MAD 30-Day Visibility Challenge (the “trial”) is a defined 30-day scope of local SEO work that MADMarketing provides to accepted businesses for $0 in agency fees.', 'The trial includes: a Google Business Profile audit and optimization; local SEO and competitor analysis; up to 10 local citation actions (submissions or corrections); baseline and follow-up local search visibility snapshots using comparable searches, locations and reporting methods; review growth recommendations; and a personalized 90-day growth roadmap.']],
  ['Price and payment', ['There is no agency fee for the trial and no credit card is required. The trial does not renew automatically into a paid plan.', 'Any optional third-party paid tools or services must be approved by you in advance and are paid for separately by your business.']],
  ['Eligibility and acceptance', ['The trial is available to legitimate local storefront or service-area businesses in markets we support, applying through an owner or authorized decision-maker.', 'An existing verified Google Business Profile is required before the trial is activated, and manager access to it is required before work begins. A website is preferred but not required. Suspended profiles are reviewed individually.', 'Every application is reviewed for business legitimacy, profile status, location, eligibility, scope and team capacity. Admission is subject to available slots, and we may decline any application. One trial per business or location.']],
  ['Access and ownership', ['If you’re accepted, you grant MADMarketing appropriate manager access to your Google Business Profile. You keep ownership of your profile and can remove our access at any time. Never share your Google password with us or anyone else.']],
  ['No guarantees', ['We guarantee the agreed work and transparent reporting, not a specific outcome. Google ranking positions, traffic increases and new leads are not guaranteed. Results vary by market, competition, relevance and other factors, and may take weeks or months.', 'Directory publication and indexing are controlled by third parties, so we can’t guarantee that a submitted or corrected listing will be accepted, published or indexed.']],
  ['Ethical practices', ['We follow legitimate review practices. We do not create fake reviews or manipulated engagement.']],
  ['Timeline and what happens next', ['The trial runs for 30 days from activation. At the end you receive a report covering the work completed, citation activity, visibility observations and recommended next steps, together with an optional proposal.', 'Continuing is your choice. If you don’t subscribe to an ongoing plan, the trial simply ends, without any automatic charge. Ongoing packages and scopes are confirmed in a separate proposal.']],
  ['Your information', ['We use the details in your application to review it and to contact you about it. See our privacy policy for how we handle personal information.']],
];
const terms = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trial Terms: MAD 30-Day Visibility Challenge | MADMarketing</title>
<meta name="description" content="The terms of the MAD 30-Day Visibility Challenge: what’s included, eligibility, access, no-guarantee terms and what happens after the 30 days.">
<meta name="theme-color" content="#F5F7FA">
<link rel="canonical" href="${SITE}/trial-terms/">
<link rel="icon" type="image/svg+xml" href="/assets/madmarketing-mark-v2.svg">
<link rel="preload" as="font" type="font/woff2" href="/fonts/satoshi-variable.woff2" crossorigin>
<style>
@font-face{font-family:Satoshi;font-style:normal;font-weight:300 900;font-display:swap;src:url(/fonts/satoshi-variable.woff2) format("woff2")}
body{margin:0;background:#F5F7FA;color:#0A0A0A;font-family:Satoshi,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.tt-in{max-width:820px;margin:0 auto;padding:150px 24px 110px}
.tt .tt-k{display:inline-flex;align-items:center;gap:14px;margin:0;font-size:12px!important;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#4B5563}
.tt .tt-k::before{content:'';width:34px;height:1.5px;background:linear-gradient(90deg,rgba(0,102,255,0),#0066FF)}
.tt h1{margin:20px 0 0;font-size:clamp(36px,5vw,60px);font-weight:700;line-height:1.04;letter-spacing:-.031em}
.tt h1 em{font-style:normal;color:#0066FF}
.tt-meta{margin:14px 0 0;font-size:14px;color:#6B7280}
.tt-in>h2{margin:44px 0 0;font-size:22px;font-weight:700;letter-spacing:-.02em}
.tt-in>p{margin:12px 0 0;font-size:16.5px;line-height:1.7;color:#1F2937}
.tt-in>p a{color:#0066FF}
.tt-cta{margin-top:48px;padding:28px;border-radius:24px;background:#fff;box-shadow:0 0 0 1px #E5E7EB}
.tt-cta a.btn{display:inline-flex;margin-top:14px;padding:14px 24px;border-radius:999px;background:#0066FF;color:#fff;font-weight:600;text-decoration:none}
@media(max-width:720px){.tt-in{padding:120px 16px 80px}}
</style>
</head>
<body>
<main class="tt"><div class="tt-in">
  <p class="tt-k">Trial terms</p>
  <h1>The MAD 30-Day <em>Visibility Challenge.</em></h1>
  <p class="tt-meta">Last updated October 13, 2026</p>
${TERMS.map(([h, ps]) => `  <h2>${esc(h)}</h2>\n${ps.map((p) => `  <p>${esc(p)}</p>`).join('\n')}`).join('\n')}
  <h2>Contact</h2>
  <p>Questions about these terms? Email <a href="mailto:${EMAIL}">${EMAIL}</a>, or write to MADMarketing, 2055 Craigshire Dr, St. Louis, MO 63146, United States.</p>
  <p>${DISCLAIMER}</p>
  <div class="tt-cta"><p style="margin:0"><b>Ready to apply?</b> It takes about two minutes.</p><a class="btn" href="/free-local-seo/#apply">Apply for the free trial</a></div>
</div></main>
</body>
</html>
`;

for (const [slug, html] of [['free-local-seo', landing], ['trial-terms', terms]]) {
  fs.mkdirSync(path.join(ROOT, slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, slug, 'index.html'), html);
}
console.log('landing: /free-local-seo/ /trial-terms/');

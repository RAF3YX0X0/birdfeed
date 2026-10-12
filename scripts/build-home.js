// Builds the homepage's "What we do" (fx/partials/home-services.html): every
// service by category with its starting price and a link to its page
// (scripts/pricing-data.json). scripts/inject-fx.js places it on the
// homepage. Styles in fx/home.css, motion in fx/home.js.
//
//   node scripts/build-home.js
const fs = require('fs');
const path = require('path');
const B = require('./render-blocks.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'fx', 'partials');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing-data.json'), 'utf8'));
const ICONS = { ...JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing-icons.json'), 'utf8')), sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>' };
const esc = B.esc;
const icon = (n, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.check}</svg>`;
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const num = (p) => parseInt(String(p).replace(/[^0-9]/g, ''), 10) || 0;

const PAGES = {
  'Social Media Posts': '/social-media-management/', 'Short-Form Videos': '/short-form-video/', 'Instagram Growth': '/instagram-growth/',
  'Meta Ads Management': '/meta-ads-management/', 'Google Ads Management': '/google-ads-management/', 'UGC Videos': '/ugc-videos/',
  'SEO Blog Posts': '/seo-blog-posts/', 'SEO Backlinks': '/seo-backlinks/', 'Managed SEO': '/managed-seo/',
  'Email Marketing': '/email-design/', 'Landing Pages': '/landing-pages/', 'Conversion Tracking': '/conversion-tracking/',
};
// Category names as the homepage shows them, and what each one is for.
const CATS = {
  'Social Media Management': ['Social media', 'Show up every day, without lifting a finger.'],
  'Paid Ads': ['Paid ads', 'Turn budget into customers, at a flat monthly rate.'],
  SEO: ['SEO', 'Get found on Google by people already searching.'],
  Other: ['Web & email', 'Turn the attention you earn into sales.'],
};
const byName = Object.fromEntries(DATA.services.map((s) => [s.name, s]));
const startPrice = (s) => num(s.tiers ? s.tiers[0][1] : s.flat);

// ---- What we do ------------------------------------------------------------------
// The client's own words (homepage copy, 2026-10): six services, local SEO
// first, each linking to its page (scripts/build-seo-pages.js builds the
// /services/ ones).
const SERVICES = [
  ['pin', 'Local SEO', 'Improve how your business appears across local searches, business listings, and Google Maps.', '/services/local-seo/'],
  ['map', 'Google Maps SEO', 'Strengthen the accuracy, relevance, and completeness of your Google Business Profile.', '/services/google-maps-seo/'],
  ['search', 'Search Engine Optimization', 'Make your website easier to discover, understand, and use.', '/managed-seo/'],
  ['sparkle', 'AI Search Visibility', 'Structure useful content so customers and AI-powered search experiences can understand your expertise.', '/services/ai-search-optimization/'],
  ['target', 'Paid Advertising', 'Reach high-intent audiences with Google and Meta campaigns built around measurable outcomes.', '/services/google-ads/'],
  ['cursor', 'Websites & Conversion', 'Turn visits into calls, inquiries, appointments, and sales.', '/landing-pages/'],
];
const GLYPH = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  cursor: '<path d="m4 4 7 17 2.5-7.5L21 11z"/>',
};
const glyph = (n, size) =>
  GLYPH[n]
    ? `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[n]}</svg>`
    : icon(n, size);

function services() {
  const cards = SERVICES.map(([ic, name, line, href], i) => `<article class="hm-cat hm-cat--svc${i === 0 ? ' is-lead' : ''}" data-ind-item>
      <header class="hm-cat__head"><span class="hm-cat__icon">${glyph(ic, 22)}</span>${i === 0 ? '<span class="hm-cat__from">Flagship</span>' : ''}</header>
      <h3 class="hm-cat__title">${esc(name)}</h3>
      <p class="hm-cat__line">${esc(line)}</p>
      <a class="hm-cat__more" href="${href}">Learn more ${ARROW}</a>
    </article>`).join('\n');
  return `<section class="nx nx--light hm-svc" id="services" data-fx-skip>
  <div class="nx__in">
    <header class="nx__head"><span class="nx__eyebrow">What we do</span><h2 class="nx__title">Start where customers <em>are looking.</em></h2></header>
    <div class="hm-svc__grid hm-svc__grid--six">${cards}</div>
    <div class="hm-svc__foot"><a class="hx-btn hx-btn--blue" href="/all-services/">View All Digital Marketing Services</a><a class="hx-btn hx-btn--white" href="#build">Build your plan</a></div>
  </div>
</section>`;
}

fs.writeFileSync(path.join(OUT, 'home-services.html'), services() + '\n');
console.log(`home: what we do, ${SERVICES.length} services`);

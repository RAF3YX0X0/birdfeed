// Builds the homepage's own sections that come from the site's data:
//   - fx/partials/home-services.html: "What we do", every service by category
//     with its starting price and a link to its page (scripts/pricing-data.json),
//   - fx/partials/home-industries.html: "Built for your industry", one card per
//     industry page with a real post made for that industry
//     (scripts/industry-content.js, fx/portfolio-data.js).
// scripts/inject-fx.js places them on the homepage. Styles in fx/home.css,
// motion in fx/home.js.
//
//   node scripts/build-home.js
const fs = require('fs');
const path = require('path');
const B = require('./render-blocks.js');
const CONTENT = require('./industry-content.js');

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
function services() {
  const cards = DATA.cats.map((c, i) => {
    const items = c.items.map((n) => byName[n]).filter(Boolean);
    const from = Math.min(...items.map(startPrice));
    const [label, line] = CATS[c.label] || [c.label, ''];
    return `<article class="hm-cat${i === 0 ? ' is-lead' : ''}" data-ind-item>
      <header class="hm-cat__head"><span class="hm-cat__icon">${icon(c.icon, 22)}</span><span class="hm-cat__from">from <b>$${from}</b>/mo</span></header>
      <h3 class="hm-cat__title">${esc(label)}</h3>
      <p class="hm-cat__line">${esc(line)}</p>
      <ul class="hm-cat__list">${items.map((s) => `<li><a href="${PAGES[s.name] || '/all-services/'}"><span class="hm-cat__ic">${icon(s.icon, 16)}</span><span class="hm-cat__name"><b>${esc(s.name)}</b><small>${esc(s.hl ? s.hl[1] : s.tag)}</small></span><em>$${startPrice(s).toLocaleString('en-US')}</em><i>${ARROW}</i></a></li>`).join('')}</ul>
    </article>`;
  }).join('\n');
  return `<section class="nx nx--light hm-svc" id="services" data-fx-skip>
  <div class="nx__in">
    <header class="nx__head"><span class="nx__eyebrow">What we do</span><h2 class="nx__title">Pick only what <em>you need.</em></h2><p class="nx__lede">Twelve services, each priced on its own and run by people who do only that. Start with one, then add or drop services any month.</p></header>
    <div class="hm-svc__grid">${cards}</div>
    <div class="hm-svc__foot"><a class="hx-btn hx-btn--blue" href="#build">Build your plan</a><a class="hx-btn hx-btn--white" href="/all-services/">See all services</a></div>
  </div>
</section>`;
}

// ---- Built for your industry ----------------------------------------------------------
const LABELS = {
  restaurants: ['Restaurants', 'More diners at your tables'],
  dentists: ['Dental practices', 'More patients in your chairs'],
  gyms: ['Gyms & studios', 'More members in your classes'],
  'law-firms': ['Law firms', 'More clients on your calendar'],
  medical: ['Medical practices', 'More patients in your appointment book'],
  'real-estate': ['Real estate', 'More buyers and sellers in your pipeline'],
  salons: ['Salons & spas', 'More clients in your chairs'],
  'car-dealerships': ['Car dealerships', 'More buyers on your lot'],
  coaches: ['Coaches & consultants', 'More clients on your calendar'],
  ecommerce: ['E-commerce', 'More customers at your checkout'],
};
function industries(PORTFOLIO) {
  const used = new Set();
  const cards = Object.entries(CONTENT).map(([slug, d]) => {
    const key = slug.replace('social-media-management-for-', '');
    const [label, line] = LABELS[key] || [d.name, ''];
    const post = PORTFOLIO.posts
      .filter((x) => x.ind === d.work.ind && (!d.work.subs || !d.work.subs.length || d.work.subs.includes(x.sub)))
      .filter((x) => { const id = x.img.split('/').pop().replace(/\.\w+$/, ''); return (!d.work.only || d.work.only.includes(id)) && (!d.work.not || !d.work.not.includes(id)); })
      .sort((a, z) => (z.f || 0) - (a.f || 0))
      .find((x) => !used.has(x.img));
    if (post) used.add(post.img);
    return `<a class="hm-ind__card" href="/${slug}/" data-ind-item>${post ? `<img src="${esc(post.img)}" alt="" loading="lazy" decoding="async">` : ''}<span class="hm-ind__shade"></span><span class="hm-ind__txt"><b>${esc(label)}</b><small>${esc(line)}</small></span><i class="hm-ind__go">${ARROW}</i></a>`;
  }).join('\n');
  return `<section class="nx nx--light hm-ind" id="industries" data-fx-skip>
  <div class="nx__in">
    <header class="nx__head"><span class="nx__eyebrow">Who we work with</span><h2 class="nx__title">Built for <em>your industry.</em></h2><p class="nx__lede">Posts, offers and timing planned around how your customers actually buy. Pick yours to see what that looks like.</p></header>
    <div class="hm-ind__floor"><div class="hm-ind__grid">${cards}</div></div>
    <p class="hm-ind__foot">Not on the list? We make content for all kinds of businesses. <a href="/examples/">See every example ${ARROW}</a></p>
  </div>
</section>`;
}

(async () => {
  const { PORTFOLIO } = await import(require('url').pathToFileURL(path.join(ROOT, 'fx', 'portfolio-data.js')).href);
  fs.writeFileSync(path.join(OUT, 'home-services.html'), services() + '\n');
  fs.writeFileSync(path.join(OUT, 'home-industries.html'), industries(PORTFOLIO) + '\n');
  console.log(`home: ${DATA.services.length} services in ${DATA.cats.length} categories, ${Object.keys(CONTENT).length} industries`);
})();

// The homepage's sections about what we sell, from scripts/offer-data.js:
//   - fx/partials/home-services.html: "What we do", the client's six
//     services (homepage copy, 2026-10), each linking to its page;
//   - fx/partials/home-pricing-head.html: the plans (where the cloned
//     site's plan builder was), with the custom plan under them;
//   - the "real cost" section's own column in fx/partials/home-bottom.html.
// scripts/inject-fx.js places them on the homepage. Styles in fx/home.css,
// fx/bottom.css and fx/packages.css (scripts/build-service-pages.js).
//
//   node scripts/build-home.js
const fs = require('fs');
const path = require('path');
const O = require('./offer-data');
const R = require('./offer-render');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'fx', 'partials');
const esc = R.esc;
const ARROW = R.ARROW;

// ---- What we do ------------------------------------------------------------------
// The client's own words: six services, local SEO first.
const SERVICES = [
  ['pin', 'Local SEO', 'Improve how your business appears across local searches, business listings, and Google Maps.', '/services/local-seo/'],
  ['map', 'Google Maps SEO', 'Strengthen the accuracy, relevance, and completeness of your Google Business Profile.', '/services/google-maps-seo/'],
  ['search', 'Search Engine Optimization', 'Make your website easier to discover, understand, and use.', '/services/seo/'],
  ['sparkle', 'AI Search Visibility', 'Structure useful content so customers and AI-powered search experiences can understand your expertise.', '/services/ai-search-optimization/'],
  ['target', 'Paid Advertising', 'Reach high-intent audiences with Google and Meta campaigns built around measurable outcomes.', '/services/google-ads/'],
  ['cursor', 'Websites & Conversion', 'Turn visits into calls, inquiries, appointments, and sales.', '/services/web-design/'],
];
const GLYPH = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  cursor: '<path d="m4 4 7 17 2.5-7.5L21 11z"/>',
};
const glyph = (n, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[n]}</svg>`;

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
    <div class="hm-svc__foot"><a class="hx-btn hx-btn--blue" href="/services/">View All Digital Marketing Services</a><a class="hx-btn hx-btn--white" href="#plans">See plans and pricing</a></div>
  </div>
</section>`;
}
fs.writeFileSync(path.join(OUT, 'home-services.html'), services() + '\n');

// ---- Plans -------------------------------------------------------------------------
// The heading is the client's homepage copy. (A div, as before: the page's
// CSS finds the island after it as its sibling.)
const plans = `<div class="prh" id="plans" data-fx-skip>
  <div class="sx-head">
    <span class="sx-eyebrow"><i></i>Plans and pricing</span>
    <h2 class="sx-title">One partner.<br> <em>Multiple ways to grow.</em></h2>
    <p class="sx-sub">When your search foundations are strong, our team can support the next chapter: paid search, social advertising, creative content, landing pages, automation, and ongoing SEO. Start with the service you need and expand when it makes business sense.</p>
  </div>
  <div class="prh__body">
    ${R.plans({ cta: (p) => ['/pricing/', `See what’s in ${p.name}`] }).replace(/\n/g, '\n    ')}
    ${R.fullGrowth().replace(/\n/g, '\n    ')}
    <p class="prh__note">Launch pricing, in US dollars. Each plan starts with a written agreement, and eligible local businesses can start with the free 30-day challenge. <a href="/pricing/">Full pricing ${ARROW}</a></p>
  </div>
</div>`;
fs.writeFileSync(path.join(OUT, 'home-pricing-head.html'), plans + '\n');

// ---- The real cost: our own column ------------------------------------------------------
const bottomFile = path.join(OUT, 'home-bottom.html');
let bottom = fs.readFileSync(bottomFile, 'utf8');
const swap = (re, to) => { if (!re.test(bottom)) throw new Error('home-bottom.html: no match for ' + re); bottom = bottom.replace(re, to); };
swap(/(<section class="cx"[\s\S]*?<p class="sx-sub">)[\s\S]*?(<\/p>)/, '$1What you’d really pay to get your marketing handled, everywhere else.$2');
swap(/<p class="cx-us__price">[\s\S]*?<\/p>/, `<p class="cx-us__price"><b>MADMarketing</b> <em>from ${O.money(O.FROM)}</em><small>/mo</small></p>`);
swap(/<p class="cx-us__text">[\s\S]*?<\/p>/, `<p class="cx-us__text">Local SEO plans from <b>${O.money(O.FROM)} a month</b>, and one partner for search, paid ads, social, web and automation when you want more.</p>`);
swap(/<ul class="cx-us__chips">[\s\S]*?<\/ul>/, `<ul class="cx-us__chips">
        <li>Start free for 30 days, if you’re eligible</li>
        <li>A written agreement before you pay</li>
        <li>Your accounts stay yours</li>
        <li>Clear monthly reporting</li>
      </ul>`);
fs.writeFileSync(bottomFile, bottom);

console.log(`home: what we do (${SERVICES.length} services), plans (${O.PLANS.length} + custom), the real cost`);

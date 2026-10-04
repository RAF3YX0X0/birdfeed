// Builds the homepage's shop (fx/partials/home-shop.html): every service as a
// product, with its own product shot, starting price, the typical agency
// price as the "compare at" price, and an Add to plan button; filtered by
// industry, service, price and billing, and sorted.
//   - Services, prices, options and agency figures: scripts/pricing-data.json.
//   - Industries: scripts/industry-content.js. Picking one shows a banner
//     linking to its page and swaps the visual products to real work made for
//     that industry (fx/portfolio-data.js).
// scripts/inject-fx.js places it on the homepage. Styles in fx/shop.css,
// behaviour in fx/shop.js.
//
//   node scripts/build-home.js
const fs = require('fs');
const path = require('path');
const B = require('./render-blocks.js');
const CONTENT = require('./industry-content.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'fx', 'partials');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing-data.json'), 'utf8'));
const esc = B.esc;
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const num = (p) => parseInt(String(p).replace(/[^0-9]/g, ''), 10) || 0;
const money = (n) => `$${n.toLocaleString('en-US')}`;

const PAGES = {
  'Social Media Posts': '/social-media-management/', 'Short-Form Videos': '/short-form-video/', 'Instagram Growth': '/instagram-growth/',
  'Meta Ads Management': '/meta-ads-management/', 'Google Ads Management': '/google-ads-management/', 'UGC Videos': '/ugc-videos/',
  'SEO Blog Posts': '/seo-blog-posts/', 'SEO Backlinks': '/seo-backlinks/', 'Managed SEO': '/managed-seo/',
  'Email Marketing': '/email-design/', 'Landing Pages': '/landing-pages/', 'Conversion Tracking': '/conversion-tracking/',
};
// The pricing data's categories, as the shop names them (and their filter keys).
const CATS = { 'Social Media Management': ['social', 'Social media'], 'Paid Ads': ['ads', 'Paid ads'], SEO: ['seo', 'SEO'], Other: ['web', 'Web & email'] };
const PRICES = [['lt150', 'Under $150', (p) => p < 150], ['150-499', '$150 to $499', (p) => p >= 150 && p < 500], ['500', '$500 and up', (p) => p >= 500]];
const startPrice = (s) => num(s.tiers ? s.tiers[0][1] : s.flat);
const catOf = (s) => (DATA.cats.find((c) => c.items.includes(s.name)) || { label: 'Other' }).label;

const LABELS = {
  restaurants: ['Restaurants', 'More diners at your tables', 'best brunch near me'],
  dentists: ['Dental practices', 'More patients in your chairs', 'teeth whitening near me'],
  gyms: ['Gyms & studios', 'More members in your classes', 'gym near me'],
  'law-firms': ['Law firms', 'More clients on your calendar', 'personal injury lawyer'],
  medical: ['Medical practices', 'More patients in your appointment book', 'urgent care near me'],
  'real-estate': ['Real estate', 'More buyers and sellers in your pipeline', 'homes for sale near me'],
  salons: ['Salons & spas', 'More clients in your chairs', 'hair salon near me'],
  'car-dealerships': ['Car dealerships', 'More buyers on your lot', 'used cars near me'],
  coaches: ['Coaches & consultants', 'More clients on your calendar', 'business coach'],
  ecommerce: ['E-commerce', 'More customers at your checkout', 'linen summer dress'],
};
const DEFAULT_QUERY = 'coffee shop near me';

// ---- Product shots ---------------------------------------------------------------------
// Each service gets its own small scene. Visual services show real work;
// the others are drawn (search ad, article, links, rankings, page, events).
// `data-shot` names the parts fx/shop.js swaps when an industry is picked.
const bars = (n, cls = '') => Array.from({ length: n }, (_, i) => `<i class="${cls}" style="--w:${[92, 78, 86, 64, 72][i % 5]}%"></i>`).join('');
function shot(s, def) {
  switch (s.name) {
    case 'Social Media Posts':
      return `<div class="ps ps--fan">${def.posts.map((src, i) => `<img data-shot="post${i}" src="${src}" alt="" loading="lazy" decoding="async">`).join('')}</div>`;
    case 'Short-Form Videos':
      return `<div class="ps ps--phone"><div class="ps-phone"><img data-shot="video" src="${def.video}" alt="" loading="lazy" decoding="async"><span class="ps-play">${PLAY}</span><span class="ps-phone__ui"><b>@yourbrand</b><i></i></span></div></div>`;
    case 'Instagram Growth':
      return `<div class="ps ps--growth"><div class="ps-profile"><img data-shot="avatar" src="${def.avatar}" alt="" loading="lazy" decoding="async"><b>@yourbrand</b><span class="ps-profile__btn">Follow</span></div><div class="ps-growth"><svg viewBox="0 0 200 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 62 C40 60 60 52 90 44 S150 22 200 6" fill="none" stroke="#0029FF" stroke-width="3" stroke-linecap="round"/><path d="M0 62 C40 60 60 52 90 44 S150 22 200 6 V70 H0Z" fill="url(#psg)"/><defs><linearGradient id="psg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0029FF" stop-opacity=".22"/><stop offset="1" stop-color="#0029FF" stop-opacity="0"/></linearGradient></defs></svg><span class="ps-chip">${esc(s.hl ? s.hl[0] : '')} new followers / mo</span></div></div>`;
    case 'Meta Ads Management':
      return `<div class="ps ps--ad"><div class="ps-ad"><span class="ps-ad__head"><i></i><b>yourbrand</b><small>Sponsored</small></span><img data-shot="ad" src="${def.ad}" alt="" loading="lazy" decoding="async"><span class="ps-ad__cta">Learn more ${ARROW}</span></div></div>`;
    case 'Google Ads Management':
      return `<div class="ps ps--search"><div class="ps-search"><span class="ps-search__q"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span data-shot="query">${esc(DEFAULT_QUERY)}</span></span><span class="ps-search__ad"><small>Sponsored</small><b>yourbrand.com</b><em>Book today. Rated by real customers.</em>${bars(2)}</span><span class="ps-search__org">${bars(2)}</span></div></div>`;
    case 'UGC Videos':
      return `<div class="ps ps--ugc">${def.ugc.map((src) => `<div class="ps-ugc"><img src="${src}" alt="" loading="lazy" decoding="async"><span class="ps-play">${PLAY}</span></div>`).join('')}</div>`;
    case 'SEO Blog Posts':
      return `<div class="ps ps--doc"><div class="ps-doc"><span class="ps-doc__tag">Blog</span><b class="ps-doc__h"></b><b class="ps-doc__h ps-doc__h--2"></b>${bars(5)}<span class="ps-chip">${esc(s.hl ? s.hl[0] : '')}</span></div></div>`;
    case 'SEO Backlinks':
      return `<div class="ps ps--links"><div class="ps-links">${[0, 1, 2].map((i) => `<span class="ps-link"><i class="ps-link__fav" style="--h:${[222, 260, 200][i]}"></i>${bars(1)}<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>`).join('')}<span class="ps-chip">${esc(s.hl ? s.hl[0] : '')}</span></div></div>`;
    case 'Managed SEO':
      return `<div class="ps ps--rank"><div class="ps-rank"><svg viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 80 L30 74 L60 76 L90 58 L120 50 L150 30 L200 10" fill="none" stroke="#0029FF" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><g fill="#0029FF"><circle cx="90" cy="58" r="4"/><circle cx="150" cy="30" r="4"/><circle cx="200" cy="10" r="5"/></g></svg><span class="ps-chip">Content · links · technical</span></div></div>`;
    case 'Email Marketing':
      return `<div class="ps ps--mail"><div class="ps-mail"><span class="ps-mail__bar"><i></i><i></i><i></i></span><img src="${def.email}" alt="" loading="lazy" decoding="async"></div></div>`;
    case 'Landing Pages':
      return `<div class="ps ps--page"><div class="ps-page"><span class="ps-mail__bar"><i></i><i></i><i></i></span><b class="ps-page__h"></b><b class="ps-page__h ps-page__h--2"></b><span class="ps-page__btn">Get started</span><span class="ps-page__grid"><i></i><i></i><i></i></span></div></div>`;
    case 'Conversion Tracking':
      return `<div class="ps ps--track"><div class="ps-track">${['Page view', 'Lead', 'Purchase'].map((t, i) => `<span class="ps-ev" style="--w:${[100, 62, 34][i]}%"><b>${t}</b><i></i><em>${CHECK}</em></span>`).join('')}<span class="ps-chip">${esc(s.hl ? s.hl[0] : '')}</span></div></div>`;
    default:
      return '<div class="ps"></div>';
  }
}

function product(s, i, def) {
  const [cat, catLabel] = CATS[catOf(s)] || ['web', 'Web & email'];
  const p = startPrice(s);
  const unit = s.oneTime ? 'once' : '/mo';
  const opts = s.tiers && s.tiers.length > 1 ? s.tiers.map(([l]) => l.replace(/\s.*$/, '')).join(' · ') + ' ' + s.tiers[s.tiers.length - 1][0].replace(/^\S+\s/, '') : '';
  const priceKey = (PRICES.find(([, , f]) => f(p)) || PRICES[0])[0];
  const badge = i === 0 ? '<span class="sp__badge">Most popular</span>' : s.oneTime ? '<span class="sp__badge sp__badge--soft">One-time</span>' : '';
  return `<article class="sp" data-name="${esc(s.name)}" data-cat="${cat}" data-price="${p}" data-pr="${priceKey}" data-bill="${s.oneTime ? 'once' : 'monthly'}" data-order="${i}">
      <a class="sp__media" href="${PAGES[s.name] || '/all-services/'}" tabindex="-1" aria-hidden="true">${shot(s, def)}${badge}</a>
      <div class="sp__body">
        <span class="sp__cat">${esc(catLabel)}</span>
        <h3 class="sp__name"><a href="${PAGES[s.name] || '/all-services/'}">${esc(s.name)}</a></h3>
        <p class="sp__line">${esc(s.tag)}</p>
        ${opts ? `<p class="sp__opts">${esc(opts)}</p>` : ''}
        <div class="sp__buy">
          <p class="sp__price"><span>${s.tiers && s.tiers.length > 1 ? 'from ' : ''}</span><b>${money(p)}</b><small>${unit}</small>${s.agency ? `<s title="What a typical agency charges">${money(s.agency)}</s>` : ''}</p>
          <button class="sp__add" type="button" data-plan-add="${esc(s.name)}"><span class="sp__add-t">Add to plan</span><span class="sp__add-on">${CHECK} Added</span></button>
        </div>
      </div>
    </article>`;
}

function shop(PORTFOLIO) {
  const posts = (d) => PORTFOLIO.posts
    .filter((x) => x.ind === d.work.ind && (!d.work.subs || !d.work.subs.length || d.work.subs.includes(x.sub)))
    .filter((x) => { const id = x.img.split('/').pop().replace(/\.\w+$/, ''); return (!d.work.only || d.work.only.includes(id)) && (!d.work.not || !d.work.not.includes(id)); })
    .sort((a, z) => (z.f || 0) - (a.f || 0));
  // Default shots, and each industry's swaps.
  const featured = PORTFOLIO.posts.filter((x) => x.f).map((x) => x.img);
  const def = {
    posts: [featured[0], featured[1], featured[2]].filter(Boolean),
    ad: featured[3] || featured[0], avatar: featured[4] || featured[0],
    video: '/fx/media/card-1.webp', email: '/assets/work/email-glow.webp',
    ugc: PORTFOLIO.ugc.slice(0, 2).map((u) => u.poster),
  };
  const inds = Object.entries(CONTENT).map(([slug, d]) => {
    const key = slug.replace('social-media-management-for-', '');
    const [label, line, query] = LABELS[key] || [d.name, '', DEFAULT_QUERY];
    const list = posts(d).map((x) => x.img);
    const vid = PORTFOLIO.videos.find((v) => v.ind === d.work.ind && (!d.work.subs || !d.work.subs.length));
    return { key, slug, label, line, query, img: list[0], swap: { post0: list[0], post1: list[1], post2: list[2], ad: list[3] || list[0], avatar: list[4] || list[1], video: vid ? vid.poster : null, query } };
  });
  const count = (f) => DATA.services.filter(f).length;
  const group = (title, key, items, type = 'checkbox') => `<fieldset class="sf"><legend>${title}</legend>${items.map(([v, l, n, extra = '']) => `<label class="sf__opt"><input type="${type}" name="sf-${key}" value="${v}"${type === 'radio' && v === 'all' ? ' checked' : ''}><span class="sf__box"></span>${extra}<span class="sf__l">${esc(l)}</span>${n != null ? `<span class="sf__n">${n}</span>` : ''}</label>`).join('')}</fieldset>`;
  const sidebar = [
    group('Industry', 'ind', [['all', 'All industries', null], ...inds.map((d) => [d.key, d.label, null, d.img ? `<img class="sf__img" src="${d.img}" alt="" loading="lazy" decoding="async">` : ''])], 'radio'),
    group('Service', 'cat', DATA.cats.map((c) => { const [k, l] = CATS[c.label]; return [k, l, c.items.length]; })),
    group('Price', 'pr', PRICES.map(([k, l, f]) => [k, l, count((s) => f(startPrice(s)))])),
    group('Billing', 'bill', [['monthly', 'Monthly', count((s) => !s.oneTime)], ['once', 'One-time', count((s) => s.oneTime)]]),
  ].join('');
  const data = Object.fromEntries(inds.map((d) => [d.key, { label: d.label, line: d.line, href: `/${d.slug}/`, img: d.img, swap: d.swap }]));
  data.all = { swap: { post0: def.posts[0], post1: def.posts[1], post2: def.posts[2], ad: def.ad, avatar: def.avatar, video: def.video, query: DEFAULT_QUERY } };
  return `<section class="nx nx--light hm-shop" id="shop" data-fx-skip>
  <div class="nx__in">
    <header class="hm-shop__head"><div><span class="nx__eyebrow">The shop</span><h2 class="nx__title">Shop by what <em>you need.</em></h2></div><p class="nx__lede">Every service, priced up front. Filter by your industry or what you want to grow, then add what fits to your plan.</p></header>
    <div class="hm-shop__in">
      <aside class="hm-shop__side" aria-label="Filters"><div class="hm-shop__side-in" data-lenis-prevent>${sidebar}<button class="sf__clear" type="button" hidden>Clear all filters</button></div></aside>
      <div class="hm-shop__main">
        <div class="hm-shop__bar"><p class="hm-shop__count" aria-live="polite"><b>${DATA.services.length}</b> services</p><div class="hm-shop__chips"></div><label class="hm-shop__sort"><span>Sort</span><select><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
        <div class="hm-shop__for" hidden><img alt="" loading="lazy" decoding="async"><div><span>Built for</span><b></b><small></small></div><a href="/">See how we work with them ${ARROW}</a></div>
        <div class="hm-shop__grid">${DATA.services.map((s, i) => product(s, i, def)).join('\n')}</div>
        <p class="hm-shop__none" hidden>Nothing matches all of those. <button type="button" class="sf__clear">Clear filters</button></p>
        <p class="hm-shop__foot"><span>${CHECK} Month-to-month</span><span>${CHECK} 14-day money-back</span><span>${CHECK} Cancel anytime</span><span>${CHECK} No % of ad spend</span></p>
      </div>
    </div>
  </div>
  <script type="application/json" id="hm-shop-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>`;
}

(async () => {
  const { PORTFOLIO } = await import(require('url').pathToFileURL(path.join(ROOT, 'fx', 'portfolio-data.js')).href);
  fs.writeFileSync(path.join(OUT, 'home-shop.html'), shop(PORTFOLIO) + '\n');
  console.log(`home shop: ${DATA.services.length} services, ${Object.keys(CONTENT).length} industries`);
})();

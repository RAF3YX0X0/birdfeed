// Builds the pricing page around its plan builder (the page's React island,
// left as it is). Writes:
//   - fx/partials/heroes/pricing.html: the hero (a giant $99 orbited by a 3D
//     ring of every service's starting price),
//   - fx/partials/industry/pricing.top.html: rules hiding the page's other
//     original sections (trust strip, reviews, the old explorer, Pro line, FAQ),
//   - fx/partials/industry/pricing.bottom.html, after the builder: the price
//     explorer (every service by category, tiers, agency comparison), Pro, an
//     "every plan includes" receipt, the ROI estimator's slot, the guarantee,
//     the FAQ and a closing call to action.
// Prices, tiers, features and agency figures come from the site's own data
// (scripts/pricing-data.json, extracted from the bundles). Styles in
// fx/pricing.css, motion in fx/pricing.js.
//
//   node server.js &
//   NODE_PATH=<dir with puppeteer-core> node scripts/build-pricing.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { extract } = require('./build-sections.js');
const B = require('./render-blocks.js');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing-data.json'), 'utf8'));
const ICONS = { ...JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing-icons.json'), 'utf8')), sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>' };
const esc = B.esc;
const icon = (n, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.check}</svg>`;
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const num = (p) => parseInt(String(p).replace(/[^0-9]/g, ''), 10) || 0;
const money = (n) => `$${n.toLocaleString('en-US')}`;

const PAGES = {
  'Social Media Posts': '/social-media-management/', 'Short-Form Videos': '/short-form-video/', 'Instagram Growth': '/instagram-growth/',
  'Meta Ads Management': '/meta-ads-management/', 'Google Ads Management': '/google-ads-management/', 'UGC Videos': '/ugc-videos/',
  'SEO Blog Posts': '/seo-blog-posts/', 'SEO Backlinks': '/seo-backlinks/', 'Managed SEO': '/managed-seo/',
  'Email Marketing': '/email-design/', 'Landing Pages': '/landing-pages/', 'Conversion Tracking': '/conversion-tracking/',
};
const SHORT = { 'Social Media Posts': 'Social posts', 'Short-Form Videos': 'Short videos', 'Meta Ads Management': 'Meta ads', 'Google Ads Management': 'Google ads', 'Instagram Growth': 'IG growth', 'Email Marketing': 'Email', 'UGC Videos': 'UGC videos', 'SEO Backlinks': 'Backlinks', 'SEO Blog Posts': 'SEO blogs', 'Managed SEO': 'Managed SEO', 'Landing Pages': 'Landing page', 'Conversion Tracking': 'Tracking' };
const byName = Object.fromEntries(DATA.services.map((s) => [s.name, s]));
const startPrice = (s) => (s.tiers ? s.tiers[0][1] : s.flat);

// ---- Hero ------------------------------------------------------------------------
function hero() {
  const chips = DATA.services.map((s, i) => `<span class="prx-chip" style="--i:${i}"><span class="prx-chip__in">${icon(s.icon, 16)}<span>${esc(SHORT[s.name] || s.name)}</span><b>${esc(startPrice(s))}</b></span></span>`).join('');
  return `<style>astro-island[component-export="PricingPage"] > div:nth-child(1) > section:nth-child(2) > div:nth-child(2) > div:nth-child(1) { display: none !important; }</style>
<section class="prx" aria-label="Pricing" data-fx-skip>
  <div class="prx__bg" aria-hidden="true"><i></i><i></i></div>
  <div class="prx__in">
    <div class="prx__copy">
      <span class="sx-eyebrow">Pricing &amp; plans</span>
      <h1 class="prx__title"><span class="prx__line"><span>Social media pricing,</span></span> <span class="prx__line"><span><em>built by you.</em></span></span></h1>
      <p class="prx__sub">Pick the services you need, from $99 a month. Real creatives do the work, you approve everything, and every plan is month-to-month, and your first month is free.</p>
      <div class="prx__ctas"><a class="hx-btn hx-btn--blue" href="#build" data-prx-build>Build your plan</a><a class="hx-btn hx-btn--white" href="/book-demo/">Book a demo</a></div>
      <ul class="prx__facts"><li>${CHECK}Month-to-month</li><li>${CHECK}Cancel anytime</li><li>${CHECK}First month free</li><li>${CHECK}No % of ad spend</li></ul>
    </div>
    <div class="prx__stage" aria-hidden="true">
      <div class="prx__tilt">
        <div class="prx__ring">${chips}</div>
        <div class="prx__core"><small>from</small><b><sup>$</sup><span class="prx__num">99</span></b><em>/mo</em></div>
        <div class="prx__halo"></div>
      </div>
    </div>
  </div>
</section>`;
}

// ---- Price explorer -------------------------------------------------------------------
function card(s, i) {
  const tiers = s.tiers || [['', s.flat]];
  const p0 = num(tiers[0][1]);
  const unit = s.oneTime ? 'one-time' : '/mo';
  return `<article class="prx-card${i === 0 ? ' is-lead' : ''}" data-agency="${s.agency || 0}" data-ind-item>
    <div class="prx-card__top"><span class="prx-card__ico">${icon(s.icon, 22)}</span>${s.hl ? `<span class="prx-card__hl"><b>${esc(s.hl[0])}</b>${esc(s.hl[1])}</span>` : ''}</div>
    <h3>${esc(s.name)}</h3>
    <p class="prx-card__tag">${esc(s.tag)}</p>
    ${s.tiers && s.tiers.length > 1 ? `<div class="prx-card__tiers" role="radiogroup" aria-label="${esc(s.name)} options">${s.tiers.map(([label, price], k) => `<button type="button" role="radio" aria-checked="${k === 0}" data-price="${num(price)}"${k === 0 ? ' class="is-on"' : ''}>${esc(label)}</button>`).join('')}</div>` : ''}
    <p class="prx-card__price"><span class="prx-card__from">${s.tiers && s.tiers.length > 1 ? '' : 'from'}</span><b>$<span data-prx-price>${p0.toLocaleString('en-US')}</span></b><small>${unit}</small></p>
    ${s.agency ? `<div class="prx-card__vs">
      <div class="prx-card__bars"><div class="is-them"><p><span>Typical agency</span><s>$<span data-prx-them>${s.agency.toLocaleString('en-US')}</span>${s.oneTime ? '' : '/mo'}</s></p><span class="prx-bar"><i style="--w:1"></i></span></div><div class="is-us"><p><span>MadMarketing</span><b>$<span data-prx-us>${p0.toLocaleString('en-US')}</span>${s.oneTime ? '' : '/mo'}</b></p><span class="prx-bar"><i style="--w:${(p0 / s.agency).toFixed(3)}"></i></span></div></div>
      <span class="prx-card__save">Save <b data-prx-save>${money(s.agency - p0)}</b></span>
    </div>` : ''}
    <ul class="prx-card__feat">${(s.feat || []).map(([ic, t]) => `<li>${icon(ic, 15)}<span>${esc(t)}</span></li>`).join('')}</ul>
    ${s.facts ? `<dl class="prx-card__facts">${s.facts.map(([ic, k, v]) => `<div>${icon(ic, 14)}<dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    <div class="prx-card__go"><a href="#build" data-prx-build>Add it in the builder</a><a href="${PAGES[s.name] || '/all-services/'}">Learn more ${ARROW}</a></div>
  </article>`;
}
function explorer() {
  return `<section class="nx nx--light prx-list" id="every-service" data-fx-skip>
  <div class="nx__in">
    <header class="nx__head"><span class="nx__eyebrow">Every service</span><h2 class="nx__title">Every service, <em>priced up front.</em></h2><p class="nx__lede">Pick a category to see what each service includes and where its price starts, next to what a typical agency charges. Most clients combine two to four.</p></header>
    <div class="prx-tabs" role="tablist" aria-label="Service categories">${DATA.cats.map((c, i) => `<button type="button" role="tab" id="prx-tab-${i}" aria-controls="prx-panel-${i}" aria-selected="${i === 0}"${i === 0 ? ' class="is-on"' : ''}>${icon(c.icon, 17)}<span>${esc(c.label)}</span></button>`).join('')}<i class="prx-tabs__ink" aria-hidden="true"></i></div>
    ${DATA.cats.map((c, i) => `<div class="prx-panel" role="tabpanel" id="prx-panel-${i}" aria-labelledby="prx-tab-${i}"${i ? ' hidden' : ''}>${c.items.map((n, k) => card(byName[n], k)).join('')}</div>`).join('')}
    <p class="prx-list__note">All prices in USD, billed monthly unless marked one-time. Agency figures are typical rates for the same work.</p>
  </div>
</section>`;
}

// ---- Pro -----------------------------------------------------------------------------------
function pro() {
  return `<section class="nx nx--light prx-pro-wrap" data-fx-skip>
  <div class="nx__in">
    <a class="prx-pro" href="/pro/" data-ind-item>
      <span class="prx-pro__glow" aria-hidden="true"></span>
      <span class="prx-pro__body">
        <span class="nx__eyebrow">MadMarketing Pro</span>
        <b class="prx-pro__title">Want someone senior to <em>run it all?</em></b>
        <span class="prx-pro__text">A dedicated senior lead decides what to run, manages the team doing the work, and owns the results, with your full budget back as services.</span>
        <span class="prx-pro__rule">Rule of thumb: combining two or more services, or spending $1,000+ a month on marketing? Pro usually pays for itself.</span>
      </span>
      <span class="prx-pro__price"><small>Pro</small><b>$1,500</b><em>/mo</em><span class="prx-pro__go">See Pro ${ARROW}</span></span>
    </a>
  </div>
</section>`;
}

// ---- Every plan includes: a receipt ---------------------------------------------------
function receipt() {
  const lines = [
    ['Real creatives on your account', 'Designers, writers and strategists'],
    ['You approve everything', 'Nothing posts without your OK'],
    ['One social set', 'One account on each channel'],
    ['Onboarding and monthly meetings', 'Available on every plan'],
    ['Flat rate on ads management', 'Never a % of your ad spend'],
    ['Month-to-month', 'Cancel anytime'],
    ['First month free', 'On your first batch'],
  ];
  return `<section class="nx nx--stone nx--split prx-rcpt" data-fx-skip>
  <div class="nx__in">
    <div class="nx__side"><header class="nx__head"><span class="nx__eyebrow">In every plan</span><h2 class="nx__title">What every plan <em>comes with.</em></h2><p class="nx__lede">Whatever you pick, from one service to all of them, these are part of the deal.</p></header></div>
    <div class="nx__body"><div class="prx-rcpt__printer" aria-hidden="false">
      <div class="prx-rcpt__slot" aria-hidden="true"></div>
      <div class="prx-rcpt__clip"><div class="prx-rcpt__paper">
        <div class="prx-rcpt__head"><img src="/assets/madmarketing-logo-v3.svg" alt="MadMarketing" width="120" height="20" loading="lazy" decoding="async"><span>Every plan</span></div>
        <ul>${lines.map(([t, d]) => `<li><span><b>${esc(t)}</b><small>${esc(d)}</small></span><i>Included</i></li>`).join('')}</ul>
        <div class="prx-rcpt__total"><span>Plans from</span><b>$99<small>/mo</small></b></div>
        <div class="prx-rcpt__bar" aria-hidden="true"></div>
        <p class="prx-rcpt__thanks">Pay only for the services you pick.</p>
      </div></div>
    </div></div>
  </div>
</section>`;
}

// ---- The guarantee and the closing call to action, from the homepage partial ----------
function homeSection(cls) {
  const src = fs.readFileSync(path.join(ROOT, 'fx', 'partials', 'home-bottom.html'), 'utf8');
  const a = src.indexOf(`<section class="${cls}"`);
  let depth = 0;
  let i = a;
  const re = /<\/?section\b/g;
  re.lastIndex = a;
  let m;
  while ((m = re.exec(src))) {
    depth += m[0] === '<section' ? 1 : -1;
    if (depth === 0) { i = src.indexOf('>', m.index) + 1; break; }
  }
  return src.slice(a, i);
}

(async () => {
  const bundles = fs.readdirSync(path.join(ROOT, '_astro')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(ROOT, '_astro', f), 'utf8')).join('\n');
  const answer = (q) => {
    for (const open of ['`', '"']) {
      const key = `q:${open}${q}${open},a:${open}`;
      const i = bundles.indexOf(key);
      if (i !== -1) return bundles.slice(i + key.length, bundles.indexOf(open, i + key.length)).replace(/\\(.)/g, '$1');
    }
    return '';
  };
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const p = await b.newPage();
  await p.setJavaScriptEnabled(false);
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:3000/pricing/', { waitUntil: 'load', timeout: 60000 });
  const models = await p.evaluate(extract);
  await b.close();

  const hide = models.filter((m) => m.skip !== 'builder').map((m) => `${m.path} { display: none !important; }`);
  const fq = models.find((m) => m.kind === 'faq');
  const faqs = fq ? fq.faqs.map((f) => { const q = f.q.replace(/^\d{1,2}\s*/, ''); return { q, a: answer(q) }; }) : [];
  const ct = homeSection('ct')
    .replace(/(<h2 class="ct__title"[^>]*>)[\s\S]*?(<\/h2>)/, '$1Ready to build <em>your plan?</em>$2')
    .replace('<a class="hx-btn hx-btn--white" href="/pricing/">Start at $99/mo</a>', '<a class="hx-btn hx-btn--white" href="#build" data-prx-build>Build your plan</a>');

  fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'heroes', 'pricing.html'), hero() + '\n');
  fs.mkdirSync(path.join(ROOT, 'fx', 'partials', 'industry'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'industry', 'pricing.top.html'), `<style>${hide.join('\n')}</style>\n`);
  fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'industry', 'pricing.bottom.html'), [
    explorer(),
    pro(),
    receipt(),
    '<div id="fx-roi-slot"></div>',
    homeSection('gx'),
    fq ? B.faq({ eyebrow: fq.eyebrow || 'Pricing questions', title: fq.title || 'Questions, <em>answered.</em>', lede: fq.lede, faqs }) : '',
    ct,
  ].join('\n') + '\n');
  console.log(`pricing: hid ${hide.length} original sections, ${DATA.services.length} services in ${DATA.cats.length} categories, ${faqs.length} FAQs (${faqs.filter((f) => f.a).length} answered)`);
})();

// Speed and SEO pass over every page (idempotent; run after inject-fx.js):
//   - removes the original site's third-party scripts: Google Tag Manager
//     (which loaded Google Analytics / Ads, the Facebook pixel, LinkedIn and
//     PostHog), its <noscript> iframe, Tolt and the Intercom chat. They all
//     reported to Feedbird's accounts and were most of each page's weight.
//     They sit outside the React islands, and the bundles only call
//     window.fbq / dataLayer behind guards, so nothing breaks;
//   - lazy-loads every image outside the first screen (the original markup
//     loaded ~570 eagerly, many of them in sections that are hidden);
//   - makes canonical / Open Graph / Twitter URLs absolute, adds theme-color,
//     and points the Organization data at this site instead of Feedbird's;
//   - writes robots.txt and sitemap.xml.
//
//   node scripts/optimize-pages.js
const fs = require('fs');
const path = require('path');

// The live site. Change it here (and re-run) when a custom domain is added.
const SITE = 'https://madmarketinghaseeb.vercel.app';

const ROOT = path.join(__dirname, '..');
const TRACKERS = [
  /<script>\s*\(function\(w,d,s,l,i\)\{[\s\S]*?googletagmanager[\s\S]*?<\/script>\s*/g,
  /<noscript>\s*<iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html[\s\S]*?<\/noscript>\s*/g,
  /<script async src="https:\/\/cdn\.tolt\.io\/tolt\.js"[^>]*><\/script>\s*/g,
  /<script>\s*window\.intercomSettings[\s\S]*?<\/script>\s*/g,
  /<!-- (End )?Google Tag Manager( \(noscript\))? -->/g,
];
// Blocks on the first screen: their images load right away.
const ABOVE_FOLD = ['nav', 'hero', 'pagehero'];

function pages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'fx', '_astro', 'scripts'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const abs = (u) => (/^https?:/.test(u) ? u : SITE + (u.startsWith('/') ? u : '/' + u));

// Media belonging to the clone, inside sections that are hidden and no longer
// hydrate. The browser still fetched the review posters and enough of each
// video to read its metadata — 16 requests a page for something nobody sees.
// The folders are the clone's alone: ours live in /work/ and /assets/.
const CLONE_MEDIA = /^\/(reviews|px|img|lp|ugc|vx)\//;
function quietCloneMedia(html) {
  // A poster that is only ever decoration for a hidden video.
  html = html.replace(/<video\b[^>]*>/g, (tag) => {
    let out = tag;
    const poster = (out.match(/\sposter="([^"]*)"/) || [])[1];
    const src = (out.match(/\ssrc="([^"]*)"/) || [])[1];
    const theirs = (poster && CLONE_MEDIA.test(poster)) || (src && CLONE_MEDIA.test(src));
    if (poster && CLONE_MEDIA.test(poster)) out = out.replace(/\sposter="[^"]*"/, '');
    // The clone's own players carry the file on the element and ask for its
    // metadata up front, so the preload they set has to be overridden.
    if (src && CLONE_MEDIA.test(src)) out = out.replace(/\ssrc="[^"]*"/, ` data-fx-src="${src}"`);
    if (theirs) out = out.replace(/\spreload="[^"]*"/, '');
    // Without this a video fetches its metadata the moment the page loads.
    if (!/\spreload=/.test(out)) out = out.replace(/^<video\b/, '<video preload="none"');
    return out;
  });
  // <source> inside those videos, and the clone's own images.
  html = html.replace(/<source\b([^>]*)\ssrc="([^"]*)"([^>]*)>/g, (tag, a, src, b) =>
    (CLONE_MEDIA.test(src) ? `<source${a} data-fx-src="${src}"${b}>` : tag));
  html = html.replace(/<img\b([^>]*)\ssrc="([^"]*)"([^>]*)>/g, (tag, a, src, b) =>
    (CLONE_MEDIA.test(src) && !/\sloading="lazy"/.test(tag) ? `<img${a} src="${src}"${b} loading="lazy" decoding="async">` : tag));
  return html;
}

function lazyImages(html) {
  // Split off the first-screen blocks, lazy-load images everywhere else.
  const keep = [];
  for (const name of ABOVE_FOLD) {
    const a = html.indexOf(`<!-- fx:${name}:start -->`);
    const b = html.indexOf(`<!-- fx:${name}:end -->`);
    if (a !== -1 && b !== -1) keep.push([a, b]);
  }
  let out = '';
  let last = 0;
  const re = /<img\b(?![^>]*\sloading=)/g;
  let m;
  while ((m = re.exec(html))) {
    if (keep.some(([a, b]) => m.index > a && m.index < b)) continue;
    out += html.slice(last, m.index) + '<img loading="lazy" decoding="async"';
    last = m.index + 4;
  }
  return out + html.slice(last);
}

// The demo page's booking calendar (the client's Calendly, fx/cal.js): connect
// to Calendly from the start, and let React take over the section within
// 600ms of the page settling instead of whenever the browser is next idle.
function bookingEmbed(html) {
  if (!/component-export="BookDemo"/.test(html) || !/my-cal-inline/.test(html)) return html;
  // The calendar is the client's Calendly (fx/cal.js); connect to it early.
  // (Replaces the hints for the original Cal.com calendar, if a page still has them.)
  html = html.replace(/<!-- cal:preconnect -->(<link [^>]*>)*/, '');
  html = html.replace('</title>', '</title><!-- cal:preconnect --><link rel="preconnect" href="https://calendly.com"><link rel="preconnect" href="https://assets.calendly.com">');
  return html.replace(/(<astro-island[^>]*component-export="BookDemo"[^>]*opts="{&quot;name&quot;:&quot;BookDemo&quot;,&quot;value&quot;:)true(})/, '$1{&quot;timeout&quot;:600}$2');
}

// Homepage: React takes the main island over once the page settles (within
// 1.5s) instead of only when it scrolls into view. Its code is the same
// bundle the hero island already loads.
function homeBuilder(html) {
  return html
    .replace(/(<astro-island[^>]*component-export="FBHomeMain"[^>]*client=")visible("[^>]*opts="{&quot;name&quot;:&quot;FBHomeMain&quot;,&quot;value&quot;:)true(})/, '$1idle$2{&quot;timeout&quot;:1500}$3')
    // The "book a demo" pop-up (45 s, or when the pointer leaves the window)
    // lives in the original footer, inside the homepage's bottom island. Left
    // as client:visible, that island only starts once someone scrolls to the
    // bottom, so the pop-up never ran; start it when the page is idle.
    .replace(/(<astro-island[^>]*component-export="FBHomeBottom"[^>]*client=")visible("[^>]*opts="{&quot;name&quot;:&quot;FBHomeBottom&quot;,&quot;value&quot;:)true(})/, '$1idle$2{&quot;timeout&quot;:4000}$3');
}

// The homepage's own SEO, from the client's copy (2026-10), and FAQ rich
// results for its five questions (fx/partials/home-faq.json).
const HOME_SEO = {
  title: 'Digital Marketing & Local SEO Agency | MADMarketing',
  description: 'Get found, earn trust, and grow with MADMarketing. Local SEO, Google Maps optimization, paid ads, AI search visibility, and digital growth strategies.',
};
function homeSeo(html, file) {
  if (path.relative(ROOT, file) !== 'index.html') return html;
  const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${HOME_SEO.title.replace(/&/g, '&amp;')}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${attr(HOME_SEO.description)}$2`)
    .replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, `$1${attr(HOME_SEO.title)}$2`)
    .replace(/(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*(")/g, `$1${attr(HOME_SEO.description)}$2`);
  const faqFile = path.join(ROOT, 'fx', 'partials', 'home-faq.json');
  if (fs.existsSync(faqFile)) {
    const qa = JSON.parse(fs.readFileSync(faqFile, 'utf8'));
    const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
    const tag = `<script type="application/ld+json" id="fx-faq-ld">${JSON.stringify(ld)}</script>`;
    html = /<script type="application\/ld\+json" id="fx-faq-ld">/.test(html)
      ? html.replace(/<script type="application\/ld\+json" id="fx-faq-ld">[\s\S]*?<\/script>/, tag)
      : html.replace('</head>', tag + '</head>');
  }
  return html;
}

const ORG_DESCRIPTION = 'MADMarketing is a full-service digital marketing agency leading with local SEO and Google Maps visibility for US local businesses. Local SEO plans from $199 a month.';
// Page descriptions written for the original's offer: its price and terms
// come out (the plans are on /pricing/, from scripts/offer-data.js).
const OFFER_TEXT = [
  [/ from \$99\/mo:/g, ':'],
  [/ from \$99\/mo/g, ''],
  [/\. (?:Dedicated team, )?[Nn]o contracts\./g, '.'],
  [/, (?:dedicated team, )?no contracts\./g, '.'],
  [/(?<!\.)\.\.(?!\.)/g, '.'], // (left by an earlier version of these rules)
];
const PAGE_TITLES = {
  about: 'About MADMarketing: Local SEO & Digital Marketing in St. Louis',
};
const PAGE_DESCRIPTIONS = {
  about: 'MADMarketing is a full-service digital marketing agency in St. Louis, leading with local SEO and Google Maps visibility for US local businesses.',
  examples: 'Browse real work our team made for our clients: social posts, reels, creator videos, brochures and websites, by industry and client.',
};
function offerText(html, file) {
  const slug = path.relative(ROOT, path.dirname(file)).split(path.sep).join('/');
  const own = PAGE_DESCRIPTIONS[slug];
  const clean = (t) => OFFER_TEXT.reduce((x, [re, to]) => x.replace(re, to), t);
  const title = PAGE_TITLES[slug];
  if (title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/&/g, '&amp;')}</title>`)
      .replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, `$1${title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}$2`);
  }
  html = html.replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")([^"]*)(")/g, (m, a, t, b) => a + (own || clean(t)) + b);
  return html.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (m, a, json, b) => a + clean(json) + b);
}

function seo(html) {
  html = html.replace(/(<link rel="canonical" href=")([^"]+)(")/, (m, a, u, b) => a + abs(u) + b);
  html = html.replace(/(<meta (?:property|name)="(?:og:url|og:image|twitter:image)" content=")([^"]+)(")/g, (m, a, u, b) => a + abs(u) + b);
  if (!/name="theme-color"/.test(html)) html = html.replace('</title>', '</title><meta name="theme-color" content="#F5F7FA">');
  // Organization data: this site, not the original's (its email, office and
  // review profile aren't MadMarketing's).
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (m, a, json, b) => {
    let data;
    try { data = JSON.parse(json); } catch (e) { return m; }
    const fix = (o) => {
      if (!o || typeof o !== 'object') return;
      const types = [].concat(o['@type'] || []);
      if (types.includes('Organization')) {
        o.url = SITE + '/';
        if (o.logo) o.logo = abs(o.logo);
        // The client's own details (requirements questionnaire, 2026-10).
        // The client's positioning (Services & Packages, 2026-10), in place of
        // the original's "affordable social media management from $99/mo".
        delete o.alternateName;
        delete o.priceRange;
        o.description = ORG_DESCRIPTION;
        o.email = 'hello@madmediamarketing.com';
        o.telephone = '+1-636-369-2742';
        o.address = { '@type': 'PostalAddress', streetAddress: '2055 Craigshire Dr', addressLocality: 'St. Louis', addressRegion: 'MO', postalCode: '63146', addressCountry: 'US' };
        o.sameAs = ['https://www.facebook.com/getmadmarketing/'];
        o.contactPoint = { '@type': 'ContactPoint', contactType: 'customer service', email: 'hello@madmediamarketing.com', telephone: '+1-636-369-2742', availableLanguage: 'English', hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' } };
      }
      Object.values(o).forEach(fix);
    };
    fix(data);
    const out = JSON.stringify(data).replace(/https:\/\/(www\.)?feedbird\.com/g, SITE);
    return a + out + b;
  });
  return html;
}

let removed = 0;
const urls = [];
for (const f of pages(ROOT)) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  for (const re of TRACKERS) s = s.replace(re, () => { removed++; return ''; });
  s = homeSeo(offerText(homeBuilder(bookingEmbed(seo(quietCloneMedia(lazyImages(s))))), f), f);
  if (s !== before) fs.writeFileSync(f, s);
  const rel = path.relative(ROOT, path.dirname(f)).split(path.sep).join('/');
  if (!/name="robots" content="noindex/.test(s)) urls.push(rel ? `/${rel}/` : '/'); // (the login page isn't listed)
}

const today = new Date().toISOString().slice(0, 10);
const LEGAL = ['/privacy/', '/refund/', '/terms/'];
urls.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${u === '/' ? '1.0' : LEGAL.includes(u) ? '0.3' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`${urls.length} pages: ${removed} tracker snippets removed, images lazy-loaded below the fold, SEO tags absolute; robots.txt + sitemap.xml written`);

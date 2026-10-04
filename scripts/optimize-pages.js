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

function seo(html) {
  html = html.replace(/(<link rel="canonical" href=")([^"]+)(")/, (m, a, u, b) => a + abs(u) + b);
  html = html.replace(/(<meta (?:property|name)="(?:og:url|og:image|twitter:image)" content=")([^"]+)(")/g, (m, a, u, b) => a + abs(u) + b);
  if (!/name="theme-color"/.test(html)) html = html.replace('</title>', '</title><meta name="theme-color" content="#FCFCF9">');
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
        delete o.email;
        delete o.address;
        delete o.sameAs;
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
  s = seo(lazyImages(s));
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

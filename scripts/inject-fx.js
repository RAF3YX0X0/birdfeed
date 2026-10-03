// Adds (or refreshes) the FX layer tags in every page's <head>.
// Idempotent: the block between the fx:start / fx:end markers is replaced.
//   node scripts/inject-fx.js           inject / update
//   node scripts/inject-fx.js --remove  strip the FX layer from every page
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const START = '<!-- fx:start -->';
const END = '<!-- fx:end -->';
const remove = process.argv.includes('--remove');

// Static markup from fx/partials/, placed at fixed points in <main>. Every page
// gets the pill nav (start of <main>) and the footer (end of <main>); the
// homepage also gets its own sections, each just before one of its React
// islands. Whatever they replace stays in the DOM (so React hydrates as usual)
// and is hidden by CSS (chrome.css, hero.css, hiw.css, portfolio.css,
// bottom.css).
const HOME = path.join(ROOT, 'index.html');
const BLOCKS = [
  { name: 'nav', at: 'main-start', files: ['nav.html'] },
  { name: 'hero', home: true, island: 'FBHomeTop', files: ['home-hero.html', 'home-projects.html'] },
  { name: 'hiw', home: true, island: 'FBHomeMain', files: ['home-trust.html', 'home-hiw.html', 'home-portfolio.html', 'home-pricing-head.html'] },
  { name: 'bottom', home: true, island: 'FBHomeBottom', files: ['home-bottom.html'] },
  { name: 'footer', at: 'main-end', files: ['footer.html'] },
].map((b) => ({ ...b, start: `<!-- fx:${b.name}:start -->`, end: `<!-- fx:${b.name}:end -->` }));
const partial = (f) => fs.readFileSync(path.join(ROOT, 'fx', 'partials', f), 'utf8').trim();
// Inner pages: the old header sat in the flow, so keep its space under the nav.
const NAV_SPACE = '<div class="fx-navspace" aria-hidden="true"></div>';

// Three.js is deliberately not preloaded: fx.js imports it on demand while the
// intro curtain plays, which keeps it off the critical path to DOMContentLoaded.
function block(home) {
  return [
    START,
    '<link rel="stylesheet" href="/fx/fx.css">',
    '<link rel="stylesheet" href="/fx/chrome.css">',
    '<link rel="preload" href="/fonts/instrument-serif-latin-400-italic.woff2" as="font" type="font/woff2" crossorigin>',
    ...(home ? [
      '<link rel="stylesheet" href="/fx/hero.css">',
      '<link rel="stylesheet" href="/fx/projects.css">',
      '<link rel="stylesheet" href="/fx/trust.css">',
      '<link rel="stylesheet" href="/fx/hiw.css">',
      '<link rel="stylesheet" href="/fx/portfolio.css">',
      '<link rel="stylesheet" href="/fx/bottom.css">',
    ] : []),
    '<script src="/fx/boot.js"></script>',
    '<script src="/fx/vendor/gsap.min.js" defer></script>',
    '<script src="/fx/vendor/ScrollTrigger.min.js" defer></script>',
    '<script src="/fx/vendor/lenis.min.js" defer></script>',
    '<script type="module" src="/fx/fx.js"></script>',
    END,
  ].join('\n');
}

function pages(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'fx') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) pages(p, out);
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of pages(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  let html = src;
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a !== -1 && b !== -1) html = html.slice(0, a).replace(/\n$/, '') + html.slice(b + END.length).replace(/^\n/, '');
  const home = file === HOME;
  for (const blk of BLOCKS) {
    const s = html.indexOf(blk.start);
    const e = html.indexOf(blk.end);
    if (s !== -1 && e !== -1) html = html.slice(0, s) + html.slice(e + blk.end.length);
  }
  if (!remove) {
    const i = html.indexOf('</head>');
    if (i === -1) { console.warn('no </head>:', path.relative(ROOT, file)); continue; }
    html = html.slice(0, i) + '\n' + block(home) + '\n' + html.slice(i);
    for (const blk of BLOCKS) {
      if (blk.home && !home) continue;
      let k = -1;
      if (blk.at === 'main-start') {
        const m = html.indexOf('<main');
        k = m === -1 ? -1 : html.indexOf('>', m) + 1;
      } else if (blk.at === 'main-end') {
        k = html.lastIndexOf('</main>');
      } else {
        const at = html.indexOf(`component-export="${blk.island}"`);
        k = at === -1 ? -1 : html.lastIndexOf('<astro-island', at);
      }
      if (k <= 0) { console.warn(`no place for ${blk.name}:`, path.relative(ROOT, file)); continue; }
      const extra = blk.name === 'nav' && !home ? NAV_SPACE : '';
      html = html.slice(0, k) + blk.start + blk.files.map(partial).join('\n') + extra + blk.end + html.slice(k);
    }
  }
  if (html !== src) {
    fs.writeFileSync(file, html);
    changed++;
  }
}
console.log(`${remove ? 'removed from' : 'injected into'} ${changed} page(s)`);

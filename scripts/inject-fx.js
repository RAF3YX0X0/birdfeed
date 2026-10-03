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

// The homepage also gets its own hero (fx/partials/home-hero.html), placed in
// <main> just before the first island, whose header and hero hero.css hides.
const HOME = path.join(ROOT, 'index.html');
const HERO_START = '<!-- fx:hero:start -->';
const HERO_END = '<!-- fx:hero:end -->';
const heroHtml = () => fs.readFileSync(path.join(ROOT, 'fx', 'partials', 'home-hero.html'), 'utf8').trim();

// Three.js is deliberately not preloaded: fx.js imports it on demand while the
// intro curtain plays, which keeps it off the critical path to DOMContentLoaded.
function block(home) {
  return [
    START,
    '<link rel="stylesheet" href="/fx/fx.css">',
    ...(home ? [
      '<link rel="stylesheet" href="/fx/hero.css">',
      '<link rel="preload" href="/fonts/instrument-serif-latin-400-italic.woff2" as="font" type="font/woff2" crossorigin>',
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
  const ha = html.indexOf(HERO_START);
  const hb = html.indexOf(HERO_END);
  if (ha !== -1 && hb !== -1) html = html.slice(0, ha) + html.slice(hb + HERO_END.length);
  if (!remove) {
    const i = html.indexOf('</head>');
    if (i === -1) { console.warn('no </head>:', path.relative(ROOT, file)); continue; }
    html = html.slice(0, i) + '\n' + block(home) + '\n' + html.slice(i);
    if (home) {
      const j = html.indexOf('<astro-island');
      if (j === -1) console.warn('no island on the homepage');
      else html = html.slice(0, j) + HERO_START + heroHtml() + HERO_END + html.slice(j);
    }
  }
  if (html !== src) {
    fs.writeFileSync(file, html);
    changed++;
  }
}
console.log(`${remove ? 'removed from' : 'injected into'} ${changed} page(s)`);

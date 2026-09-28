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

// Three.js is deliberately not preloaded: fx.js imports it on demand while the
// intro curtain plays, which keeps it off the critical path to DOMContentLoaded.
function block() {
  return [
    START,
    '<link rel="stylesheet" href="/fx/fx.css">',
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
  if (!remove) {
    const i = html.indexOf('</head>');
    if (i === -1) { console.warn('no </head>:', path.relative(ROOT, file)); continue; }
    html = html.slice(0, i) + '\n' + block() + '\n' + html.slice(i);
  }
  if (html !== src) {
    fs.writeFileSync(file, html);
    changed++;
  }
}
console.log(`${remove ? 'removed from' : 'injected into'} ${changed} page(s)`);

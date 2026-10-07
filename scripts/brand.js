// The client's brand guide (MadMarketing Brand Styleboard, 2026-10), applied
// to the whole site:
//   - colours: Primary Black #0A0A0A, Brand Blue #0066FF, Background #F5F7FA,
//     Border #E5E7EB, Text Secondary #1F2937 (and cool greys between them in
//     place of the old warm ones);
//   - typography: Satoshi only. The serif-italic highlight word becomes the
//     same Satoshi, in blue, as in the guide's "Brands That Grow".
//
// Like scripts/retheme.js it rewrites the pre-rendered pages, the JS bundles
// and the Astro CSS identically (so React hydrates cleanly), the FX layer and
// the page generators, and renames every changed /_astro file (they're served
// as immutable). Idempotent: run it again after regenerating anything.
//
//   node scripts/brand.js   (then build-fx.js and optimize-pages.js)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASTRO = path.join(ROOT, '_astro');

const MAP = {
  // The blue and its steps.
  '0029ff': '0066ff',
  '0021d6': '0052cc', '0020c4': '0052cc',
  '3352ff': '1a75ff', '4a63ff': '1a75ff', '5c76ff': '3385ff',
  '7088ff': '4d94ff', '8da0ff': '66a3ff', '9db0ff': '8cbaff', '9dadff': '8cbaff',
  'b8c4ff': '99c2ff', 'e6eaff': 'e5f0ff', 'eef1ff': 'ebf3ff',
  // Black.
  '0a0b10': '0a0a0a',
  // Backgrounds and borders: the warm off-whites become the guide's cool greys.
  'fcfcf9': 'f5f7fa', 'fefefc': 'fdfdfe', 'fafaf7': 'f9fafb',
  'f5f5f1': 'eef1f5', 'f4f4f0': 'eef1f5', 'f2f2ee': 'eef1f5', 'f1f1ed': 'eef1f5', 'f0f0ec': 'eef1f5', 'efefea': 'eef1f5',
  'eeeeea': 'e5e7eb', 'ecece6': 'e5e7eb', 'ebebe6': 'e5e7eb', 'e5e5e0': 'e5e7eb',
  'e4e4de': 'e2e5ea', 'e4e4dd': 'e2e5ea', 'e2e2dc': 'e2e5ea',
  'dcdcd5': 'd8dce3', 'dadad4': 'd8dce3', 'd6d6cf': 'd1d5db', 'd4d4cf': 'd1d5db', 'd4d4ce': 'd1d5db', 'cfcfc8': 'd1d5db',
  // Text greys.
  '3f3f46': '1f2937', '26262c': '1f2937', '52525b': '4b5563', '55555a': '4b5563', '6b6b74': '6b7280', '8a8b95': '858c99',
};
const rgbOf = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));

function recolor(s) {
  s = s.replace(/(#|%23|0x)([0-9a-fA-F]{6})([0-9a-fA-F]{2})?(?![0-9a-fA-F])/g, (m, pre, hex, alpha = '') => {
    const to = MAP[hex.toLowerCase()];
    if (!to) return m;
    return pre + (hex === hex.toUpperCase() && /[A-F]/.test(hex) ? to.toUpperCase() : to) + alpha;
  });
  for (const [from, to] of Object.entries(MAP)) {
    const [r, g, b] = rgbOf(from);
    const [R, G, B] = rgbOf(to);
    const re = new RegExp(`(rgba?\\(\\s*)${r}(\\s*,\\s*)${g}(\\s*,\\s*)${b}(?=\\s*[,)])`, 'g');
    s = s.replace(re, `$1${R}$2${G}$3${B}`);
  }
  return s;
}

const FACES =
  '@font-face{font-family:Satoshi;font-style:normal;font-weight:300 900;font-display:swap;src:url(/fonts/satoshi-variable.woff2) format("woff2")}' +
  '@font-face{font-family:"Satoshi Fallback";src:local("Arial");ascent-override:93.3%;descent-override:22.17%;line-gap-override:9.24%;size-adjust:108.25%}';
const PRELOAD = '<link rel="preload" as="font" type="font/woff2" href="/fonts/satoshi-variable.woff2" crossorigin>';

function refont(s) {
  return (
    s
      // Stacks.
      .replace(/Inter(\s*),(\s*)(?:&quot;|"|')?Inter Fallback(?:&quot;|"|')?/g, 'Satoshi$1,$2Satoshi Fallback')
      .replace(/(font-family:\s*['"]?|fontFamily:`)Inter(?=['"`]?\s*[;,}!`"'])/g, '$1Satoshi')
      .replace(/(var\(--mono,\s*)Inter\b/g, '$1Satoshi')
      // @font-face rules for the old families (one or many in a row) → the Satoshi faces, once.
      .replace(/(?:@font-face\s*\{[^{}]*?font-family:\s*['"]?(?:Inter|Inter Fallback|Instrument Serif|Geist|JetBrains Mono)['"]?;[^{}]*\}\s*)+/g, FACES + '\n')
      // Font preloads.
      .replace(/(<link rel="preload"[^>]*href="\/fonts\/(?:inter|instrument-serif)[^"]*"[^>]*>\s*)+/g, PRELOAD)
      // Re-runs: don't stack the faces twice.
      .split(FACES + '\n' + FACES)
      .join(FACES)
  );
}

// Satoshi is narrower than Inter, so headings tracked for Inter (-0.04 to
// -0.065em) close up until letters touch. Each tight value maps to a looser
// one; none of the new values is in the old list, so re-runs change nothing.
const TRACKING = { 65: '038', 55: '033', 45: '028', 35: '023', 6: '036', 5: '031', 4: '026', 3: '021' };
function retrack(s) {
  return s.replace(/-(0?)\.0(65|55|45|35|6|5|4|3)em(?![\w-])/g, (m, zero, v) => `-${zero}.${TRACKING[v]}em`);
}

// CSS that restyles React markup by its inline colour, e.g. the estimate
// card's [style*="0A0B10"] (dark text → white), writes the colour without
// "#" or "rgb(", so recolor() can't see it. Same map, inside those selectors.
const TRIPLETS = Object.fromEntries(Object.entries(MAP).map(([a, b]) => [rgbOf(a).join(', '), rgbOf(b).join(', ')]));
function selectors(s) {
  return s.replace(/(style\*=")([^"]*)(")/g, (m, a, inner, c) => {
    const out = inner
      .replace(/(^|[^#0-9a-fA-F])([0-9a-fA-F]{6})(?![0-9a-fA-F])/g, (mm, pre, hex) => {
        const to = MAP[hex.toLowerCase()];
        return to ? pre + (hex === hex.toUpperCase() && /[A-F]/.test(hex) ? to.toUpperCase() : to) : mm;
      })
      .replace(/\b\d{1,3}, \d{1,3}, \d{1,3}\b/g, (t) => TRIPLETS[t] ?? t);
    return a + out + c;
  });
}

/** One Satoshi preload per page (it replaced two old ones). */
function onePreload(s) {
  const parts = s.split(PRELOAD);
  return parts.length > 2 ? parts[0] + PRELOAD + parts.slice(1).join('').replace(/\n\s*\n/g, '\n') : s;
}

// A highlighted word: was the serif italic, now Satoshi in the blue, at the
// heading's own weight and size.
function accents(s) {
  return s.replace(/\{([^{}]*Instrument Serif[^{}]*)\}/g, (m, body) => {
    if (/src\s*:/.test(body)) return m; // an @font-face (handled above)
    const out = body
      .replace(/font-family:\s*['"]?Instrument Serif['"]?,\s*Georgia,\s*serif/g, 'font-family: Satoshi, Satoshi Fallback, system-ui, sans-serif')
      .replace(/font-family:\s*['"]?Instrument Serif['"]?/g, 'font-family: Satoshi')
      .replace(/font-style:\s*italic/g, 'font-style: normal')
      .replace(/font-weight:\s*400\b/g, 'font-weight: inherit')
      .replace(/font-size:\s*1\.\d+em/g, 'font-size: 1em')
      .replace(/letter-spacing:\s*-?0?\.0\d+em/g, 'letter-spacing: inherit');
    return '{' + out + '}';
  });
}

function walk(dir, test, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor', 'dist'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(p)) out.push(p);
  }
  return out;
}

const pages = walk(ROOT, (p) => p.endsWith('.html') && !p.includes(`${path.sep}_astro${path.sep}`) && !p.includes(`${path.sep}fx${path.sep}`) && !p.includes(`${path.sep}scripts${path.sep}`));
const fxFiles = walk(path.join(ROOT, 'fx'), (p) => /\.(js|css|html|json)$/.test(p));
const generators = fs
  .readdirSync(path.join(ROOT, 'scripts'))
  .filter((f) => /\.(js|mjs|json)$/.test(f) && !['brand.js', 'retheme.js', 'rebrand.js', 'client-facts.js'].includes(f))
  .map((f) => path.join(ROOT, 'scripts', f));
const astro = fs.readdirSync(ASTRO).filter((f) => /\.(js|css)$/.test(f)).map((f) => path.join(ASTRO, f));

const original = new Map();
let edited = 0;
for (const f of [...pages, ...fxFiles, ...generators, ...astro]) {
  const src = fs.readFileSync(f, 'utf8');
  original.set(f, src);
  let out = src;
  const astroCss = f.startsWith(ASTRO) && f.endsWith('.css');
  // retheme.js appended the Inter faces to the Astro CSS; swap that block.
  if (astroCss) out = out.replace(/\n\/\* Inter \(variable\)[\s\S]*$/, '\n/* Satoshi (brand typeface) */\n' + FACES + '\n');
  out = onePreload(retrack(accents(refont(selectors(recolor(out))))));
  if (out !== src) {
    fs.writeFileSync(f, out);
    edited++;
  }
}
console.log('rewrote', edited, 'files');

// Rename changed /_astro files, cascading through whatever references them.
const renamed = new Map();
const bump = (f) => f.replace(/(-b\d+)?(\.(?:js|css))$/, (m, v, ext) => `-b${v ? +v.slice(2) + 1 : 1}${ext}`);
const done = new Set();
for (;;) {
  const now = fs.readdirSync(ASTRO).filter((f) => /\.(js|css)$/.test(f));
  const todo = now.filter((f) => !done.has(f) && original.has(path.join(ASTRO, f)) && fs.readFileSync(path.join(ASTRO, f), 'utf8') !== original.get(path.join(ASTRO, f)));
  if (!todo.length) break;
  for (const f of todo) {
    const next = bump(f);
    fs.renameSync(path.join(ASTRO, f), path.join(ASTRO, next));
    renamed.set(f, next);
    done.add(next);
  }
  const files = [...pages, ...fxFiles, ...generators, ...fs.readdirSync(ASTRO).map((f) => path.join(ASTRO, f))];
  for (const p of files) {
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    let t = s;
    for (const f of todo) t = t.split(f).join(renamed.get(f));
    if (t !== s) fs.writeFileSync(p, t);
  }
}
console.log('renamed', renamed.size, 'astro files');

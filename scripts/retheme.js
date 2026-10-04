// One-off retheme of the whole site to the MadMarketing palette and type:
//   - black and white with one blue (rgb(0 41 255)), on the off-white #FCFCF9
//   - Inter everywhere (with an "Inter Fallback" face, as Next.js does), the
//     serif italic kept for highlighted words
//
// Like scripts/rebrand.js it rewrites the pre-rendered pages, the JS bundles
// and the Astro CSS identically (so React hydrates cleanly), plus the FX
// layer, and renames every changed /_astro file (immutable cache).
//
//   node scripts/retheme.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASTRO = path.join(ROOT, '_astro');

// Old colour → new colour.
const MAP = {
  // The blue, and its lighter / darker steps.
  '3b5bff': '0029ff',
  '2f4df0': '0021d6', '3050e0': '0021d6', '2a45e0': '0021d6', '2a44d8': '0021d6', '2c43cf': '0021d6',
  '5e73ff': '3352ff', '5b6cf2': '3352ff', '5a74ff': '3352ff', '5870ff': '3352ff', '6a84ff': '3352ff', '6f86ff': '3352ff',
  '7a8bff': '7088ff', '8a9bff': '7088ff', '8ea0ff': '7088ff', '8fa3ff': '7088ff', '9cb1ff': '7088ff', '9daeff': '7088ff', '9fb0ff': '7088ff',
  'afc0ff': 'b8c4ff', 'b9c4ff': 'b8c4ff', 'c7d0ff': 'b8c4ff', 'c9d4ff': 'b8c4ff',
  // Small blue tints (chips, icon tiles) stay a faint blue.
  'e6ebff': 'eef1ff',
  // Large light-blue surfaces (arches, panels) become neutral greys.
  'eef2fc': 'f2f2ee', 'eaf1ff': 'f2f2ee', 'e7eefa': 'f2f2ee', 'e7ecfa': 'f2f2ee', 'e6ebfb': 'f2f2ee',
  'e3eafb': 'ebebe6', 'e2e9fb': 'ebebe6', 'dfe6ff': 'ebebe6', 'dde6fb': 'ebebe6', 'dce5fb': 'ebebe6', 'e4edf8': 'ebebe6',
  'd9e3fb': 'e4e4de', 'd7e0ff': 'e4e4de', 'd6e0fb': 'e4e4de',
  'c9d5ff': 'dcdcd5', 'bfcdff': 'd6d6cf', 'c3d0ff': 'd6d6cf', 'b6c6ff': 'd6d6cf',
  // Warm greys of the old theme → the neutral off-white family.
  'f3f2f1': 'fcfcf9',
  'fbfaf8': 'fefefc', 'fbfaf7': 'fefefc',
  'ebeae7': 'f1f1ed', 'eae8e3': 'ebebe6', 'e1dfda': 'e5e5e0', 'e3e0da': 'e5e5e0', 'd8d5ce': 'dadad4',
  'f0eeea': 'eeeeea', 'eceae6': 'eeeeea', 'f6f5f3': 'f5f5f1',
};
const rgbOf = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));

function recolor(s) {
  // Hex, in CSS / JS (#abcdef, #abcdef80), URL-encoded SVGs (%23abcdef) and
  // Three.js (0xabcdef).
  s = s.replace(/(#|%23|0x)([0-9a-fA-F]{6})([0-9a-fA-F]{2})?(?![0-9a-fA-F])/g, (m, pre, hex, alpha = '') => {
    const to = MAP[hex.toLowerCase()];
    if (!to) return m;
    return pre + (hex === hex.toUpperCase() && /[A-F]/.test(hex) ? to.toUpperCase() : to) + alpha;
  });
  // rgb()/rgba() spellings (React writes "rgb(59, 91, 255)" when it re-renders).
  for (const [from, to] of Object.entries(MAP)) {
    const [r, g, b] = rgbOf(from);
    const [R, G, B] = rgbOf(to);
    const re = new RegExp(`(rgba?\\(\\s*)${r}(\\s*,\\s*)${g}(\\s*,\\s*)${b}(?=\\s*[,)])`, 'g');
    s = s.replace(re, `$1${R}$2${G}$3${B}`);
  }
  return s;
}

// Every font stack becomes Inter. Family names are left unquoted (valid CSS:
// "Inter Fallback" is two identifiers), so the replacement is safe inside
// HTML attributes, JS strings and CSS alike.
const INTER = 'Inter, Inter Fallback, system-ui, sans-serif';
function refont(s) {
  return s
    // Old font preloads become one Inter preload.
    .replace(/(<link rel="preload" as="font" type="font\/woff2" href="\/fonts\/geist-[^"]+" crossorigin>\s*)+/g, '<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-wght-normal.woff2" crossorigin>')
    // The type specimen in the brand-kit illustration.
    .replace(/children:`Geist`/g, 'children:`Inter`').replace(/>Geist</g, '>Inter<')
    .replace(/(?:&quot;|"|')?Geist Mono(?:&quot;|"|')?(?:,\s*monospace)?/g, INTER)
    .replace(/(?:&quot;|"|')?Geist(?:&quot;|"|')?,\s*(?:&quot;|"|')Inter(?:&quot;|"|')/g, 'Inter, Inter Fallback')
    .replace(/(?:&quot;|"|')?Geist(?: Mono)?(?:&quot;|"|')?,\s*Inter(?:,\s*system-ui)?,\s*sans-serif/g, INTER)
    .replace(/(?:&quot;|"|')?Geist(?: Mono)?(?:&quot;|"|')?,\s*Inter\b/g, 'Inter, Inter Fallback')
    .replace(/(?:&quot;|"|')?JetBrains Mono(?:&quot;|"|')?(?:,\s*ui-monospace)?(?:,\s*monospace)?/g, INTER);
}

const FACES = `
/* Inter (variable), its metric-matched fallback, and the old family names
   (anything still asking for them gets Inter too). */
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin-ext-wght-normal.woff2) format("woff2-variations"),url(/fonts/inter-latin-ext-wght-normal.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin-wght-normal.woff2) format("woff2-variations"),url(/fonts/inter-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter Fallback";src:local("Arial");ascent-override:90.44%;descent-override:22.52%;line-gap-override:0%;size-adjust:107.12%}
@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin-wght-normal.woff2) format("woff2")}
@font-face{font-family:"JetBrains Mono";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin-wght-normal.woff2) format("woff2")}
`;

function walk(dir, test, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(p)) out.push(p);
  }
  return out;
}

const pages = walk(ROOT, (p) => p.endsWith('.html') && !p.includes(`${path.sep}_astro${path.sep}`));
const fxFiles = walk(path.join(ROOT, 'fx'), (p) => /\.(js|css|html)$/.test(p));
const astro = fs.readdirSync(ASTRO).filter((f) => /\.(js|css)$/.test(f)).map((f) => path.join(ASTRO, f));
const original = new Map();
let edited = 0;
for (const f of [...pages, ...fxFiles, ...astro]) {
  const src = fs.readFileSync(f, 'utf8');
  original.set(f, src);
  let out = src;
  // Astro CSS: drop the Geist / JetBrains Mono faces before renaming fonts,
  // then add the Inter faces.
  // (A block this script added on an earlier run is taken off and re-added.)
  const astroCss = f.startsWith(ASTRO) && f.endsWith('.css');
  if (astroCss) out = out.replace(/\n\/\* Inter \(variable\)[\s\S]*$/, '').replace(/@font-face\{font-family:(?:Geist|JetBrains Mono);[^}]*\}/g, '');
  out = refont(recolor(out));
  if (astroCss) out += FACES;
  if (out !== src) { fs.writeFileSync(f, out); edited++; }
}
console.log('rewrote', edited, 'files');

// Rename changed /_astro files, cascading through whatever references them.
const renamed = new Map();
const bump = (f) => f.replace(/(-c\d+)?(\.(?:js|css))$/, (m, v, ext) => `-c${v ? +v.slice(2) + 1 : 1}${ext}`);
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
  const files = [...pages, ...fxFiles, ...fs.readdirSync(ASTRO).map((f) => path.join(ASTRO, f))];
  for (const p of files) {
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    let t = s;
    for (const f of todo) t = t.split(f).join(renamed.get(f));
    if (t !== s) fs.writeFileSync(p, t);
  }
}
console.log('renamed', renamed.size, 'astro files');

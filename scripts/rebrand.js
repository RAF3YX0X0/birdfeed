// One-off rebrand of the cloned site from Feedbird to MadMarketing.
//
// The visible text lives in two places that must agree, or React throws a
// hydration mismatch: the pre-rendered HTML and the JavaScript bundles that
// re-render it. So every rule below is applied to both, identically:
//   - the name, as a whole word ("Feedbird" → "MadMarketing", also the
//     upper-case and lower-case spellings used in labels); identifiers such
//     as `FeedbirdProPage` and every URL / e-mail / file path are left alone
//   - logo files, the inline logo icon and the favicon links
// Bundles whose contents change (directly, or because a bundle they import
// was renamed) get a new file name, since /_astro is served with an
// immutable cache and browsers would otherwise keep the old copy.
//
//   node scripts/rebrand.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASTRO = path.join(ROOT, '_astro');
const OLD_ICON = 'M4 19c2-9 8-13 16-15-1 4-2 7-4 9l3 1c-3 4-6 6-10 6 0-2 1-3 2-4-3 1-5 2-7 3z';
// The MadMarketing mark (an M with a spark) as a 24×24 path.
const NEW_ICON = 'M2.63 5.09L2.63 20L6.30 20L6.30 10.82L9.49 19.96L12.35 19.96L15.56 10.82L15.56 20L19.24 20L19.24 5.09L14.37 5.09L10.94 15.25L7.48 5.09ZM21 1.4C21.5 3.5 21.5 3.5 23.6 4C21.5 4.5 21.5 4.5 21 6.6C20.5 4.5 20.5 4.5 18.4 4C20.5 3.5 20.5 3.5 21 1.4Z';

function rebrandText(s) {
  return s
    .replace(/<link rel="icon" type="image\/jpeg" href="\/assets\/feedbird-mark\.jpg">/g,
      '<link rel="icon" type="image/svg+xml" href="/assets/madmarketing-mark-v2.svg"><link rel="icon" type="image/png" sizes="32x32" href="/assets/madmarketing-icon-32-v2.png">')
    .replace(/<link rel="apple-touch-icon" href="\/assets\/feedbird-mark\.jpg">/g, '<link rel="apple-touch-icon" href="/assets/madmarketing-apple-touch-v2.png">')
    .replace(/\/assets\/feedbird-logo\.svg/g, '/assets/madmarketing-logo-v2.svg')
    .replace(/\/assets\/feedbird-mark\.jpg/g, '/assets/madmarketing-mark-v2.png')
    .split(OLD_ICON).join(NEW_ICON)
    .replace(/\bFeedbird\b/g, 'MadMarketing')
    .replace(/\bFEEDBIRD\b/g, 'MADMARKETING')
    // Lower-case only as a word in running text ("// why feedbird"), never in
    // a domain, path, handle or code identifier (`feedbird`).
    .replace(/(^|[\s>])feedbird(?=[\s<`,!?:;)]|\.(?:\s|<|`|$)|$)/gm, '$1madmarketing');
}

function walk(dir, test, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(p)) out.push(p);
  }
  return out;
}

// 1. Text + assets in pages, our FX layer and the bundles.
const pages = walk(ROOT, (p) => p.endsWith('.html') && !p.includes(`${path.sep}_astro${path.sep}`));
const fxFiles = walk(path.join(ROOT, 'fx'), (p) => /\.(js|css|html)$/.test(p));
const bundles = fs.readdirSync(ASTRO).filter((f) => f.endsWith('.js')).map((f) => path.join(ASTRO, f));
const original = new Map();
let edited = 0;
for (const f of [...pages, ...fxFiles, ...bundles]) {
  const src = fs.readFileSync(f, 'utf8');
  original.set(f, src);
  const out = rebrandText(src);
  if (out !== src) { fs.writeFileSync(f, out); edited++; }
}
console.log('rewrote', edited, 'files');

// 2. Give changed bundles new names, cascading through their importers.
const renamed = new Map(); // old base name → new base name
for (;;) {
  const now = fs.readdirSync(ASTRO).filter((f) => f.endsWith('.js'));
  const todo = now.filter((f) => !/-mm\.js$/.test(f) && fs.readFileSync(path.join(ASTRO, f), 'utf8') !== original.get(path.join(ASTRO, f)));
  if (!todo.length) break;
  for (const f of todo) {
    const next = f.replace(/\.js$/, '-mm.js');
    fs.renameSync(path.join(ASTRO, f), path.join(ASTRO, next));
    renamed.set(f, next);
  }
  // Point every reference at the new names.
  const files = [...pages, ...fxFiles, ...fs.readdirSync(ASTRO).map((f) => path.join(ASTRO, f))];
  for (const p of files) {
    if (!fs.existsSync(p)) continue;
    let s = fs.readFileSync(p, 'utf8');
    const before = s;
    for (const f of todo) s = s.split(f).join(renamed.get(f));
    if (s !== before) {
      fs.writeFileSync(p, s);
      // A not-yet-renamed bundle just changed: compare against its original.
      if (p.startsWith(ASTRO) && !original.has(p)) original.set(p, before);
    }
  }
}
console.log('renamed', renamed.size, 'bundles:', [...renamed.values()].join(' '));

// Re-points links left over from the original site, in the pages, our FX
// partials and the React bundles alike (so React hydrates the same markup it
// was served). Bundles whose contents change get a new file name, cascading
// to whatever imports them, because /_astro is served with an immutable cache.
//
//   node scripts/relink.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const ASTRO = path.join(ROOT, '_astro');
const LINKS = {
  'https://clients.feedbird.com/login': '/login/',
};

function walk(dir, test, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor', 'dist'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(p)) out.push(p);
  }
  return out;
}
const relink = (s) => Object.entries(LINKS).reduce((t, [from, to]) => t.split(from).join(to), s);

const pages = walk(ROOT, (p) => p.endsWith('.html') && !p.includes(`${path.sep}_astro${path.sep}`));
const bundles = fs.readdirSync(ASTRO).filter((f) => f.endsWith('.js')).map((f) => path.join(ASTRO, f));
const original = new Map();
let edited = 0;
for (const f of [...pages, ...bundles]) {
  const src = fs.readFileSync(f, 'utf8');
  original.set(f, src);
  const out = relink(src);
  if (out !== src) { fs.writeFileSync(f, out); edited++; }
}

// Rename changed bundles (name-r<hash>.js), cascading through importers.
const renamed = new Map();
for (;;) {
  const todo = fs.readdirSync(ASTRO).filter((f) => f.endsWith('.js') && !renamed.has(f) && ![...renamed.values()].includes(f)
    && fs.readFileSync(path.join(ASTRO, f), 'utf8') !== original.get(path.join(ASTRO, f)));
  if (!todo.length) break;
  for (const f of todo) {
    const body = fs.readFileSync(path.join(ASTRO, f), 'utf8');
    const next = f.replace(/(-r[0-9a-f]{6})?\.js$/, `-r${crypto.createHash('sha256').update(body).digest('hex').slice(0, 6)}.js`);
    fs.renameSync(path.join(ASTRO, f), path.join(ASTRO, next));
    renamed.set(f, next);
  }
  for (const p of [...pages, ...fs.readdirSync(ASTRO).map((f) => path.join(ASTRO, f))]) {
    if (!fs.existsSync(p)) continue;
    let s = fs.readFileSync(p, 'utf8');
    const before = s;
    for (const f of todo) s = s.split(f).join(renamed.get(f));
    if (s !== before) {
      fs.writeFileSync(p, s);
      if (p.startsWith(ASTRO) && !original.has(p)) original.set(p, before);
    }
  }
}
console.log(`rewrote ${edited} files; renamed ${renamed.size} bundle(s): ${[...renamed].map(([a, b]) => `${a} → ${b}`).join(', ')}`);

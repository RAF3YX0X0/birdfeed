// /_astro files are cached as immutable, so one whose content has changed
// since the last commit needs a new name: this bumps its -bN suffix and
// rewrites every reference to it, and repeats until nothing differs (a file
// that imports a renamed one has changed too). Run it after anything that
// edits the bundles (scripts/client-facts.js, scripts/brand.js).
//
//   node scripts/rename-changed-bundles.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ASTRO = path.join(ROOT, '_astro');
// Line endings aren't a change (a checkout on Windows can rewrite them).
const norm = (s) => s.replace(/\r\n/g, '\n');
const committed = (f) => {
  try {
    return norm(execSync(`git show "HEAD:_astro/${f}"`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null; // new since the last commit: its name is already new
  }
};
const bump = (f) => (/-b\d+\.(js|css)$/.test(f) ? f.replace(/-b(\d+)(\.(?:js|css))$/, (m, n, ext) => `-b${+n + 1}${ext}`) : f.replace(/(\.(?:js|css))$/, '-b1$1'));
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git', 'Portfolio', 'work'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js|css|json)$/.test(p)) out.push(p);
  }
  return out;
};

const done = new Set();
let total = 0;
for (;;) {
  const todo = fs.readdirSync(ASTRO).filter((f) => {
    if (!/\.(js|css)$/.test(f) || done.has(f)) return false;
    const was = committed(f);
    return was !== null && was !== norm(fs.readFileSync(path.join(ASTRO, f), 'utf8'));
  });
  if (!todo.length) break;
  const map = new Map(todo.map((f) => [f, bump(f)]));
  for (const [a, b] of map) {
    fs.renameSync(path.join(ASTRO, a), path.join(ASTRO, b));
    done.add(b);
  }
  for (const p of walk(ROOT)) {
    const s = fs.readFileSync(p, 'utf8');
    let t = s;
    for (const [a, b] of map) t = t.split(a).join(b);
    if (t !== s) fs.writeFileSync(p, t);
  }
  total += map.size;
  console.log('renamed', [...map.values()].join(' '));
}
console.log(`${total} bundle(s) renamed`);

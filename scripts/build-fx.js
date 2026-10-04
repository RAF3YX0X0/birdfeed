// Production build of the FX layer, so pages load as little as possible:
//   - fx/fx.js and everything it imports → one minified ES module plus lazy
//     chunks (each 3D scene, Three.js, the portfolio data), loaded on demand,
//   - GSAP + ScrollTrigger + Lenis → one deferred script,
//   - fx/boot.js → minified, for inject-fx.js to inline in <head>,
// all in fx/dist/ under content-hashed names (served with a one-year
// immutable cache, see vercel.json), listed in fx/dist/manifest.json. Then it
// runs inject-fx.js, which points every page at them and bundles each page's
// stylesheets into one minified file.
//
// After editing anything in fx/:
//   NODE_PATH=<dir with esbuild> node scripts/build-fx.js
// (inject-fx.js on its own falls back to the unbundled sources if there's no
// manifest.)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const FX = path.join(ROOT, 'fx');
const DIST = path.join(FX, 'dist');
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// 1. The FX modules.
const result = esbuild.buildSync({
  entryPoints: [path.join(FX, 'fx.js')],
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  outdir: DIST,
  entryNames: 'fx-[hash]',
  chunkNames: 'c-[hash]',
  legalComments: 'none',
  metafile: true,
  logLevel: 'warning',
});
const outputs = result.metafile.outputs;
// (Lazy chunks are entry points too; this is the one for fx/fx.js itself.)
const entryOut = Object.keys(outputs).find((k) => (outputs[k].entryPoint || '').split(path.sep).join('/').split('\\').join('/').endsWith('fx/fx.js'));
const rel = (k) => '/' + path.relative(ROOT, path.resolve(ROOT, k)).split(path.sep).join('/');
// Chunks the entry imports up front (worth a modulepreload); the rest are lazy.
const eager = outputs[entryOut].imports.filter((i) => i.kind === 'import-statement').map((i) => rel(i.path));

// 2. Animation libraries (already minified), in load order.
const vendor = ['gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js']
  .map((f) => fs.readFileSync(path.join(FX, 'vendor', f), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, ''))
  .join(';\n');
const vendorName = `vendor-${hash(vendor)}.js`;
fs.writeFileSync(path.join(DIST, vendorName), vendor);

// 3. Boot (inlined by inject-fx.js).
const boot = esbuild.transformSync(fs.readFileSync(path.join(FX, 'boot.js'), 'utf8'), { minify: true, target: 'es2015' }).code.trim();

const manifest = { js: rel(entryOut), eager, vendor: `/fx/dist/${vendorName}`, boot };
fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 1));

const size = (f) => Math.round(fs.statSync(f).size / 1024);
const files = fs.readdirSync(DIST).filter((f) => f.endsWith('.js'));
console.log(`fx/dist: entry ${size(path.join(ROOT, entryOut.replace(/^\//, '')))}KB, ${eager.length} eager + ${files.length - eager.length - 2} lazy chunks, vendor ${size(path.join(DIST, vendorName))}KB`);

// 4. Pages.
execFileSync(process.execPath, [path.join(__dirname, 'inject-fx.js')], { stdio: 'inherit', env: process.env });

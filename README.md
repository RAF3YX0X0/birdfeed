# MADMarketing website

The MADMarketing site: a static build, deployed on Vercel. It began as a clone of
feedbird.com and has been rebuilt around MADMarketing's own services, prices, clients
and case studies. Nothing of the original agency's content is published any more; what
remains of the clone is the page shell and a set of hidden React sections that our own
sections sit in front of.

```bash
npm start          # the local dev server on http://localhost:3000
```

The dev server is for local work only. It is in `.vercelignore`, because deploying it
would make Vercel run the site as a function instead of serving static files.

---

## Where things live

The root holds only the site itself: one folder per URL, plus the folders the pages
fetch from. Everything that isn't served lives in one of two places, `_client/` or
`_legacy/`.

| Folder | What it is | Deployed |
|---|---|---|
| `index.html`, `about/`, `services/`, … | the pages themselves, one `index.html` per URL | yes |
| `fx/` | our own design layer: section markup (`fx/partials/`), styles, behaviour, 3D scenes (`fx/three/`) | `fx/dist` and assets, not `fx/partials` |
| `fx/dist/` | the built, minified, content-hashed CSS and JS the pages load | yes |
| `work/` | our clients' real media: posts, reels, site shots, and the `.preview.mp4` copies the grids play | yes |
| `assets/`, `fonts/` | MADMarketing's logos and marks; Satoshi, self-hosted | yes |
| `_astro/` | the clone's compiled React chunks | only the ones still loaded |
| `api/` | the challenge application endpoint | yes |
| `scripts/` | every generator and build step, plus `validate_clone.js` | no |
| `_client/` | what the client sent: `portfolio/` (≈1.7GB of source media), `stats/` (the exports behind the published figures), `brief/`, `references/`, `more-content/` | no — gitignored, local only |
| `_legacy/` | the cloned agency's media: `px/`, `img/`, `ugc/`, `vx/`, `lp/`, `reviews/` and the hash-named page images | no — in the repo, never deployed |

Loose files at the root are only the ones that have to be there: `index.html`,
`robots.txt`, `sitemap.xml`, `og-banner.png`, `slider-arrows.js` (served at that
path), `server.js`, and the config files.

### What is not deployed, and why

`.vercelignore` keeps about 2GB out of every deployment, leaving 79MB in 369 files.
None of it is guesswork: a crawler visits all 35 pages, scrolls each one, works every
portfolio filter, opens a quick view and the case-study overlay, and records every URL
the site actually asks for. Anything excluded is absent from that list, and the check
is re-run after every change of this kind.

The cloned sections that referenced `_legacy/` are hidden and no longer hydrate, and
`scripts/optimize-pages.js` strips the `src` and `poster` from their media, so nothing
asks for any of it.

`og-banner.png` stays, even though no browser requests it: it is the `og:image` in
every page's meta tags, which Facebook, LinkedIn and WhatsApp fetch.

Both folders stay in the repository. Removing them from the working tree would not
shrink it, because git keeps the history either way.

---

## The build

Run from the project root. Order matters where a step reads what an earlier one wrote.

```bash
# 1. Content and sections (each writes partials under fx/partials/ or whole pages)
node scripts/build-previews.js       # work/*.preview.mp4 — needs ffmpeg on PATH
node scripts/build-work.js           # portfolio data, case cards, client roster
node scripts/build-cases.js          # the case-studies slider
node scripts/build-home.js           # what we sell, the plans, the real cost
node scripts/build-stats.js          # "Real accounts, real numbers"
node scripts/build-service-pages.js  # the nine service pages, /services/, /pricing/
node scripts/build-legal-pages.js    # /privacy/, /terms/, /refund/
node scripts/build-landing.js        # /free-local-seo/ and /trial-terms/
node scripts/build-static-pages.js   # /careers/, /cookie-policy/

# 2. Steps that render the live site, so the server above must be running
node scripts/build-heroes.js         # inner-page heroes
node scripts/build-industries.js     # the ten industry pages
node scripts/build-about.js          # /about/

# 3. Always last, in this order
node scripts/build-fx.js             # bundles fx/ into fx/dist (needs esbuild)
node scripts/optimize-pages.js       # injects the FX layer, titles, SEO, sitemap
```

Editing anything under `fx/` has no effect on the pages until `build-fx.js` and
`optimize-pages.js` have run.

### The single sources

Change these rather than the generated output:

- `scripts/offer-data.js` — every service, plan and price.
- `scripts/work-data.js` — every client, case study and piece of media.
- `scripts/stats-data.js` — the delivered figures, with the rules that keep them honest.
- `scripts/industry-content.js`, `industry-faq.js` — the industry pages.

---

## How a page is put together

Each page is still the cloned HTML. `scripts/inject-fx.js` adds our stylesheet and
script to `<head>` and splices our own sections into the body between
`<!-- fx:name:start -->` markers. The clone's own sections stay in the DOM, hidden by
CSS, so nothing has to be cut out of markup we don't control.

Those hidden React sections are not hydrated. They render nothing visible, so letting
them boot cost 99 requests and 21MB across the site in chunks, the other agency's
images and its review posters. `inject-fx.js` renames the two attributes Astro reads,
which leaves the markup exactly where it is while stopping the component ever being
fetched or run. Two pages are exceptions, listed as `REACT_PAGES` in that file: on
`/about/` and `/book-demo/` the 3D explainer finds its place by matching text those
sections render.

Every change of this kind was checked by snapshotting all 35 pages before and after —
what each one shows, its height, its text length, its broken images — and comparing.

## Speed

- Page weight and request count are measured per page, not assumed.
- The 3D engine (~730KB) is fetched only on the three pages that draw in 3D, and only
  after load, on idle, and never on a metered or slow connection.
- Portfolio and case-card videos play a silent 10-second 400px preview
  (`scripts/build-previews.js`), about 220KB instead of up to 9MB. The full file backs
  the quick-view player and the case studies.
- Video tiles carry their poster as a real image, so a picture is on screen before the
  clip has buffered, and they start one after another rather than all at once.
- `vercel.json` sets long cache lifetimes for `/fonts/`, `/_astro/`, `/fx/dist/`,
  `/assets/`, `/img/`, `/work/` and `/reviews/`, and keeps `work/media.json` fresh.

## Still to do

See the client questions parked in the project's notes: GA4 and Meta Pixel IDs and a
consent banner, the form's delivery (a Resend key or a CRM webhook — see
`api/free-local-seo.js`), a live-chat tool, and a lawyer's review of the legal pages.

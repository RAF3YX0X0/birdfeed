// Builds the case studies page's fullscreen slider (fx/cases.js, fx/cases.css)
// from the case studies already in the site's data (the React bundle):
//   - fx/partials/heroes/case-studies.html: the slider markup, one slide per
//     case (served as the page's hero, so it's in the HTML from the start),
//     plus a <style> hiding the original hero, featured story and grid (left
//     in the DOM so React hydrates as usual),
//   - fx/cases.json: the full stories, opened from each slide's "Case study".
// build-heroes.js skips this page so a re-run doesn't overwrite the slider.
//
//   node scripts/build-cases.js && node scripts/inject-fx.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BUNDLE_DIR = path.join(ROOT, '_astro');

// ---- read the cases out of the bundle ------------------------------------------
function readCases() {
  for (const f of fs.readdirSync(BUNDLE_DIR).filter((n) => n.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(BUNDLE_DIR, f), 'utf8');
    const start = src.indexOf('[{slug:`');
    if (start === -1 || !src.includes('headline:`', start)) continue;
    // Walk to the matching bracket, skipping template literals.
    let depth = 0;
    let i = start;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '`') { i = src.indexOf('`', i + 1); continue; }
      if (c === '[' || c === '{') depth++;
      else if ((c === ']' || c === '}') && --depth === 0) break;
    }
    return vm.runInNewContext(`(${src.slice(start, i + 1)})`);
  }
  throw new Error('case studies not found in /_astro');
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const THEMES = ['stone', 'blue', 'ink', 'paper'];

// Client name on one or two lines, split where the longer line is shortest.
function lines(name) {
  const w = name.split(' ');
  if (name.length <= 10 || w.length === 1) return [name];
  let best = null;
  for (let k = 1; k < w.length; k++) {
    const a = w.slice(0, k).join(' ');
    const b = w.slice(k).join(' ');
    if (!best || Math.max(a.length, b.length) < Math.max(best[0].length, best[1].length)) best = [a, b];
  }
  return best;
}

// The figure written large across the slide: a short number if there is one.
function headlineMetric(metrics) {
  const digits = metrics.filter((m) => /\d/.test(m.value));
  return digits.find((m) => m.value.length >= 2 && m.value.length <= 9)
    || digits[0]
    || [...metrics].sort((a, b) => a.value.length - b.value.length)[0];
}

const initials = (name) => name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function slide(c, i) {
  const ls = lines(c.client);
  const fit = Math.min(1, 10 / Math.max(...ls.map((l) => l.length)));
  const big = headlineMetric(c.metrics);
  const bigFit = Math.min(1, 6 / big.value.length);
  const services = c.services.join(' + ');
  return `
      <li class="csx__slide" data-theme="${THEMES[i % THEMES.length]}" data-slug="${esc(c.slug)}" style="--fit:${fit.toFixed(2)};--bigfit:${bigFit.toFixed(2)}">
        <div class="csx__visual" aria-hidden="true">
          <span class="csx__disc"></span>
          <div class="csx__device"><div class="csx__screen">
            <div class="csx__who"><span class="csx__avatar">${esc(initials(c.client))}</span><span><b>${esc(c.client)}</b><small>${esc(c.industry)}</small></span></div>
            <p class="csx__k">Results</p>
            <ul class="csx__stats">${c.metrics.slice(0, 3).map((m) => `<li><b>${esc(m.value)}</b><span>${esc(m.label)}</span></li>`).join('')}</ul>
            <p class="csx__svc">${c.services.map((s) => `<span>${esc(s)}</span>`).join('')}</p>
          </div><span class="csx__notch"></span></div>
        </div>
        <p class="csx__num">/ ${pad(i + 1)}</p>
        <div class="csx__text">
          <h2 class="csx__title">${ls.map((l) => `<span class="csx__line"><span>${esc(l)}</span></span>`).join('')}</h2>
          <p class="csx__sr">${esc(c.headline)}</p>
          <p class="csx__meta">${esc(services)} <span>/ ${esc(c.industry)}</span></p>
        </div>
        <p class="csx__big" aria-hidden="true"><span>${esc(big.value)}</span><small>${esc(big.label)}</small></p>
        <a class="csx__link" href="#${esc(c.slug)}" data-case="${esc(c.slug)}" aria-label="Read the ${esc(c.client)} case study">Case study ${ARROW}</a>
      </li>`;
}

const cases = readCases();
// The featured story leads, then the rest in the site's order.
cases.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

const hide = 'astro-island[component-export="CaseIndex"] > div:nth-child(1) > div:nth-child(3) > section:is(:nth-child(1), :nth-child(2), :nth-child(3))';
const html = `<style>${hide} { display: none !important; }</style>
<section class="csx" aria-label="Case studies" style="--n:${cases.length}">
  <h1 class="csx__sr">Case studies: success stories from businesses like yours</h1>
  <div class="csx__stage">
    <div class="csx__frame" data-theme="${THEMES[0]}">
      <ol class="csx__slides">${cases.map(slide).join('')}
      </ol>
      <div class="csx__ui">
        <button class="csx__all" type="button" aria-label="All case studies"><i></i><i></i></button>
        <div class="csx__pager">
          <button class="csx__prev" type="button">Prev</button>
          <span class="csx__track"><i></i></span>
          <button class="csx__next" type="button">Next</button>
        </div>
      </div>
    </div>
  </div>
</section>
`;
fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'heroes', 'case-studies.html'), html);

const data = cases.map(({ slug, client, industry, headline, summary, services, timeline, team, metrics, quote, body }) => ({ slug, client, industry, headline, summary, services, timeline, team, metrics, quote, body }));
fs.writeFileSync(path.join(ROOT, 'fx', 'cases.json'), JSON.stringify(data));
console.log(`${cases.length} case studies → fx/partials/heroes/case-studies.html, fx/cases.json`);

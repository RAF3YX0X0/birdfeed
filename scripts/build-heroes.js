// Generates the new-design hero for every inner page into fx/partials/heroes/.
//
// Each page's cloned hero is read from its server markup (loaded with JavaScript
// off, so it's exactly what React hydrates against): label, headline, subtitle,
// buttons, checks, small print and the visual beside the copy. From those it
// writes one of two heroes in the homepage's design:
//   - "hx": the homepage hero itself (phone rising into a strip of cards) for
//     pages whose hero is a wall of real videos / images,
//   - "ph": centred copy over the blue arch, with the page's own visual in a
//     frame that rises and flattens as you scroll.
// The partial also carries a <style> that hides the original (left in the DOM,
// so React hydrates as usual). On pages where the hero section holds more than
// the copy (the pricing builder, the live calendar, the legal text) only the
// original copy block is hidden and the rest stays.
//
//   node server.js &   (the site must be served on :3000)
//   NODE_PATH=<dir with puppeteer-core> node scripts/build-heroes.js [slug...]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'fx', 'partials', 'heroes');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MEDIA = ['short-form-video', 'ugc-videos', 'social-media-management'];
const PARTIAL = ['pricing', 'book-demo', 'privacy', 'refund', 'terms'];
// Pages with their own hero partial, made by another script (left alone here).
const OWN = ['case-studies', 'pricing', 'about']; // scripts/build-cases.js, build-pricing.js, build-about.js

function pages() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', 'fx', '.git', 'scripts', '_astro'].includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html' && d !== ROOT) out.push(path.relative(ROOT, d).split(path.sep).join('/'));
    }
  })(ROOT);
  return out.sort();
}

// Runs in the page: pull the hero apart.
function extract(mode) {
  // On a re-run the page already carries a generated hero and the style that
  // hides the original: drop both so the original can be measured again.
  document.querySelectorAll('section.ph, section.hx--page').forEach((n) => {
    const st = n.previousElementSibling;
    if (st && st.tagName === 'STYLE') st.remove();
    n.remove();
  });
  const island = document.querySelector('astro-island');
  const sec = island && island.querySelector('section');
  if (!sec) return null;
  const h1 = sec.querySelector('h1');
  if (!h1) return null;
  const text = (n) => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const pathOf = (el) => {
    const parts = [];
    for (let n = el; n && n !== island; n = n.parentElement) {
      parts.unshift(`${n.tagName.toLowerCase()}:nth-child(${[...n.parentElement.children].indexOf(n) + 1})`);
    }
    return `astro-island[component-export="${island.getAttribute('component-export')}"] > ${parts.join(' > ')}`;
  };

  // The copy column: the ancestor of the h1 that sits beside the visual.
  let copy = h1, visual = null;
  for (let n = h1; n && n !== sec; n = n.parentElement) {
    const p = n.parentElement;
    const r = n.getBoundingClientRect();
    const sibs = [...p.children].filter((k) => k !== n && !/^(STYLE|SCRIPT)$/.test(k.tagName));
    const beside = sibs.filter((k) => {
      const q = k.getBoundingClientRect();
      return q.width > 200 && q.height > 150 && q.top < r.bottom && q.bottom > r.top && (q.left >= r.right - 4 || q.right <= r.left + 4);
    });
    if (beside.length) {
      copy = n;
      visual = beside.sort((a, b) => b.getBoundingClientRect().height * b.getBoundingClientRect().width - a.getBoundingClientRect().height * a.getBoundingClientRect().width)[0];
      break;
    }
  }
  if (!visual) {
    // Single column: the copy is the h1's container while it stays short.
    copy = h1;
    for (let n = h1.parentElement; n && n !== sec && text(n).length < 700; n = n.parentElement) copy = n;
  }

  const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  const leaves = [...copy.querySelectorAll('*')].filter((n) => !n.children.length || [...n.children].every((k) => k.tagName === 'SVG' || k.tagName === 'svg' || (k.tagName === 'SPAN' && !k.textContent.trim())));

  // Label: the short text right above the headline (not a breadcrumb).
  const labels = leaves.filter((n) => before(n, h1) && copy.contains(n) && !h1.contains(n) && text(n).length >= 2 && text(n).length <= 60 && !/\/\s*\S/.test(text(n).replace(/^\/\//, '')));
  const eyebrow = labels.length ? text(labels[labels.length - 1]).replace(/^\/\/\s*/, '') : '';

  // Headline: keep line breaks; the blue span (if any) becomes the serif accent.
  const clone = h1.cloneNode(true);
  clone.querySelectorAll('span').forEach((s) => {
    const blue = /3B5BFF|59, 91, 255/i.test(s.getAttribute('style') || '');
    if (blue) { const em = document.createElement('em'); em.innerHTML = s.innerHTML; s.replaceWith(em); }
    else s.replaceWith(...s.childNodes);
  });
  clone.querySelectorAll('*').forEach((n) => { [...n.attributes].forEach((a) => n.removeAttribute(a.name)); });
  let title = clone.innerHTML.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  if (!/<em>/.test(title)) {
    // No accent: the last line, or the last two words, go in the serif italic.
    const lines = title.split(/<br\s*\/?>/i);
    let last = lines.pop().trim();
    const w = last.split(' ');
    if (lines.length && w.length <= 4) last = `<em>${last}</em>`;
    else if (w.length > 1) last = `${w.slice(0, -2).join(' ')} <em>${w.slice(-2).join(' ')}</em>`.trim();
    title = lines.concat(last).join('<br>');
  }

  const after = (n) => before(h1, n) && !h1.contains(n);
  const scope = copy === h1 ? sec : copy;
  const sub = [...scope.querySelectorAll('p')].filter(after).map(text).find((t) => t.length > 40) || '';
  const ctas = [...scope.querySelectorAll('a[href]')].filter(after).map((a) => ({ href: a.getAttribute('href'), label: text(a).replace(/[→↗]/g, '').trim() })).filter((c) => c.label && c.label.length < 40).slice(0, 2);
  const checks = leaves.filter((n) => after(n) && n.querySelector && n.querySelector('svg') && text(n).length > 6 && text(n).length < 60 && !n.closest('a')).map(text).slice(0, 4);
  const noteEl = leaves.filter(after).find((n) => /no contracts|cancel anytime|money.back|guarantee/i.test(text(n)) && text(n).length < 120);
  const note = noteEl ? text(noteEl.parentElement && text(noteEl.parentElement).length < 140 ? noteEl.parentElement : noteEl).replace(/\s*·\s*/g, ' · ') : '';
  const crumbs = [...copy.querySelectorAll('a[href]')].filter((a) => before(a, h1) && text(a).length < 30).map((a) => ({ href: a.getAttribute('href'), label: text(a) }));

  let visualHtml = '', media = [];
  if (visual && mode !== 'partial') {
    const v = visual.cloneNode(true);
    v.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    v.querySelectorAll('.cal-placeholder').forEach((n) => { const d = document.createElement('div'); d.className = 'fx-cal-slot'; d.style.cssText = 'height:100%;width:100%'; n.replaceWith(d); });
    visualHtml = v.outerHTML.replace(/<!--[\s\S]*?-->/g, '');
    visual.querySelectorAll('video').forEach((vd) => {
      const s = vd.querySelector('source');
      const src = vd.getAttribute('src') || (s && s.getAttribute('src'));
      if (src) media.push({ type: 'video', src, poster: vd.getAttribute('poster') || '' });
    });
    visual.querySelectorAll('img').forEach((im) => { const src = im.getAttribute('src'); if (src && !/avatar|logo|\.svg$/i.test(src) && im.naturalWidth > 120) media.push({ type: 'img', src }); });
  }
  // No visual beside the copy (single-column heroes, or the visual sits below
  // it): only the copy block is replaced, everything else in the section stays.
  // (Unless nothing but decoration would be left, like a background photo.)
  // (Text the new hero shows anyway doesn't count as something left.)
  let restText = text(sec).replace(text(copy), '');
  [sub, eyebrow, note, ...ctas.map((c) => c.label)].forEach((t) => { if (t) restText = restText.replace(t, ''); });
  const rest = restText.replace(/\s+/g, '').length;
  const keepsSomething = rest > 40 || sec.querySelector('input, iframe, video, .cal-placeholder, [class*="builder"]');
  const partial = mode === 'partial' || (!visual && keepsSomething);
  return {
    exportName: island.getAttribute('component-export'),
    hide: pathOf(partial ? copy : sec),
    // A "trusted by 20,000+" label would repeat the trust line under the buttons.
    eyebrow: /20,000|trusted by/i.test(eyebrow) ? '' : eyebrow,
    title, sub, ctas, checks, note, crumbs, visualHtml, media,
  };
}

const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FACES = '<span class="hx__faces" aria-hidden="true">' + [1, 2, 3, 4].map((i) => `<img src="/fx/media/avatar-${i}.webp" alt="" width="48" height="48">`).join('') + '</span>';
const ctasHtml = (ctas, cls) => {
  const list = ctas.length ? ctas : [{ href: '/pricing/', label: 'See plans & pricing' }, { href: '/book-demo/', label: 'Book a demo' }];
  return `<div class="${cls}">${list.map((c, i) => `<a class="hx-btn hx-btn--${i ? 'white' : 'blue'}" href="${esc(c.href)}">${esc(c.label)}</a>`).join('')}</div>`;
};

function pageHero(d) {
  return `<section class="ph${d.visualHtml ? '' : ' ph--plain'}" aria-label="Introduction">
  <div class="ph__arch" aria-hidden="true"></div>
  <div class="ph__copy">
    ${d.crumbs.length ? `<nav class="ph__crumbs" aria-label="Breadcrumb">${d.crumbs.map((c) => `<a href="${esc(c.href)}">${esc(c.label)}</a>`).join('<span aria-hidden="true">/</span>')}</nav>` : ''}
    ${d.eyebrow ? `<span class="sx-eyebrow"><i></i>${esc(d.eyebrow)}</span>` : ''}
    <h1 class="ph__title">${d.title}</h1>
    ${d.sub ? `<p class="ph__sub">${esc(d.sub)}</p>` : ''}
    ${ctasHtml(d.ctas, 'ph__ctas')}
    ${d.checks.length ? `<ul class="ph__checks">${d.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    <p class="ph__trust">${FACES}<span><b>4.6/5</b> from 800+ reviews · <b>20,000+</b> businesses served</span></p>
  </div>
  ${d.visualHtml ? `<div class="ph__stage" aria-hidden="true"><div class="ph__frame">${d.visualHtml}</div></div>` : ''}
</section>`;
}

function mediaHero(d) {
  const media = d.media.length ? d.media : [{ type: 'img', src: '/fx/media/card-1.webp' }];
  const phone = media.find((m) => m.type === 'video') || media[0];
  const rest = media.filter((m) => m !== phone);
  const cards = [];
  for (let i = 0; cards.length < 10 && rest.length; i++) cards.push(rest[i % rest.length]);
  const card = (m) => (m.type === 'video'
    ? `<div class="hx-card"><video muted loop playsinline preload="none"${m.poster ? ` poster="${esc(m.poster)}"` : ''}><source src="${esc(m.src)}" type="video/mp4"></video></div>`
    : `<div class="hx-card"><img src="${esc(m.src)}" alt="" loading="lazy" decoding="async"></div>`);
  const lines = d.title.split(/<br\s*\/?>/i).map((l) => `<span class="hx__line">${l.trim()}</span>`).join(' ');
  const screen = phone.type === 'video'
    ? `<video autoplay muted loop playsinline preload="auto"${phone.poster ? ` poster="${esc(phone.poster)}"` : ''}><source src="${esc(phone.src)}" type="video/mp4"></video>`
    : `<img src="${esc(phone.src)}" alt="" style="width:100%;height:100%;object-fit:cover">`;
  return `<section class="hx hx--page" aria-label="Introduction">
  <div class="hx__stage">
    <div class="hx__arch" aria-hidden="true"><div class="hx__arch-in"></div></div>
    <div class="hx__copy">
      <div class="hx__badge">${FACES}<span>${d.eyebrow ? `${esc(d.eyebrow)} · ` : ''}<b>20,000+</b> businesses</span></div>
      <h1 class="hx__title">${lines}</h1>
      ${d.sub ? `<p class="hx__sub">${esc(d.sub)}</p>` : ''}
      ${ctasHtml(d.ctas, 'hx__ctas')}
    </div>
    <div class="hx__strip" aria-hidden="true">${cards.map(card).join('')}</div>
    <div class="hx__phone"><div class="hx__phone-in"><div class="hx__screen">${screen}</div><span class="hx__island"></span></div></div>
  </div>
</section>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const list = (only.length ? only : pages()).filter((slug) => !OWN.includes(slug));
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const p = await b.newPage();
  await p.setJavaScriptEnabled(false);
  await p.setViewport({ width: 1440, height: 900 });
  for (const slug of list) {
    const mode = MEDIA.includes(slug) ? 'media' : PARTIAL.includes(slug) ? 'partial' : 'page';
    await p.goto(`http://localhost:3000/${slug}/`, { waitUntil: 'load', timeout: 60000 });
    const d = await p.evaluate(extract, mode);
    if (!d) { console.log('skip (no hero):', slug); continue; }
    const hero = mode === 'media' ? mediaHero(d) : pageHero({ ...d, visualHtml: mode === 'partial' ? '' : d.visualHtml });
    const html = `<style>${d.hide} { display: none !important; }</style>\n${hero}\n`;
    fs.writeFileSync(path.join(OUT, slug.replace(/\//g, '__') + '.html'), html);
    console.log(mode.padEnd(8), slug.padEnd(44), `"${d.eyebrow}"`, '|', d.title.replace(/<[^>]+>/g, '').slice(0, 40), '| ctas', d.ctas.length, 'checks', d.checks.length, 'visual', d.visualHtml.length, 'media', d.media.length);
  }
  await b.close();
})();

// Inner pages: swap the cloned sections they share with the homepage (trust
// strip, how it works, portfolio, guarantee, cost comparison, case studies,
// reviews, final CTA) for the rebuilt homepage versions.
//
// scripts/inject-fx.js embeds the rebuilt sections each page needs in an inert
// <template id="fx-shared">. Here each original is found by its heading, and
// once it's safe to touch (React has hydrated it, or the page's component code
// is missing so it never will) the rebuilt section goes in its place and the
// original is hidden (kept in the DOM, so React is unaffected).

const SWAPS = [
  { cls: 'tr', re: /publishing everywhere your customers/i },
  { cls: 'hw', re: /receive full deliverables/i },
  { cls: 'pf', re: /truly great content/i },
  { cls: 'gx', re: /not happy with your first batch/i },
  { cls: 'cx', re: /every other way costs more/i },
  { cls: 'pj', re: /real businesses\.?\s*real results/i },
  { cls: 'rv', re: /real results, in their/i },
  // Final CTAs come in page-specific variants ("Ready to grow in Atlanta?"),
  // so they're matched by their card and keep their own words (see adapt()).
  { cls: 'ct', re: /ready to get social media off your plate|let.s fill your calendar/i, card: '.ccta-card, .fbe-cta-card, .sbcta, .pro-cta-card, .rs-cta-card', eyebrow: /^\s*(\/\/\s*)?begin\s*$/i },
];
// Every CTA variant opens with a small "// begin" eyebrow.
const hasEyebrow = (sec, re) => [...sec.querySelectorAll('div, p, span')].some((n) => !n.children.length && re.test(n.textContent));

// Carry the original CTA's words over into the rebuilt one: its headline (the
// last few words in the serif accent), subtitle, buttons and small print.
function adapt(cls, sec, orig) {
  if (cls !== 'ct') return;
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const h2 = orig.querySelector('h2');
  if (h2) {
    const words = h2.textContent.replace(/\s+/g, ' ').trim().split(' ');
    const k = words.length > 4 ? 3 : 1;
    sec.querySelector('.ct__title').innerHTML = `${esc(words.slice(0, -k).join(' '))} <em>${esc(words.slice(-k).join(' '))}</em>`;
  }
  const p = [...orig.querySelectorAll('p')].find((n) => n.textContent.trim().length > 30);
  if (p) sec.querySelector('.ct__sub').textContent = p.textContent.trim();
  const links = [...orig.querySelectorAll('a[href]')].filter((a) => a.textContent.trim());
  sec.querySelectorAll('.ct__ctas a').forEach((a, i) => {
    if (!links[i]) return;
    a.href = links[i].getAttribute('href');
    a.textContent = links[i].textContent.replace(/[→↗]/g, '').trim();
  });
  const note = [...orig.querySelectorAll('div, p, span')].find((n) => !n.children.length && /cancel anytime|money.back|guarantee/i.test(n.textContent) && n.textContent.length < 120);
  if (note) sec.querySelector('.ct__note').textContent = note.textContent.replace(/^\s*\$\s*/, '').trim();
  // Stats: same figures, but some pages label them their own way.
  const leaves = [...orig.querySelectorAll('div, p, span, b, strong')].filter((n) => !n.children.length);
  sec.querySelectorAll('.ct__stats dd').forEach((dd) => {
    const val = leaves.find((n) => n.textContent.trim() === dd.textContent.trim());
    const lab = val && val.nextElementSibling;
    if (lab && lab.textContent.trim()) dd.previousElementSibling.textContent = lab.textContent.trim();
  });
}
const reactOwned = (el) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));
// Its heading, or (for the heading-less trust strip) its visible text; plain
// textContent would start with the CSS of the <style> tags inside sections.
const label = (sec) => ((sec.querySelector('h2') || {}).textContent || sec.innerText.slice(0, 300)).replace(/\s+/g, ' ');

// Resolves with the inserted sections (an empty list if there's nothing to do).
export function swapSharedSections(islands) {
  const tpl = document.getElementById('fx-shared');
  const island = islands[0];
  if (!tpl || !island) return Promise.resolve([]);

  return new Promise((resolve) => {
    let done = false;
    const swap = () => {
      if (done) return;
      done = true;
      const inserted = [];
      // Fresh lookup: a hydration-mismatch re-render may have replaced nodes.
      const sections = [...island.querySelectorAll('section')].filter((s) => !s.parentElement.closest('section') && !s.closest('[data-fx-skip]'));
      for (const { cls, re, card, eyebrow } of SWAPS) {
        const fresh = tpl.content.querySelector(`section.${cls}`);
        if (!fresh) continue;
        const matches = (s) => re.test(label(s)) || (card && (s.matches(card) || s.querySelector(card))) || (eyebrow && hasEyebrow(s, eyebrow));
        const orig = sections.find((s) => !s.hasAttribute('data-fx-replaced') && matches(s));
        if (!orig) continue;
        const sec = document.importNode(fresh, true);
        adapt(cls, sec, orig);
        orig.parentNode.insertBefore(sec, orig);
        orig.setAttribute('data-fx-replaced', cls);
        orig.style.setProperty('display', 'none', 'important');
        inserted.push(sec);
      }
      resolve(inserted);
    };

    whenSafe(island).then((ok) => (ok ? swap() : resolve([])));
  });
}

// Resolves true once sections can safely be added inside an island: React
// has hydrated it, or its component code is missing so it never will. False
// after ~30s if neither (then it's left alone).
export function whenSafe(island) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
    // Is the island's component code missing (so it will never hydrate)?
    let frozen = false;
    const url = island.getAttribute('component-url');
    if (url) fetch(url, { method: 'HEAD' }).then((r) => { frozen = !r.ok; }).catch(() => {});
    island.addEventListener('astro:hydration-error', () => finish(true), { once: true });

    // Poll until it's safe. React owns the DOM a moment after astro:hydrate
    // fires (that event marks the *start* of hydration), so give it a beat.
    let owned = 0;
    let tries = 0;
    const tick = () => {
      if (done) return;
      if (frozen) return finish(true);
      // React hydrates in chunks, and only claims an element once everything
      // inside it is done, so the island's root element is the signal that
      // the whole page is hydrated and siblings can safely be added.
      const root = island.firstElementChild;
      if (root && reactOwned(root)) owned++;
      if (owned > 3) return finish(true);
      if (++tries > 200) return finish(false);
      setTimeout(tick, 150);
    };
    tick();
  });
}

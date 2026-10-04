// Inner pages' own cloned sections, rebuilt in the site's design
// (scripts/build-sections.js → <template id="fx-nx">, styles in nx.css).
// Once React has hydrated the page, each rebuilt section goes in just before
// its original, which stays in the DOM, hidden, so React is unaffected. Then
// the new sections get their motion: cards and rows tilt up into place, the
// step line fills as you scroll, figures count up.

import { whenSafe } from './shared.js';

const OURS = '.nx, .tr, .hw, .pf, .gx, .cx, .pj, .rv, .ct, [class^="fx-"], [class*=" fx-"]';
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 60);

export function setupSections({ islands, gsap: G, ST, reduced }) {
  const tpl = document.getElementById('fx-nx');
  const island = islands.find((i) => /Page$|^AllServices$/.test(i.getAttribute('component-export') || ''));
  if (!tpl || !island) return Promise.resolve([]);
  return whenSafe(island).then((ok) => {
    const inserted = [];
    // The failsafe already brought the originals back: leave them.
    if (document.documentElement.classList.contains('fx-nx-off')) return inserted;
    // The originals, in server order (our own sections skipped).
    const originals = [...island.querySelectorAll('section')].filter((s) => !s.parentElement.closest('section') && !s.matches(OURS));
    for (const fresh of tpl.content.querySelectorAll('section.nx')) {
      const k = +fresh.dataset.nxFor;
      const want = fresh.dataset.nxH;
      const heading = (s) => norm((s.querySelector('h1, h2') || {}).textContent);
      let orig = originals[k];
      if (!orig || (want && heading(orig) !== want)) orig = originals.find((s) => want && heading(s) === want) || (want ? null : orig);
      if (!orig || orig.hasAttribute('data-fx-replaced')) continue;
      if (!ok && !orig.isConnected) continue;
      const sec = document.importNode(fresh, true);
      orig.parentNode.insertBefore(sec, orig);
      orig.setAttribute('data-fx-replaced', 'nx');
      orig.style.setProperty('display', 'none', 'important');
      inserted.push(sec);
    }
    if (!reduced && G) inserted.forEach((sec) => animate(sec, G, ST));
    if (ST) ST.refresh();
    return inserted;
  });
}

function animate(sec, G, ST) {
  const items = [...sec.querySelectorAll('[data-nx-item]')];
  const head = sec.querySelectorAll('.nx__eyebrow, .nx__title, .nx__lede, .nx__cta');
  G.set(head, { opacity: 0, y: 30 });
  G.set(items, { opacity: 0, y: 50, rotationX: -14, transformPerspective: 1000, transformOrigin: '50% 0%' });
  let shown = false;
  const io = new IntersectionObserver((list) => {
    if (shown || !list.some((e) => e.isIntersecting)) return;
    shown = true;
    io.disconnect();
    G.to(head, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' });
    G.to(items, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.12, clearProps: 'transform,opacity' });
    sec.querySelectorAll('.nx-stat dd').forEach(countUp);
  }, { rootMargin: '0px 0px -12% 0px' });
  io.observe(sec);

  // Steps: the line fills as the section scrolls through.
  const line = sec.querySelector('.nx-steps__line i');
  if (line && ST) {
    G.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sec.querySelector('.nx-steps'), start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } });
  }

  function countUp(dd) {
    const m = dd.textContent.match(/^([^\d]*)([\d,.]+)(.*)$/);
    if (!m) return;
    const target = parseFloat(m[2].replace(/,/g, ''));
    if (!isFinite(target) || target === 0) return;
    const dec = (m[2].split('.')[1] || '').length;
    const o = { v: 0 };
    G.to(o, { v: target, duration: 1.4, ease: 'power3.out', onUpdate: () => { dd.textContent = m[1] + o.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3]; } });
  }
}

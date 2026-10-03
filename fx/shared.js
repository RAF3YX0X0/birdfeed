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
  { cls: 'ct', re: /ready to get social media off your plate/i },
];
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
      for (const { cls, re } of SWAPS) {
        const fresh = tpl.content.querySelector(`section.${cls}`);
        if (!fresh) continue;
        const orig = sections.find((s) => !s.hasAttribute('data-fx-replaced') && re.test(label(s)));
        if (!orig) continue;
        const sec = document.importNode(fresh, true);
        orig.parentNode.insertBefore(sec, orig);
        orig.setAttribute('data-fx-replaced', cls);
        orig.style.setProperty('display', 'none', 'important');
        inserted.push(sec);
      }
      resolve(inserted);
    };

    // Is the island's component code missing (so it will never hydrate)?
    let frozen = false;
    const url = island.getAttribute('component-url');
    if (url) fetch(url, { method: 'HEAD' }).then((r) => { frozen = !r.ok; }).catch(() => {});
    island.addEventListener('astro:hydration-error', swap, { once: true });

    // Poll until it's safe. React owns the DOM a moment after astro:hydrate
    // fires (that event marks the *start* of hydration), so give it a beat.
    let owned = 0;
    let tries = 0;
    const tick = () => {
      if (done) return;
      if (frozen) return swap();
      const any = island.querySelector('section');
      if (any && reactOwned(any)) owned++;
      if (owned > 3) return swap();
      if (++tries > 200) return resolve([]); // ~30s: never hydrated, leave it be
      setTimeout(tick, 150);
    };
    tick();
  });
}

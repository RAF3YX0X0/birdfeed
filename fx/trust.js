// Trust panel (markup: partials/home-trust.html, styles: trust.css): the dark
// panel starts tipped back in 3D and settles flat as it scrolls in; the scores
// count up while the stars and the review-site bars fill; the tiles lean
// towards the pointer. The logo band is pure CSS.

export function setupTrust({ section, gsap: G, reduced, finePointer }) {
  const panel = section.querySelector('.tr__panel');
  const rated = [...section.querySelectorAll('.tr-main, .tr-tile')];
  if (reduced || !panel) return;

  // The panel settles flat with the scroll.
  G.fromTo(panel, { rotationX: 26, y: 70, scale: 0.93 }, {
    rotationX: 0, y: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 98%', end: 'top 30%', scrub: 0.8 },
  });

  // Its contents rise in once, and the numbers run.
  const parts = section.querySelectorAll('.tr-main > *, .tr-side > *, .tr__pubs');
  rated.forEach((el) => el.style.setProperty('--fill', '0'));
  G.set(parts, { opacity: 0, y: 30 });
  window.ScrollTrigger.create({
    trigger: panel, start: 'top 80%', once: true,
    onEnter: () => {
      G.to(parts, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity' });
      rated.forEach((el, i) => {
        const b = el.querySelector('[data-to]');
        const to = parseFloat(b.dataset.to);
        const o = { v: 0, f: 0 };
        G.to(o, {
          v: to, f: 1, duration: 1.8, delay: 0.2 + i * 0.12, ease: 'power3.out',
          onUpdate: () => { b.textContent = o.v.toFixed(1); el.style.setProperty('--fill', o.f.toFixed(3)); },
          onComplete: () => { b.textContent = to.toFixed(1); },
        });
      });
    },
  });

  if (!finePointer) return;
  section.querySelectorAll('.tr-tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tile.classList.add('is-tilting');
      tile.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
      tile.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
    });
    tile.addEventListener('pointerleave', () => {
      tile.classList.remove('is-tilting');
      tile.style.removeProperty('--rx');
      tile.style.removeProperty('--ry');
    });
  });
}

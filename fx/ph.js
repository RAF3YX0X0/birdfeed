// Inner-page hero motion (markup: fx/partials/heroes/, styles: ph.css). The
// copy's entrance is the shared hero intro in fx.js; this adds the scroll: the
// page's visual starts tipped back below the copy and stands up into place as
// it scrolls into view, while the arch lifts away behind it.

export function setupPageHero({ section, gsap: G, reduced }) {
  const frame = section.querySelector('.ph__frame');
  const arch = section.querySelector('.ph__arch');
  if (reduced) return;
  if (frame) {
    G.fromTo(frame, { rotationX: 26, y: 70, scale: 0.9, transformPerspective: 1600 }, {
      rotationX: 0, y: 0, scale: 1, ease: 'none',
      scrollTrigger: { trigger: section.querySelector('.ph__stage'), start: 'top bottom', end: 'top 30%', scrub: 0.4 },
    });
    G.from(frame, { opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.5, clearProps: 'opacity' });
  }
  if (arch) {
    G.to(arch, { yPercent: -4, scale: 1.04, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true } });
  }
}

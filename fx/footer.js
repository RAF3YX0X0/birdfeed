// Homepage footer (markup: partials/home-footer.html, styles: footer.css):
// the columns rise in, the giant wordmark's letters stand up one by one as
// the bottom of the page comes into view, and the back-to-top button glides
// home through Lenis.

export function setupFooter({ footer, gsap: G, lenis, reduced }) {
  // The site's "book a demo" bar would sit on top of the footer.
  new IntersectionObserver((list) => {
    document.documentElement.classList.toggle('ft-on', list[list.length - 1].isIntersecting);
  }).observe(footer);

  footer.querySelector('.ft__top-btn').addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: reduced ? 0 : 1.6 });
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  if (reduced) return;

  const parts = footer.querySelectorAll('.ft__brand, .ft-col, .ft__agency, .ft-seo, .ft__bottom');
  G.from(parts, {
    opacity: 0, y: 30, duration: 0.9, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity',
    scrollTrigger: { trigger: footer, start: 'top 85%', once: true },
  });

  // Letters stand up from the bottom edge, scrubbed with the last stretch of scroll.
  const letters = footer.querySelectorAll('.ft__word span');
  G.fromTo(letters, { yPercent: 100, rotationX: -80, opacity: 0.2 }, {
    yPercent: 0, rotationX: 0, opacity: 1, ease: 'power2.out', stagger: 0.06,
    scrollTrigger: { trigger: footer.querySelector('.ft__word'), start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
  });
}

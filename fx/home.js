// Motion for the homepage's "What we do" (scripts/build-home.js, styles in
// home.css): the heading rises in, and the four category cards start as one
// tilted deck in the middle and are dealt out into their places as the
// section scrolls in.

export function setupHome({ gsap: G, ST, reduced, narrow }) {
  const svc = document.querySelector('.hm-svc');
  if (!svc) return;
  heading(svc, G, reduced);
  deal(svc, G, ST, reduced, narrow);
}

function heading(sec, G, reduced) {
  const head = sec.querySelectorAll('.nx__eyebrow, .nx__title, .nx__lede');
  if (reduced || !G) return;
  G.set(head, { opacity: 0, y: 28 });
  once(sec, () => G.to(head, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' }));
}

// The deck: every card starts stacked on the grid's centre, fanned a little
// and tipped back, and slides out to its own place with the scroll.
function deal(sec, G, ST, reduced, narrow) {
  const grid = sec.querySelector('.hm-svc__grid');
  const cards = [...sec.querySelectorAll('.hm-cat')];
  if (reduced || !G || !grid) return;
  if (narrow || !ST || window.innerWidth <= 860) {
    G.set(cards, { opacity: 0, y: 50, rotationX: -14, transformPerspective: 1000, transformOrigin: '50% 0%' });
    once(grid, () => G.to(cards, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' }), '0px 0px -10% 0px');
    return;
  }
  const offsets = () => {
    const g = grid.getBoundingClientRect();
    return cards.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: g.left + g.width / 2 - (r.left + r.width / 2), y: g.top + g.height / 2 - (r.top + r.height / 2) };
    });
  };
  let off = offsets();
  cards.forEach((c, i) => { c.style.zIndex = String(cards.length - i); });
  const tl = G.timeline({
    scrollTrigger: {
      trigger: grid, start: 'top 92%', end: 'top 28%', scrub: 0.9, invalidateOnRefresh: true,
      onRefreshInit: () => { G.set(cards, { clearProps: 'x,y,rotation,rotationX,rotationY,scale' }); off = offsets(); },
    },
  });
  cards.forEach((c, i) => {
    tl.fromTo(c, {
      x: () => off[i].x * 0.82, y: () => off[i].y * 0.82 + 60 - i * 10,
      rotation: (i - 1.5) * 5, rotationX: 32, rotationY: (i % 2 ? -1 : 1) * 10, scale: 0.86 - i * 0.02,
      transformPerspective: 1600,
    }, { x: 0, y: 0, rotation: 0, rotationX: 0, rotationY: 0, scale: 1, ease: 'power2.out', duration: 1 }, i * 0.08);
  });
}

function once(el, run, rootMargin = '0px 0px -12% 0px') {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    run();
  }, { rootMargin });
  io.observe(el);
}

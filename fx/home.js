// Motion for the homepage's data-built sections (scripts/build-home.js, styles
// in home.css):
//   - "What we do": the four category cards start as one tilted deck in the
//     middle and are dealt out into their places as the section scrolls in,
//   - "Built for your industry": the grid of industries lies back like a floor
//     and stands up on scroll,
//   - headings rise in, industry cards lean towards the pointer.

export function setupHome({ gsap: G, ST, reduced, finePointer, narrow }) {
  const svc = document.querySelector('.hm-svc');
  const ind = document.querySelector('.hm-ind');
  [svc, ind].forEach((sec) => sec && heading(sec, G, reduced));
  if (svc) deal(svc, G, ST, reduced, narrow);
  if (ind) floor(ind, G, ST, reduced, narrow);
  // (Industry cards only: the category cards' transform belongs to the deal.)
  if (finePointer && !reduced) document.querySelectorAll('.hm-ind__card').forEach((el) => lean(el, 9));
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

// The floor: the grid lies back and stands up as it scrolls into view; the
// cards rise one after another.
function floor(sec, G, ST, reduced, narrow) {
  const grid = sec.querySelector('.hm-ind__grid');
  const cards = [...sec.querySelectorAll('.hm-ind__card')];
  if (reduced || !G || !grid) return;
  G.set(cards, { opacity: 0, y: 40 });
  once(grid, () => G.to(cards, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.05, clearProps: 'transform,opacity' }), '0px 0px -8% 0px');
  if (narrow || !ST || window.innerWidth <= 640) return;
  G.fromTo(grid, { rotationX: 52, y: 40, scale: 0.9 }, {
    rotationX: 0, y: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: sec.querySelector('.hm-ind__floor'), start: 'top 100%', end: 'top 30%', scrub: 0.8 },
  });
}

function lean(el, deg) {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${(x * deg).toFixed(2)}deg) rotateX(${(-y * deg).toFixed(2)}deg) translateZ(6px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}

function once(el, run, rootMargin = '0px 0px -12% 0px') {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    run();
  }, { rootMargin });
  io.observe(el);
}

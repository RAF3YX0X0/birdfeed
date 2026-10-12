// Motion for the homepage's "What we do" (scripts/build-home.js, styles in
// home.css): the heading rises in, and the four category cards start as one
// tilted deck in the middle and are dealt out into their places as the
// section scrolls in.

export function setupHome({ gsap: G, ST, reduced, narrow }) {
  statement(G, ST, reduced);
  method(G, ST, reduced, narrow);
  results(G, reduced);
  const svc = document.querySelector('.hm-svc');
  if (!svc) return;
  heading(svc, G, reduced);
  deal(svc, G, ST, reduced, narrow);
}

// "Marketing should move your business forward": the paragraph lights up word
// by word as it scrolls through, and the four parts of the growth system
// connect, node by node.
function statement(G, ST, reduced) {
  const sec = document.querySelector('.ms');
  if (!sec || reduced || !G || !ST) return;
  const body = sec.querySelector('.ms__body');
  const flow = sec.querySelector('.ms__flow');
  const nodes = [...flow.querySelectorAll('li')];
  body.innerHTML = body.textContent.split(/(\s+)/).map((w) => (/\s/.test(w) ? w : `<span class="ms-w">${w}</span>`)).join('');
  const words = [...body.querySelectorAll('.ms-w')];
  const paint = (p) => {
    const lit = p * words.length * 1.15;
    words.forEach((w, i) => w.style.setProperty('--o', String(Math.min(1, Math.max(0.18, lit - i)))));
  };
  paint(0);
  ST.create({ trigger: body, start: 'top 82%', end: 'bottom 45%', scrub: true, onUpdate: (s) => paint(s.progress) });
  flow.style.setProperty('--p', '0');
  ST.create({
    trigger: flow, start: 'top 85%', end: 'top 45%', scrub: true,
    onUpdate: (s) => {
      flow.style.setProperty('--p', s.progress.toFixed(3));
      nodes.forEach((n, i) => n.classList.toggle('is-on', s.progress >= i / (nodes.length - 1) - 0.02));
    },
  });
}

// The MAD Method: the three cards tip up out of the panel one after another,
// their big letters drifting slower than the cards.
function method(G, ST, reduced, narrow) {
  const sec = document.querySelector('.md');
  if (!sec || reduced || !G || !ST) return;
  const head = sec.querySelectorAll('.sx-eyebrow, .md__title');
  const steps = [...sec.querySelectorAll('.md-step')];
  G.set(head, { opacity: 0, y: 28 });
  once(sec, () => G.to(head, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' }));
  if (narrow || window.innerWidth <= 900) {
    G.set(steps, { opacity: 0, y: 50, rotationX: -18, transformPerspective: 1200, transformOrigin: '50% 100%' });
    steps.forEach((s) => once(s, () => G.to(s, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity' })));
    return;
  }
  const tl = G.timeline({ scrollTrigger: { trigger: sec.querySelector('.md__steps'), start: 'top 90%', end: 'top 35%', scrub: 0.8 } });
  steps.forEach((s, i) => {
    tl.fromTo(s, { y: 120, rotationX: 38, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 100%' }, { y: 0, rotationX: 0, opacity: 1, ease: 'power2.out', duration: 1 }, i * 0.18);
    tl.fromTo(s.querySelector('.md-step__l'), { y: 80 }, { y: 0, ease: 'power2.out', duration: 1.2 }, i * 0.18);
  });
}

// What we measure: the five metrics rise in, one after another.
function results(G, reduced) {
  const sec = document.querySelector('.mx');
  if (!sec || reduced || !G) return;
  const items = [...sec.querySelectorAll('.mx-metric, .mx__report')];
  G.set(items, { opacity: 0, y: 36 });
  once(sec.querySelector('.mx__metrics'), () => G.to(items, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity' }));
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
      rotation: (i - (cards.length - 1) / 2) * 5, rotationX: 32, rotationY: (i % 2 ? -1 : 1) * 10, scale: 0.86 - i * 0.02,
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

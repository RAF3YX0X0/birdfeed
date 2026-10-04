// The pricing page (markup: scripts/build-pricing.js, styles: pricing.css).
//   - Hero: the copy rises in (behind the preloader), the $99 counts up to
//     its figure, and the ring of prices tilts with scroll and the pointer.
//   - "Build your plan" links glide to the plan builder.
//   - Price explorer: tabs flip their cards in; tier buttons count the price
//     to its new figure and redraw the agency comparison.
//   - The receipt prints out of its slot as it scrolls into view.

import { wireBlocks } from './ind.js';

export function setupPricing({ hero, gsap: G, ST, lenis, reduced, intro, animateIn, finePointer }) {
  heroMotion(hero, G, ST, reduced, intro, animateIn, finePointer);
  buildLinks(lenis);
  explorer(G, reduced, finePointer);
  receipt(G, ST, reduced);
  const secs = [...document.querySelectorAll('.prx-list, .prx-pro-wrap, .prx-rcpt')];
  if (secs.length) wireBlocks(secs, { gsap: G, ST, reduced, finePointer: false });
}

// ---- Hero ------------------------------------------------------------------------------------
function heroMotion(hero, G, ST, reduced, intro, animateIn, finePointer) {
  const num = hero.querySelector('.prx__num');
  // The figure counts up to its price.
  if (num && !reduced && G) {
    const to = parseInt(num.textContent, 10) || 0;
    // From the smallest number with as many digits, so the figure keeps its width.
    const st = { v: 10 ** (String(to).length - 1) };
    num.textContent = String(st.v);
    const count = () => G.to(st, { v: to, duration: 2, ease: 'expo.out', onUpdate: () => { num.textContent = String(Math.round(st.v)); } });
    if (animateIn && intro) intro.add(count, 0.3); else count();
  }
  if (reduced) return;
  const lines = hero.querySelectorAll('.prx__line > span');
  const rest = hero.querySelectorAll('.prx__copy .sx-eyebrow, .prx__sub, .prx__ctas, .prx__facts');
  const stage = hero.querySelector('.prx__stage');
  if (animateIn && intro) {
    G.set(lines, { yPercent: 110 });
    G.set(rest, { opacity: 0, y: 24 });
    G.set(stage, { opacity: 0, scale: 0.86, rotationX: 24, transformPerspective: 1400 });
    intro.to(lines, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0.05)
      .to(rest, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' }, 0.3)
      .to(stage, { opacity: 1, scale: 1, rotationX: 0, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 0.15);
  }
  // Scroll: the ring tips further back and drifts as the hero leaves.
  const tilt = hero.querySelector('.prx__tilt');
  if (ST && tilt) {
    G.to(tilt, { rotationX: -40, rotationZ: -12, yPercent: -10, scale: 0.92, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } });
  }
  // Pointer: the whole stage leans towards it.
  if (finePointer && stage) {
    const qx = G.quickTo(stage, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    const qy = G.quickTo(stage, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    G.set(stage, { transformPerspective: 1400 });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      qx(((e.clientX - r.left) / r.width - 0.5) * 14);
      qy(-((e.clientY - r.top) / r.height - 0.5) * 10);
    });
    hero.addEventListener('pointerleave', () => { qx(0); qy(0); });
  }
}

// ---- "Build your plan" ---------------------------------------------------------------------
function buildLinks(lenis) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('[data-prx-build]');
    if (!a) return;
    const grid = document.querySelector('.sh-builder-grid');
    if (!grid) return;
    e.preventDefault();
    const target = grid.closest('section') || grid;
    if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
}

// ---- Price explorer ---------------------------------------------------------------------------
function explorer(G, reduced, finePointer) {
  const sec = document.querySelector('.prx-list');
  if (!sec) return;
  const tabs = [...sec.querySelectorAll('.prx-tabs [role="tab"]')];
  const panels = [...sec.querySelectorAll('.prx-panel')];
  const ink = sec.querySelector('.prx-tabs__ink');
  const moveInk = () => {
    const on = tabs.find((t) => t.classList.contains('is-on'));
    if (!on || !ink) return;
    ink.style.left = `${on.offsetLeft}px`;
    ink.style.width = `${on.offsetWidth}px`;
  };
  moveInk();
  window.addEventListener('resize', moveInk);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);

  const show = (i) => {
    tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    moveInk();
    if (!reduced && G) G.fromTo(panels[i].children, { opacity: 0, rotationY: -28, x: 60, transformPerspective: 1600 }, { opacity: 1, rotationY: 0, x: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (i + d + tabs.length) % tabs.length;
      show(n);
      tabs[n].focus();
    });
  });

  // Tiers: the price counts to its new figure, the comparison redraws.
  sec.querySelectorAll('.prx-card').forEach((card) => {
    const priceEl = card.querySelector('[data-prx-price]');
    const saveEl = card.querySelector('[data-prx-save]');
    const us = card.querySelector('.prx-card__bars .is-us i');
    const usEl = card.querySelector('[data-prx-us]');
    const themEl = card.querySelector('[data-prx-them]');
    const agency = +card.dataset.agency || 0;
    const state = { v: parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0 };
    // The agency figure is for the first tier; bigger tiers scale it.
    const base = state.v;
    const them = (v) => Math.round((agency * v) / base / 10) * 10;
    card.querySelectorAll('.prx-card__tiers button').forEach((btn) => {
      btn.addEventListener('click', () => {
        card.querySelectorAll('.prx-card__tiers button').forEach((b) => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-checked', String(b === btn)); });
        const to = +btn.dataset.price;
        const paint = () => {
          priceEl.textContent = Math.round(state.v).toLocaleString('en-US');
          if (usEl) usEl.textContent = priceEl.textContent;
          if (themEl && agency) themEl.textContent = them(state.v).toLocaleString('en-US');
          if (saveEl && agency) saveEl.textContent = `$${Math.max(0, them(state.v) - Math.round(state.v)).toLocaleString('en-US')}`;
        };
        if (reduced || !G) { state.v = to; paint(); } else G.to(state, { v: to, duration: 0.8, ease: 'power3.out', onUpdate: paint });
        if (us && agency) us.style.setProperty('--w', Math.min(1, to / them(to)).toFixed(3));
      });
    });
    // Cards lean towards the pointer.
    if (finePointer && !reduced) {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1100px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg) translateZ(4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    }
  });
}

// ---- Receipt ----------------------------------------------------------------------------------
function receipt(G, ST, reduced) {
  const paper = document.querySelector('.prx-rcpt__paper');
  if (!paper || reduced || !G || !ST) return;
  G.fromTo(paper, { yPercent: -102, rotationX: -8 }, {
    yPercent: 0, rotationX: 0, ease: 'none',
    scrollTrigger: { trigger: paper.closest('.prx-rcpt'), start: 'top 85%', end: 'top 35%', scrub: 0.9 },
  });
}

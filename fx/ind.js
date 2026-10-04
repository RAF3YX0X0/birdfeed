// Motion for the sections written for one industry or service
// (scripts/render-blocks.js, styles in ind.css):
//   - items tilt up into place as their section arrives,
//   - the example month starts tipped back in 3D and settles flat on scroll,
//   - the year is a 3D ring of months that turns as the pinned section scrolls,
//     the month in front lit up,
//   - work videos load and play only while on screen,
//   - cards lean towards the pointer.
// Industry pages have these sections in their HTML (setupIndustry); service
// pages get theirs from the rebuilt-sections template (wireBlocks).

import { allowSticky } from './funnel.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function setupIndustry(opts) {
  const secs = [...document.querySelectorAll('section.ind')];
  if (secs.length) wireBlocks(secs, opts);
}

export function wireBlocks(secs, { gsap: G, ST, reduced, finePointer }) {
  secs.forEach((sec) => {
    reveal(sec, G, reduced);
    if (sec.classList.contains('ind-cal') && !reduced && G && ST) settle(sec, G);
    if (sec.classList.contains('ind-year') && !reduced && ST) ring(sec, ST);
    videos(sec);
    if (finePointer && !reduced) tilt(sec);
  });
  if (ST) ST.refresh();
}

function reveal(sec, G, reduced) {
  const head = sec.querySelectorAll('.nx__eyebrow, .nx__title, .nx__lede');
  const items = sec.querySelectorAll('[data-ind-item]');
  const list = sec.querySelector('.ind-track__list');
  if (reduced || !G) { if (list) list.classList.add('is-in'); return; }
  G.set(head, { opacity: 0, y: 28 });
  G.set(items, { opacity: 0, y: 46, rotationX: -14, transformPerspective: 1000, transformOrigin: '50% 0%' });
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    G.to(head, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform' });
    G.to(items, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.06, delay: 0.1, clearProps: 'transform,opacity' });
    if (list) setTimeout(() => list.classList.add('is-in'), 300);
  }, { rootMargin: '0px 0px -12% 0px' });
  io.observe(sec);
}

// The calendar tips back in 3D and flattens as it scrolls up the screen.
function settle(sec, G) {
  const grid = sec.querySelector('.ind-cal__grid');
  if (!grid || window.innerWidth <= 760) return;
  G.fromTo(grid, { rotationX: 34, rotationZ: -5, y: 80, scale: 0.9 }, {
    rotationX: 0, rotationZ: 0, y: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 15%', scrub: 0.8 },
  });
}

// The year: pinned (sticky) while scrolling turns a ring of twelve months.
function ring(sec, ST) {
  if (!allowSticky(sec)) return;
  sec.classList.add('is-3d');
  const track = sec.querySelector('.ind-year__track');
  const months = [...track.children];
  let cur = -1;
  const set = (p) => {
    track.style.setProperty('--ry', `${(-p * 330).toFixed(2)}deg`);
    const i = clamp(Math.round(p * 11), 0, 11);
    if (i !== cur) { cur = i; months.forEach((m, k) => m.classList.toggle('is-on', k === i)); }
  };
  // Card size: whatever fits under the heading on this screen.
  const pin = sec.querySelector('.ind-year__pin');
  const view = sec.querySelector('.ind-year__view');
  const fit = () => {
    const room = pin.clientHeight - (view.getBoundingClientRect().top - pin.getBoundingClientRect().top) - 70;
    const max = window.innerWidth <= 760 ? 250 : 300;
    sec.style.setProperty('--ch', `${Math.round(clamp(room, 140, max))}px`);
  };
  fit();
  // Again once fonts settle the heading's height, and as the section arrives.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit, { once: true });
  window.addEventListener('resize', fit);
  new IntersectionObserver((list) => { if (list.some((e) => e.isIntersecting)) fit(); }).observe(sec);
  set(0);
  ST.create({ trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (self) => set(self.progress) });
}

// Videos load their source and play only while on screen.
function videos(sec) {
  const vids = sec.querySelectorAll('video[data-src]');
  if (!vids.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else if (v.src) v.pause();
  }), { threshold: 0.35 });
  vids.forEach((v) => io.observe(v));
}

// Cards lean towards the pointer.
function tilt(sec) {
  sec.querySelectorAll('.ind-plat__card, .ind-case, .ind-rules__card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg) translateZ(6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

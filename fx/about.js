// The About page (markup: scripts/build-about.js, styles: about.css).
//   - Hero: the copy rises in; the stack of layers drops into place one layer
//     at a time, spreads apart as you scroll, and turns towards the pointer.
//   - Where it started: the story lights up word by word as you read down.
//   - The four alternatives (pinned): the cards fan out in 3D, then
//     MadMarketing's card rises to the front as the others fall back.
//   - The economics (pinned): six cards on a ring that turns with the scroll,
//     the front one lit and counted.
//   - Headings and the principles tip up into place; principles lean with the pointer.

import { allowSticky } from './funnel.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

export function setupAbout({ hero, gsap: G, ST, reduced, intro, animateIn, finePointer }) {
  const narrow = () => window.innerWidth <= 860;
  heroMotion(hero, G, ST, reduced, intro, animateIn, finePointer);
  story(G, ST, reduced);
  if (!reduced && ST) {
    deck(G, ST, narrow);
    ring(ST, narrow);
  }
  reveals(G, reduced, finePointer);
}

// ---- Hero ----------------------------------------------------------------------------------
function heroMotion(hero, G, ST, reduced, intro, animateIn, finePointer) {
  const stack = hero.querySelector('.abx-stack');
  const layers = [...hero.querySelectorAll('.abx-layer')];
  if (reduced || !G || !stack) return;
  const lines = hero.querySelectorAll('.abx__line > span');
  const rest = hero.querySelectorAll('.abx__copy .sx-eyebrow, .abx__sub, .abx__ctas, .abx__trust');
  const pose = { gap: 72, spread: 0, rx: 56, rz: -38, px: 0, py: 0 };
  const apply = () => {
    // Phones: smaller layers, so a tighter stack.
    const k = window.innerWidth <= 860 ? 0.6 : 1;
    stack.style.setProperty('--gap', `${((pose.gap + pose.spread * 70) * k).toFixed(1)}px`);
    stack.style.setProperty('--rx', `${(pose.rx - pose.py * 8).toFixed(2)}deg`);
    stack.style.setProperty('--rz', `${(pose.rz + pose.px * 12).toFixed(2)}deg`);
  };
  // The layers drop in from above, one after another (--drop: their own lift,
  // so the stack's spacing stays in CSS).
  const enter = () => G.fromTo(layers, { '--drop': '420px', opacity: 0 }, { '--drop': '0px', opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12, clearProps: 'opacity' });
  if (animateIn && intro) {
    G.set(lines, { yPercent: 110 });
    G.set(rest, { opacity: 0, y: 24 });
    G.set(layers, { opacity: 0 });
    intro.to(lines, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0.05)
      .to(rest, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' }, 0.3)
      .add(enter, 0.2);
  } else enter();
  // Breathing: the layers part and close a little, all the time.
  G.to(pose, { gap: 86, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: apply });
  // Scroll: the stack opens up and turns as the hero leaves.
  if (ST) {
    ST.create({
      trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6,
      onUpdate: (self) => { pose.spread = self.progress; pose.rz = -38 + self.progress * 50; pose.rx = 56 - self.progress * 14; apply(); },
    });
  }
  if (finePointer) {
    const qx = G.quickTo(pose, 'px', { duration: 0.9, ease: 'power3.out', onUpdate: apply });
    const qy = G.quickTo(pose, 'py', { duration: 0.9, ease: 'power3.out', onUpdate: apply });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      qx(((e.clientX - r.left) / r.width - 0.5) * 2);
      qy(((e.clientY - r.top) / r.height - 0.5) * 2);
    });
    hero.addEventListener('pointerleave', () => { qx(0); qy(0); });
  }
  apply();
}

// ---- Where it started: the words light up as you read down ------------------------------------
function story(G, ST, reduced) {
  const sec = document.querySelector('.abx-story');
  if (!sec) return;
  const words = [...sec.querySelectorAll('.abx-w')];
  if (reduced || !ST) { sec.classList.add('is-static'); return; }
  let lit = -1;
  ST.create({
    trigger: sec.querySelector('.abx-story__text'), start: 'top 78%', end: 'bottom 52%', scrub: 0.4,
    onUpdate: (self) => {
      const n = Math.round(self.progress * words.length);
      if (n === lit) return;
      words.forEach((w, i) => { if ((i < n) !== (i < lit)) w.classList.toggle('is-lit', i < n); });
      lit = n;
    },
  });
}

// ---- The four alternatives: fan out, then MadMarketing rises to the front -----------------------------
function deck(G, ST, narrow) {
  const sec = document.querySelector('.abx-alts');
  if (!sec || !allowSticky(sec)) return;
  const cards = [...sec.querySelectorAll('.abx-card:not(.abx-card--us)')];
  const us = sec.querySelector('.abx-card--us');
  const set = (p) => {
    if (narrow()) { [...cards, us].forEach((c) => { c.style.transform = ''; c.style.opacity = ''; c.style.filter = ''; }); return; }
    const fan = smooth(p / 0.5);
    const rise = smooth((p - 0.55) / 0.35);
    const w = Math.min(window.innerWidth, 1280);
    cards.forEach((c, i) => {
      const k = i - 1.5;
      const x = k * w * 0.235 * fan;
      const y = Math.abs(k) * 26 * fan - rise * 30;
      const z = -Math.abs(k) * 50 * fan - rise * 260;
      const rz = k * 7 * fan;
      const ry = -k * 10 * fan;
      // Before they fan, the cards sit as a stack, a little offset.
      const sx = (1 - fan) * k * 8;
      const sy = (1 - fan) * k * -6;
      c.style.transform = `translate3d(${(x + sx).toFixed(1)}px, ${(y + sy).toFixed(1)}px, ${z.toFixed(1)}px) rotateZ(${rz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      c.style.opacity = (1 - rise * 0.55).toFixed(3);
      c.style.filter = rise > 0.02 ? `blur(${(rise * 2.5).toFixed(2)}px)` : '';
    });
    us.style.transform = `translate3d(0, ${((1 - rise) * 420).toFixed(1)}px, ${(rise * 80).toFixed(1)}px) rotateX(${((1 - rise) * 40).toFixed(2)}deg)`;
    us.style.opacity = clamp(rise * 1.6).toFixed(3);
  };
  set(0);
  ST.create({ trigger: sec.querySelector('.abx-alts__pin'), start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (self) => set(self.progress) });
  window.addEventListener('resize', () => set(0));
}

// ---- The economics: a ring of six cards ------------------------------------------------------------
function ring(ST, narrow) {
  const sec = document.querySelector('.abx-eco');
  if (!sec || !allowSticky(sec)) return;
  const track = sec.querySelector('.abx-ring__track');
  const faces = [...track.children];
  const count = sec.querySelector('.abx-eco__count b');
  let cur = -1;
  const fit = () => {
    const w = faces[0].offsetWidth || 300;
    // Six faces round a hexagon: the radius that lets them just touch, plus air.
    track.style.setProperty('--r', `${Math.round((w / 2) / Math.tan(Math.PI / 6) + 30)}px`);
  };
  const set = (p) => {
    if (narrow()) { faces.forEach((f) => f.classList.remove('is-on')); return; }
    track.style.setProperty('--ry', `${(-p * 300).toFixed(2)}deg`);
    const i = clamp(Math.round(p * 5), 0, 5);
    if (i !== cur) {
      cur = i;
      faces.forEach((f, k) => f.classList.toggle('is-on', k === i));
      if (count) count.textContent = `0${i + 1}`;
    }
  };
  fit();
  set(0);
  window.addEventListener('resize', fit);
  ST.create({ trigger: sec.querySelector('.abx-eco__pin'), start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (self) => set(self.progress) });
}

// ---- Headings and principles tip up into place ----------------------------------------------------
function reveals(G, reduced, finePointer) {
  if (reduced || !G) return;
  document.querySelectorAll('.abx-story, .abx-alts, .abx-eco, .abx-prin').forEach((sec) => {
    const head = sec.querySelectorAll('.nx__eyebrow, .nx__title, .nx__lede, .abx-story__year');
    const items = sec.querySelectorAll('.abx-pr');
    G.set(head, { opacity: 0, y: 30 });
    G.set(items, { opacity: 0, y: 50, rotationX: -16, transformPerspective: 1100, transformOrigin: '50% 0%' });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      G.to(head, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity' });
      G.to(items, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.1, clearProps: 'transform,opacity' });
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(sec);
  });
  if (!finePointer) return;
  document.querySelectorAll('.abx-pr').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg) translateZ(6px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

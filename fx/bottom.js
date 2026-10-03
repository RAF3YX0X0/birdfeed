// Homepage, pricing down (markup: partials/home-pricing-head.html and
// home-bottom.html, styles: bottom.css):
//   - section headings flip up like the rest of the landing page,
//   - guarantee: the "Day 14" seal spins in 3D and the 14-day track fills as
//     the card scrolls through,
//   - cost comparison: rows tip in and their price bars grow,
//   - reviews: a 3D cover-flow of video reviews (drag, arrows, keys; click
//     plays with sound) and a wall of text reviews drifting in columns,
//   - FAQ: one-open-at-a-time accordion with height animation,
//   - CTA: card rises in, stats count up.

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function setupHomeBottom({ gsap: G, lenis, reduced, narrow }) {
  const ST = window.ScrollTrigger;
  const q = (s) => document.querySelector(s);

  // ---- headings -------------------------------------------------------------------
  if (!reduced) {
    document.querySelectorAll('.prh, .gx, .cx, .rv, .fq, .ct').forEach((sec) => {
      const head = sec.querySelectorAll(':scope .sx-head > *, .gx__copy > *, .fq__side > *, .ct__copy > *');
      if (!head.length) return;
      G.set(head, { opacity: 0, y: 36, rotationX: -40, transformPerspective: 900, transformOrigin: '50% 100%' });
      G.to(head, {
        opacity: 1, y: 0, rotationX: 0, duration: 1.05, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: sec, start: 'top 78%', once: true },
        onComplete: () => G.set(head, { clearProps: 'transform,opacity' }),
      });
    });
  }

  // ---- guarantee --------------------------------------------------------------------
  const gx = q('.gx');
  if (gx) {
    const seal = gx.querySelector('.gx-seal');
    const fill = gx.querySelector('.gx-track__bar i');
    const steps = [...gx.querySelectorAll('.gx-track li')];
    const card = gx.querySelector('.gx__card');
    const set = (p) => {
      const f = clamp((p - 0.15) / 0.6);
      fill.style.transform = `scaleX(${f.toFixed(4)})`;
      steps.forEach((li, i) => li.classList.toggle('is-on', f >= [0.02, 0.5, 0.98][i]));
      if (!reduced) seal.style.transform = `rotateY(${(p * 360 - 20).toFixed(2)}deg) rotateX(${(8 - p * 16).toFixed(2)}deg)`;
    };
    if (reduced) set(1);
    else {
      set(0);
      ST.create({ trigger: card, start: 'top 85%', end: 'bottom 15%', scrub: 0.4, onUpdate: (self) => set(self.progress) });
      G.fromTo(card, { y: 120, rotationX: 16, scale: 0.94, transformPerspective: 1600, transformOrigin: '50% 100%' }, {
        y: 0, rotationX: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 45%', scrub: true },
      });
      G.from(gx.querySelector('.gx__pro'), {
        y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: gx, start: 'top 85%', once: true },
      });
    }
  }

  // ---- cost comparison -------------------------------------------------------------------
  const cx = q('.cx');
  if (cx) {
    if (reduced) cx.classList.add('is-in');
    else {
      const rows = cx.querySelectorAll('.cx-row');
      G.set(rows, { opacity: 0, rotationX: -50, y: 30, transformOrigin: '50% 0%' });
      ST.create({
        trigger: cx.querySelector('.cx__table'), start: 'top 78%', once: true,
        onEnter: () => {
          G.to(rows, { opacity: 1, rotationX: 0, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' });
          setTimeout(() => cx.classList.add('is-in'), 150);
        },
      });
      G.fromTo(cx.querySelector('.cx-us'), { y: 80, rotationX: 18, scale: 0.95, transformPerspective: 1400, transformOrigin: '50% 100%' }, {
        y: 0, rotationX: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: cx.querySelector('.cx-us'), start: 'top bottom', end: 'top 60%', scrub: true },
      });
    }
  }

  // ---- reviews: video cover-flow ----------------------------------------------------------
  const rv = q('.rv');
  if (rv) {
    const track = rv.querySelector('.rv__track');
    const vids = [...rv.querySelectorAll('.rv-vid')];
    const dots = [...rv.querySelectorAll('.rv__dots i')];
    const N = vids.length;
    let pos = 0;            // shown position (float)
    let target = 0;         // where it's heading
    let playing = null;
    const wrap = (d) => ((d % N) + N + N / 2) % N - N / 2; // shortest signed distance

    const fan = { v: 1 };
    const layout = () => {
      const w = narrow ? 170 : 250;
      vids.forEach((v, i) => {
        const d = wrap(i - pos);
        const a = Math.abs(d);
        const x = d * w * (1 - Math.min(a, 3) * 0.06) * fan.v;
        const z = -a * 160 * fan.v;
        const ry = clamp(-d * 24, -55, 55) * fan.v;
        v.style.transform = `translate3d(${x.toFixed(1)}px, ${(a * 14).toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        v.style.zIndex = String(100 - Math.round(a * 10));
        v.style.opacity = a > 3.4 ? '0' : (1 - Math.max(0, a - 2.4)).toFixed(3);
        v.style.pointerEvents = a > 3 ? 'none' : '';
        v.tabIndex = Math.round(a * 10) === 0 ? 0 : -1;
      });
      const c = ((Math.round(pos) % N) + N) % N;
      dots.forEach((d, i) => d.classList.toggle('is-on', i === c));
    };
    const stop = () => {
      if (!playing) return;
      playing.querySelector('video').pause();
      playing.classList.remove('is-playing');
      playing = null;
    };
    const go = (t) => {
      target = t;
      if (playing && Math.round(t) !== +playing.dataset.i) stop();
      if (reduced) { pos = target; layout(); }
    };
    rv.querySelector('.rv__prev').addEventListener('click', () => go(Math.round(target) - 1));
    rv.querySelector('.rv__next').addEventListener('click', () => go(Math.round(target) + 1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(target) - 1); vids[((Math.round(target) % N) + N) % N].focus(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(target) + 1); vids[((Math.round(target) % N) + N) % N].focus(); }
    });

    // Drag / swipe.
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, start: target, moved: false, id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6 && !drag.moved) { drag.moved = true; track.classList.add('is-dragging'); }
      if (drag.moved) target = drag.start - dx / (narrow ? 170 : 250);
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.moved) go(Math.round(target));
      track.classList.remove('is-dragging');
      setTimeout(() => { drag = null; }, 0);
    });

    vids.forEach((v) => v.addEventListener('click', (e) => {
      if (drag && drag.moved) { e.preventDefault(); return; }
      const i = +v.dataset.i;
      const centre = ((Math.round(target) % N) + N) % N;
      if (i !== centre) { go(Math.round(target) + wrap(i - centre)); return; }
      const video = v.querySelector('video');
      if (playing === v) { stop(); return; }
      stop();
      playing = v;
      v.classList.add('is-playing');
      video.muted = false;
      video.preload = 'auto';
      const p = video.play();
      if (p && p.catch) p.catch(() => { video.muted = true; video.play().catch(() => {}); });
    }));

    layout();
    if (!reduced) {
      G.ticker.add(() => {
        if (Math.abs(target - pos) < 0.0005) { if (pos !== target) { pos = target; layout(); } return; }
        pos += (target - pos) * 0.12;
        layout();
      });
      // Entrance: the track rises and the reel fans open from the centre card
      // (the cards' own transforms belong to layout(), so it animates `fan`).
      fan.v = 0;
      layout();
      G.from(track, { opacity: 0, y: 80, rotationX: 24, transformPerspective: 1600, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: track, start: 'top 82%', once: true } });
      G.to(fan, { v: 1, duration: 1.5, ease: 'expo.out', onUpdate: layout, scrollTrigger: { trigger: track, start: 'top 82%', once: true } });
    }
    // Pause the video if the reel scrolls away.
    new IntersectionObserver((list) => { if (!list[list.length - 1].isIntersecting) stop(); }).observe(track);

    // Text wall: duplicate each column so the drift loops seamlessly.
    if (!reduced) {
      rv.querySelectorAll('.rv-col__in').forEach((col) => {
        [...col.children].forEach((card) => {
          const copy = card.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          col.appendChild(copy);
        });
      });
    }
  }

  // ---- FAQ ---------------------------------------------------------------------------------
  const items = [...document.querySelectorAll('.fq-item')];
  items.forEach((d) => {
    const sum = d.querySelector('summary');
    const body = d.querySelector('.fq-item__a');
    sum.addEventListener('click', (e) => {
      if (reduced) return; // native toggle
      e.preventDefault();
      const opening = !d.open;
      if (opening) {
        items.forEach((o) => { if (o !== d && o.open) close(o); });
        d.open = true;
        G.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.5, ease: 'expo.out', clearProps: 'height,opacity' });
      } else close(d);
    });
  });
  function close(d) {
    const body = d.querySelector('.fq-item__a');
    G.to(body, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.inOut', onComplete: () => { d.open = false; G.set(body, { clearProps: 'height,opacity' }); } });
  }
  if (!reduced && items.length) {
    G.from(items, {
      opacity: 0, y: 30, rotationX: -30, transformPerspective: 900, transformOrigin: '50% 0%', duration: 0.8, ease: 'expo.out', stagger: 0.05,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: q('.fq__list'), start: 'top 80%', once: true },
    });
  }

  // ---- CTA -----------------------------------------------------------------------------------
  const ct = q('.ct');
  if (ct && !reduced) {
    const card = ct.querySelector('.ct__card');
    G.fromTo(card, { y: 100, scale: 0.93, rotationX: 14, transformPerspective: 1600, transformOrigin: '50% 100%' }, {
      y: 0, scale: 1, rotationX: 0, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 40%', scrub: true },
    });
    ct.querySelectorAll('[data-count]').forEach((dd) => {
      const end = +dd.dataset.count;
      const text = dd.textContent;
      const o = { v: 0 };
      ST.create({
        trigger: dd, start: 'top 90%', once: true,
        onEnter: () => G.to(o, {
          v: end, duration: 1.6, ease: 'power3.out',
          onUpdate: () => { dd.textContent = Math.round(o.v).toLocaleString('en-US') + (dd.dataset.suffix || ''); },
          onComplete: () => { dd.textContent = text; },
        }),
      });
    });
  }
}

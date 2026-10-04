// Homepage hero (markup: partials/home-hero.html, styles: hero.css).
//
// The stage is a sticky 100vh box (plus --hx-tail) inside a tall section, so scroll progress q
// (0 → 1 across the section) drives one pose:
//   - the copy lifts away and fades,
//   - the phone rises from just under the buttons to the middle of the screen,
//   - a strip of content cards opens out behind it, always centred on the
//     phone, curving away like the 3D gallery and drifting sideways.
// Everything is plain DOM written once per frame, and only while on screen.

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Pill nav: compact after the first bit of scroll, hamburger menu. Runs on
// import so it works even if the rest of the FX layer doesn't.
(function setupNav() {
  const nav = document.querySelector('.hx-nav');
  if (!nav) return;
  const burger = nav.querySelector('.hx-nav__burger');
  const menu = nav.querySelector('.hx-menu');
  const isOpen = () => nav.classList.contains('is-open');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setOpen(!isOpen()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('pointerdown', (e) => { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); burger.focus(); }
  });
  const compact = () => nav.classList.toggle('is-compact', window.scrollY > 30);
  window.addEventListener('scroll', compact, { passive: true });
  compact();
})();

export function setupHomeHero({ section, gsap: G, reduced }) {
  const stage = section.querySelector('.hx__stage');
  const copy = section.querySelector('.hx__copy');
  const arch = section.querySelector('.hx__arch');
  const phone = section.querySelector('.hx__phone');
  const phoneIn = section.querySelector('.hx__phone-in');
  const strip = section.querySelector('.hx__strip');
  const cards = [...strip.children];
  const phoneVideo = phone.querySelector('video');
  const cardVideos = [...strip.querySelectorAll('video')];

  const root = document.documentElement;
  let m = null;
  let drift = 0;
  let last = '';
  const intro = { p: 1 }; // 0 → 1 over the entrance (buildIntro)
  const playing = new WeakMap();

  function measure() {
    const tail = parseFloat(section.style.getPropertyValue('--hx-tail')) || 0;
    const vh = stage.offsetHeight - tail;
    const vw = stage.offsetWidth;
    const narrow = vw <= 720;
    const ph = phone.offsetHeight;
    const cw = cards[0].offsetWidth;
    const ch = cards[0].offsetHeight;
    const copyBottom = copy.offsetTop + copy.offsetHeight;
    // The arch's lower edge curves just under the buttons; the phone starts
    // below it (even if that's below the fold on a short screen).
    const short = vh < 760;
    const archGap = narrow ? 44 : short ? 40 : 64;
    const archSize = arch.offsetWidth;
    arch.style.top = `${Math.round(copyBottom + archGap - archSize)}px`;
    const startTop = copyBottom + archGap + (narrow || short ? 24 : 34);
    // Centre in the space below the floating nav.
    const nav = narrow ? 70 : 84;
    const endTop = Math.max(nav, nav + (vh - nav - ph) / 2);
    // A phone taller than the screen runs off the bottom while pinned. The
    // stage reaches that far below the screen (plus room for its shadow), so
    // when the hero lets go the whole phone scrolls past instead of being cut.
    const nextTail = reduced ? 0 : Math.max(0, Math.ceil(endTop + ph + 120 - vh));
    if (nextTail !== tail) section.style.setProperty('--hx-tail', nextTail + 'px');
    const pitch = cw + (narrow ? 14 : 22);
    const top = section.getBoundingClientRect().top + window.scrollY;
    m = { vh, vw, ph, cw, ch, copyBottom, startTop, endTop, pitch, total: pitch * cards.length, top, sh: stage.offsetHeight, range: Math.max(1, section.offsetHeight - stage.offsetHeight), narrow };
    last = '';
  }

  // Sideways position of card i, wrapped so the strip loops forever.
  const slotX = (i, offset) => {
    const t = m.total;
    return ((((i * m.pitch - offset + t / 2) % t) + t) % t) - t / 2;
  };

  function setPlaying(video, on) {
    if (!video || playing.get(video) === on) return;
    playing.set(video, on);
    if (on) {
      if (video.preload !== 'auto') video.preload = 'auto';
      const p = video.play();
      if (p && p.catch) p.catch(() => playing.delete(video));
    } else video.pause();
  }

  function layoutStrip(r, offset, centreY) {
    strip.style.transform = `translate3d(0, ${(centreY - m.ch / 2).toFixed(1)}px, 0)`;
    const half = m.vw / 2;
    cards.forEach((card, i) => {
      const x = slotX(i, offset) * lerp(0.3, 1, r);
      const d = clamp(Math.abs(x) / half, 0, 1.4);
      const s = Math.sign(x);
      // Convex curve, as if wrapped round a drum behind the phone.
      const rot = reduced ? 0 : s * d * 22;
      const z = reduced ? 0 : -d * d * 170;
      const y = (1 - r) * 50;
      card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg) scale(${lerp(0.82, 1, r).toFixed(3)})`;
      card.style.opacity = (r * clamp(1.5 - d, 0.35, 1)).toFixed(3);
    });
  }

  function render(dt) {
    if (!m) return;
    const y = window.scrollY;
    const onScreen = y < m.top + m.range + m.sh && y + m.vh > m.top;
    setPlaying(phoneVideo, onScreen);
    const pinned = y < m.top + m.range;
    if (pinned !== root.classList.contains('hx-pinned')) root.classList.toggle('hx-pinned', pinned);
    if (!onScreen) { cardVideos.forEach((v) => setPlaying(v, false)); return; }

    const q = clamp((y - m.top) / m.range);
    const a = easeInOut(clamp(q / 0.62));
    const r = easeOut(clamp((q - 0.16) / 0.44));
    const ip = intro.p;
    if (r > 0.01) drift += dt * (m.narrow ? 24 : 34);
    cardVideos.forEach((v) => setPlaying(v, r > 0.05));

    const key = `${q.toFixed(4)}|${ip.toFixed(4)}|${r > 0.01 ? drift.toFixed(1) : 0}`;
    if (key === last) return;
    last = key;

    const phoneY = lerp(m.startTop, m.endTop, a);
    phone.style.transform = `translate3d(-50%, ${phoneY.toFixed(1)}px, 0)`;
    // The phone stands up out of the page as it rises (and on the intro).
    phoneIn.style.transform = `translateY(${((1 - ip) * 160).toFixed(1)}px) rotateX(${(lerp(18, 0, a) + (1 - ip) * 30).toFixed(2)}deg) scale(${lerp(0.94, 1, a).toFixed(3)})`;
    phoneIn.style.opacity = clamp(ip * 1.6).toFixed(3);

    const fade = 1 - clamp((q - 0.03) / 0.3);
    copy.style.transform = `translate3d(0, ${(-a * 130).toFixed(1)}px, 0) scale(${(1 - a * 0.06).toFixed(3)})`;
    copy.style.opacity = fade.toFixed(3);
    copy.style.visibility = fade < 0.02 ? 'hidden' : '';

    // The arch lifts away with the copy as the phone takes over.
    arch.style.transform = `translate3d(-50%, ${(-a * (m.copyBottom + 80) + (1 - ip) * 60).toFixed(1)}px, 0) scale(${lerp(0.96, 1, ip).toFixed(4)})`;
    arch.style.opacity = (clamp(ip * 1.4) * (1 - a * 0.5)).toFixed(3);

    layoutStrip(r, drift + q * m.pitch * 2.5, phoneY + m.ph / 2);
  }

  // Reduced motion: a still stack, with the strip flat behind the phone.
  function still() {
    measure();
    if (phoneVideo) { phoneVideo.removeAttribute('autoplay'); phoneVideo.pause(); }
    layoutStrip(1, 0, phone.offsetTop + m.ph / 2);
  }

  let resizeTimer = 0;
  const remeasure = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => (reduced ? still() : measure()), 120);
  };
  window.addEventListener('resize', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(copy);

  if (reduced) {
    still();
  } else {
    measure();
    render(0);
    G.ticker.add((time, deltaMs) => render(Math.min(deltaMs, 100) / 1000));
  }

  return {
    // Entrance, run by fx.js once the curtain lifts.
    buildIntro(tl) {
      const badge = copy.querySelector('.hx__badge');
      const lines = [...copy.querySelectorAll('.hx__line')];
      const rest = [copy.querySelector('.hx__sub'), copy.querySelector('.hx__ctas')];
      const all = [badge, ...lines, ...rest];
      G.set(lines, { opacity: 0, yPercent: 55, rotationX: -80, transformOrigin: '50% 100%' });
      G.set([badge, ...rest], { opacity: 0, y: 28 });
      tl.to(badge, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.05);
      tl.to(lines, { opacity: 1, yPercent: 0, rotationX: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, 0.1);
      tl.to(rest, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.35);
      tl.to(intro, { p: 1, duration: 1.7, ease: 'expo.out' }, 0.25);
      tl.eventCallback('onComplete', () => G.set(all, { clearProps: 'transform,opacity' }));
      intro.p = 0;
      last = '';
    },
  };
}

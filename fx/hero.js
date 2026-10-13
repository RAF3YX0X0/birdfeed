// Homepage hero (markup: partials/home-hero.html, styles: hero.css), and the
// site-wide pill nav.
//
// The hero: the client's copy beside an animated local-search scene, looping
// while it's on screen; the scene tilts with the pointer and leans back as
// the hero scrolls away.

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
  // Desktop dropdowns: hover opens them (CSS); a click or Enter does too, for
  // touch laptops and keyboards. One open at a time; outside click or Escape closes.
  const dds = [...nav.querySelectorAll('.hx-dd')];
  const closeDds = (except) => dds.forEach((d) => {
    if (d === except) return;
    d.classList.remove('is-open');
    d.querySelector('.hx-dd__btn').setAttribute('aria-expanded', 'false');
  });
  for (const dd of dds) {
    const btn = dd.querySelector('.hx-dd__btn');
    btn.addEventListener('click', () => {
      const open = !dd.classList.contains('is-open');
      closeDds(dd);
      dd.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    dd.addEventListener('mouseleave', () => {
      if (dd.contains(document.activeElement) && document.activeElement !== btn) return;
      dd.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    });
    dd.addEventListener('focusout', (e) => { if (!dd.contains(e.relatedTarget)) closeDds(); });
  }
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.hx-dd')) closeDds(); });
  document.addEventListener('keydown', (e) => {
    const open = dds.find((d) => d.classList.contains('is-open'));
    if (e.key === 'Escape' && open) { closeDds(); open.querySelector('.hx-dd__btn').focus(); }
  });
  const compact = () => nav.classList.toggle('is-compact', window.scrollY > 30);
  window.addEventListener('scroll', compact, { passive: true });
  compact();
})();


// ---- The hero's scene ------------------------------------------------------------------------
// One loop, while the hero is on screen: a search is typed, pins drop on the
// map, the business's result card rises with its stars, then what customers
// do next pops up beside it; then it clears and the next search begins.
export function setupHomeHero({ section, gsap: G, reduced }) {
  const root = document.documentElement;
  const copy = section.querySelector('.hx__copy');
  const scene = section.querySelector('.hx-scene');
  const tilt = section.querySelector('.hx-scene__tilt');
  const q = section.querySelector('.hx-search__q');
  const pings = [...section.querySelectorAll('.hx-ping')];
  const queries = (q.getAttribute('data-queries') || '').split('|').filter(Boolean);

  if (reduced) {
    q.textContent = queries[0] || '';
    scene.classList.add('is-pins', 'is-result');
    pings.forEach((p) => p.classList.add('is-on'));
    root.classList.add('hx-ready');
    return { buildIntro() {} };
  }

  // ---- The loop (timeouts, cancelled while the hero is off screen) ---------------------
  let timers = [];
  let running = false;
  let n = 0;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  function type(text, done) {
    let i = 0;
    const step = () => {
      q.textContent = text.slice(0, ++i);
      if (i < text.length) later(step, 55 + Math.random() * 45);
      else later(done, 350);
    };
    step();
  }
  function erase(done) {
    const step = () => {
      q.textContent = q.textContent.slice(0, -1);
      if (q.textContent) later(step, 22);
      else later(done, 250);
    };
    step();
  }
  function cycle() {
    const text = queries[n++ % queries.length];
    type(text, () => {
      scene.classList.add('is-pins');
      later(() => scene.classList.add('is-result'), 1200);
      pings.forEach((p, i) => later(() => p.classList.add('is-on'), 2300 + i * 900));
      later(() => {
        pings.forEach((p) => p.classList.remove('is-on'));
        scene.classList.remove('is-result');
        later(() => {
          scene.classList.remove('is-pins');
          erase(cycle);
        }, 500);
      }, 6800);
    });
  }
  function start() { if (!running) { running = true; cycle(); } }
  function stop() {
    if (!running) return;
    running = false;
    clear();
    q.textContent = '';
    scene.classList.remove('is-pins', 'is-result');
    pings.forEach((p) => p.classList.remove('is-on'));
  }

  // ---- Pointer tilt and the scroll lean ---------------------------------------------------
  const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  let px = 0;
  let py = 0;
  if (fine) {
    section.addEventListener('pointermove', (e) => {
      const r = scene.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
      py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
    });
    section.addEventListener('pointerleave', () => { px = 0; py = 0; });
  }
  let visible = false;
  let last = '';
  function render() {
    if (!visible) return;
    const r = section.getBoundingClientRect();
    const out = clamp(-r.top / Math.max(1, r.height)); // 0 at rest → 1 scrolled past
    const key = `${px.toFixed(3)}|${py.toFixed(3)}|${out.toFixed(3)}`;
    if (key === last) return;
    last = key;
    tilt.style.transform = `translate3d(0, ${(out * -60).toFixed(1)}px, 0) rotateX(${(out * 22 - py * 6).toFixed(2)}deg) rotateY(${(px * 9 - 4).toFixed(2)}deg) scale(${(1 - out * 0.08).toFixed(4)})`;
    copy.style.transform = `translate3d(0, ${(out * -40).toFixed(1)}px, 0)`;
    copy.style.opacity = (1 - easeOut(out) * 0.9).toFixed(3);
  }
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) start();
    else stop();
  }, { threshold: 0.05 }).observe(section);
  G.ticker.add(render);
  root.classList.add('hx-ready');

  return {
    // Entrance, run by fx.js once the curtain lifts.
    buildIntro(tl) {
      const badge = copy.querySelector('.hx__kicker');
      const lines = [...copy.querySelectorAll('.hx__line')];
      const rest = [copy.querySelector('.hx__sub'), copy.querySelector('.hx__ctas'), copy.querySelector('.hx__facts')].filter(Boolean);
      const all = [badge, ...lines, ...rest];
      G.set(lines, { opacity: 0, yPercent: 55, rotationX: -80, transformOrigin: '50% 100%' });
      G.set([badge, ...rest], { opacity: 0, y: 28 });
      G.set(scene, { opacity: 0, y: 80, rotationX: 24, transformPerspective: 1400 });
      tl.to(badge, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.05);
      tl.to(lines, { opacity: 1, yPercent: 0, rotationX: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, 0.1);
      tl.to(rest, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.35);
      tl.to(scene, { opacity: 1, y: 0, rotationX: 0, duration: 1.5, ease: 'expo.out' }, 0.25);
      tl.eventCallback('onComplete', () => G.set([...all, scene], { clearProps: 'transform,opacity' }));
    },
  };
}

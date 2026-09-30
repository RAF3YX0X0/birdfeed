/*
 * Feedbird FX — 3D, motion and page transitions layered over the Astro build.
 *
 * The pages are pre-rendered React islands, so this layer follows two rules:
 *   1. Never add, remove or re-text nodes React owns before it hydrates. Effects
 *      only write inline transform/opacity (restored afterwards) and data-fx-*
 *      attributes; WebGL canvases and the curtain live directly in <body>.
 *   2. Everything degrades: no GSAP → page just shows; reduced motion → static.
 */
/* global gsap, ScrollTrigger, Lenis */
import { mountStages } from './stage.js';
import { setupFunnel } from './funnel.js';
import { funnelFor } from './funnel-data.js';
import { setupROI } from './roi.js';

const html = document.documentElement;
const G = window.gsap;
const ST = window.ScrollTrigger;
const reduced = html.classList.contains('fx-reduced');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const isNarrow = () => window.innerWidth <= 920;

const islands = [...document.querySelectorAll('astro-island')];
const exportsOf = new Set(islands.map((n) => n.getAttribute('component-export')));
const page = {
  home: exportsOf.has('FBHomeTop'),
  legal: exportsOf.has('LegalPage'),
};

// ---------------------------------------------------------------------------
// Inline-style bookkeeping: every element we animate gets its original inline
// values back when the animation ends, so React's own styles stay intact.
// ---------------------------------------------------------------------------
const SAVED = new WeakMap();
const SAVED_PROPS = ['transform', 'opacity', 'transformOrigin', 'clipPath', 'transition', 'willChange'];

function hold(el) {
  if (!SAVED.has(el)) {
    const o = {};
    for (const p of SAVED_PROPS) o[p] = el.style[p];
    SAVED.set(el, o);
  }
  el.style.transition = 'none';
}

function release(el) {
  const o = SAVED.get(el);
  G.set(el, { clearProps: 'transform,opacity,transformOrigin,clipPath,willChange' });
  if (!o) return;
  for (const p of SAVED_PROPS) if (o[p]) el.style[p] = o[p];
  el.style.transition = o.transition;
  SAVED.delete(el);
}

function make(tag, className, inner) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (inner) n.innerHTML = inner;
  return n;
}

function whenHydrated(island) {
  return new Promise((resolve) => {
    if (!island.hasAttribute('ssr')) return resolve();
    island.addEventListener('astro:hydrate', () => resolve(), { once: true });
  });
}

let refreshTimer = 0;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ST.refresh(), 220);
}

// Offset of `el` inside `ancestor`, ignoring CSS transforms (layout box only).
function layoutBox(el, ancestor) {
  let x = 0, y = 0, n = el;
  while (n && n !== ancestor) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent;
    if (!p) break;
    if (p === ancestor || !ancestor.contains(p)) {
      if (p !== ancestor) {
        const a = ancestor.getBoundingClientRect(), b = p.getBoundingClientRect();
        x += b.left - a.left;
        y += b.top - a.top;
      }
      break;
    }
    n = p;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

// ===========================================================================
function init() {
  const t0 = performance.now();
  const lenis = setupSmoothScroll();
  const curtain = setupCurtain(lenis);
  setupProgress();

  const hero = findHero();
  live.hero = hero;
  const intro = G.timeline({ paused: true });
  if (!reduced && hero) buildHeroIntro(hero, intro);

  if (page.home) setupGallery(curtain);
  if (page.home) {
    // The sales funnel goes between the hero island and the main island, so it
    // sits right after the trust badges without touching React-owned DOM.
    const anchor = islands.find((n) => n.getAttribute('component-export') === 'FBHomeMain');
    if (anchor) setupFunnel({ anchor, gsap: G, lenis, reduced, narrow: isNarrow() });
  } else {
    const slug = location.pathname.replace(/^\/+|\/+$/g, '');
    const cfg = funnelFor(location.pathname);
    const common = { gsap: G, lenis, reduced, narrow: isNarrow() };
    if (cfg) placeInIsland([/pricing\s*&\s*plans/i, /real results/i], (anchor) => setupFunnel({ anchor, ...common, stages: cfg.stages, copy: cfg.copy }));
    if (slug === 'pricing') placeInIsland([/money back|first batch/i], (anchor) => setupROI({ anchor, ...common }));
  }

  let targets = scanReveals(hero);
  // Landing page: card groups become 3D stages (arcs, pinned ring, cover-flow,
  // drum) that own their cards, so those cards skip the generic reveal/tilt.
  if (page.home && !reduced) {
    html.classList.add('fx-landing');
    const { claimed } = mountStages({ gsap: G, lenis, targets, finePointer, narrow: isNarrow() });
    targets = targets.filter((t) => !claimed.has(t.el));
  }
  if (!reduced) setupReveals(targets, intro);

  mount3D(hero, intro);

  // Pointer effects and image depth aren't needed for first paint.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 250));
  idle(() => {
    if (reduced) return;
    setupImageDepth(hero);
    if (finePointer) {
      setupCursor();
      setupTilt(targets);
      setupMagnetic();
    }
  }, { timeout: 1500 });

  islands.forEach((island) => whenHydrated(island).then(() => afterHydrate(island)));
  if ('ResizeObserver' in window) new ResizeObserver(scheduleRefresh).observe(document.body);

  ST.sort();
  ST.refresh();
  curtain.lift();
  G.delayedCall(curtain.revealAt, () => intro.play());

  const initMs = Math.round(performance.now() - t0);
  window.__fx = {
    stats: () => ({
      initMs,
      reveals: targets.length,
      triggers: ST.getAll().length,
      gl: document.querySelectorAll('.fx-gl.is-ready').length,
      gallery: !!document.querySelector('.fx-gallery canvas'),
    }),
  };
}

// ---------------------------------------------------------------------------
// Smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger stays synced.
// ---------------------------------------------------------------------------
function setupSmoothScroll() {
  if (reduced || !window.Lenis) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, allowNestedScroll: true, anchors: false, autoRaf: false });
  lenis.on('scroll', ST.update);
  G.ticker.add((t) => lenis.raf(t * 1000));
  G.ticker.lagSmoothing(0);
  window.__fxLenis = lenis;

  // Pause while a modal locks page scroll (overflow:hidden on html/body).
  const sync = () => {
    const locked = [document.body, html].some((n) => n.style.overflow === 'hidden' || n.style.overflowY === 'hidden');
    locked ? lenis.stop() : lenis.start();
  };
  const mo = new MutationObserver(sync);
  mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  mo.observe(html, { attributes: true, attributeFilter: ['style'] });
  return lenis;
}

// ---------------------------------------------------------------------------
// Curtain: intro cover on load, 3D wipe between pages, same-page anchor scroll.
// ---------------------------------------------------------------------------
function setupCurtain(lenis) {
  const curtain = make(
    'div',
    'fx-curtain',
    '<div class="fx-curtain__panel fx-curtain__panel--ink"></div>' +
      '<div class="fx-curtain__panel fx-curtain__panel--blue"><div class="fx-curtain__logo"></div>' +
      '<div class="fx-curtain__bar"><i></i></div></div>'
  );
  curtain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(curtain);
  const ink = curtain.querySelector('.fx-curtain__panel--ink');
  const blue = curtain.querySelector('.fx-curtain__panel--blue');
  const logo = curtain.querySelector('.fx-curtain__logo');
  const bar = curtain.querySelector('.fx-curtain__bar i');
  const covered = html.classList.contains('fx-cover');
  const fromLoad = html.classList.contains('fx-from-load');

  if (covered) curtain.classList.add('is-active');
  html.classList.remove('fx-cover');

  function lift(fast) {
    if (!curtain.classList.contains('is-active')) return Promise.resolve();
    return new Promise((resolve) => {
      const tl = G.timeline({
        onComplete() {
          curtain.classList.remove('is-active');
          G.set([ink, blue, logo, bar], { clearProps: 'all' });
          resolve();
        },
      });
      G.set([ink, blue], { transformOrigin: '50% 0%' });
      if (fromLoad && !fast) tl.to(bar, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' });
      tl.to(logo, { yPercent: -140, rotationX: 75, opacity: 0, duration: 0.35, ease: 'power3.in' }, fast ? 0 : '-=0.05')
        .to(blue, { yPercent: -100, rotationX: 14, duration: 0.85, ease: 'expo.inOut' }, '-=0.15')
        .to(ink, { yPercent: -100, rotationX: 10, duration: 0.85, ease: 'expo.inOut' }, '<0.08');
    });
  }

  function leave(href) {
    if (reduced) { location.href = href; return; }
    curtain.classList.add('is-active');
    G.set([ink, blue], { yPercent: 100, rotationX: -14, transformOrigin: '50% 100%' });
    G.set(logo, { yPercent: 140, rotationX: -75, opacity: 0 });
    G.set(bar, { scaleX: 0 });
    G.timeline({
      onComplete() {
        try { sessionStorage.setItem('fx-nav', '1'); } catch (e) {}
        location.href = href;
      },
    })
      .to(ink, { yPercent: 0, rotationX: 0, duration: 0.7, ease: 'expo.inOut' })
      .to(blue, { yPercent: 0, rotationX: 0, duration: 0.7, ease: 'expo.inOut' }, '<0.09')
      .to(logo, { yPercent: 0, rotationX: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }, '-=0.3')
      .to(bar, { scaleX: 0.35, duration: 0.3, ease: 'power1.out' }, '<');
  }

  function isInternal(a, e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
    if (!a || !a.href || a.hasAttribute('download')) return null;
    if (a.target && a.target !== '_self') return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (/\.(pdf|mp4|webm|zip|jpe?g|png|webp|svg|xml|txt)$/i.test(url.pathname)) return null;
    return url;
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    const url = isInternal(a, e);
    if (!url) return;
    const samePage = url.pathname === location.pathname && url.search === location.search;
    if (samePage && url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -84, duration: 1.4 });
        history.pushState(null, '', url.hash);
      }
      return;
    }
    if (samePage) return;
    e.preventDefault();
    leave(url.href);
  });

  // Warm the next page while the pointer is on its link.
  const prefetched = new Set();
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || prefetched.has(url.pathname)) return;
    prefetched.add(url.pathname);
    const l = make('link');
    l.rel = 'prefetch';
    l.href = url.pathname;
    document.head.appendChild(l);
  }, { passive: true });

  // Back/forward cache restores the page with the curtain still down.
  window.addEventListener('pageshow', (e) => { if (e.persisted) lift(true); });

  // revealAt: when the hero intro starts, i.e. while the panels are mid-lift.
  return { lift: () => lift(false), leave, revealAt: covered ? (fromLoad ? 0.7 : 0.4) : 0 };
}

function setupProgress() {
  if (reduced) return;
  const bar = make('div', 'fx-progress');
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  G.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: html, start: 0, end: 'max', scrub: 0.3 },
  });
}

// ---------------------------------------------------------------------------
// Hero: 3D headline flip, staggered copy, tilted card wall.
// ---------------------------------------------------------------------------
function findHero() {
  const first = document.querySelector('main section');
  if (!first) return null;
  const r = first.getBoundingClientRect();
  return r.top < window.innerHeight ? first : null;
}

function heroColumn(hero) {
  const h1 = hero.querySelector('h1') || hero.querySelector('h2');
  if (!h1) return { h1: null, items: [] };
  let col = h1.parentElement;
  while (col && col !== hero && col.children.length < 3) col = col.parentElement;
  const items = col && col !== hero
    ? [...col.children].filter((n) => !/^(STYLE|SCRIPT|TEMPLATE)$/.test(n.tagName) && n.offsetHeight > 0)
    : [h1];
  return { h1, items };
}

function buildHeroIntro(hero, tl) {
  const { h1, items } = heroColumn(hero);
  const visual = hero.querySelector('.fbf-hero-visual, .svc-hero-visual');
  const rest = items.filter((n) => n !== h1 && !n.contains(h1) && n !== visual && !(visual && n.contains(visual)));
  const all = [];

  if (h1) {
    const headline = items.find((n) => n === h1 || n.contains(h1)) || h1;
    hold(headline);
    G.set(headline, { opacity: 0, yPercent: 40, rotationX: -75, transformPerspective: 1000, transformOrigin: '50% 100%' });
    tl.to(headline, { opacity: 1, yPercent: 0, rotationX: 0, duration: 1.35, ease: 'expo.out' }, 0.05);
    all.push(headline);
  }
  if (rest.length) {
    rest.forEach((n) => { hold(n); all.push(n); });
    G.set(rest, { opacity: 0, y: 38, rotationX: -28, transformPerspective: 900, transformOrigin: '50% 0%' });
    tl.to(rest, { opacity: 1, y: 0, rotationX: 0, duration: 1.05, ease: 'power3.out', stagger: 0.075 }, 0.18);
  }
  tl.eventCallback('onComplete', () => all.forEach(release));

  if (visual) setupWall(hero, visual, tl);
}

// The live hero / wall / 3D layer. React may swap these nodes out if an island
// fails to hydrate cleanly and re-renders, so afterHydrate() re-binds them.
const live = { hero: null, floaters: null, wall: null, wallRest: null, qx: null, qy: null, wallScroll: null };

function setupWall(hero, visual, tl) {
  if (!bindWall(hero, visual)) return;
  G.set(visual, { opacity: 0, x: isNarrow() ? 0 : 160, y: isNarrow() ? 60 : 0, rotationY: isNarrow() ? 0 : -38, z: -260, transformPerspective: 1700 });
  tl.to(visual, { opacity: 1, x: 0, y: 0, rotationY: 0, z: 0, duration: 1.7, ease: 'expo.out' }, 0.12);
}

// Rest pose, pointer parallax and scroll lean for the tilted card wall.
function bindWall(hero, visual) {
  const wall = visual.querySelector('.fbf-wall');
  if (!wall) return false;
  const REST = isNarrow() ? { ry: 0, rx: 8, rz: 0 } : { ry: -13, rx: 7, rz: 1.2 };
  live.wall = wall;
  live.wallRest = REST;

  G.set(visual, { perspective: 1700, transformPerspective: 1700 });
  G.set(wall, { rotationY: REST.ry, rotationX: REST.rx, rotationZ: REST.rz, transformOrigin: '50% 50%' });

  if (!isNarrow() && finePointer) {
    live.qy = G.quickTo(wall, 'rotationY', { duration: 1.4, ease: 'power3' });
    live.qx = G.quickTo(wall, 'rotationX', { duration: 1.4, ease: 'power3' });
    if (!bindWall.listening) {
      bindWall.listening = true;
      window.addEventListener('pointermove', (e) => {
        if (!live.qx) return;
        live.qy(live.wallRest.ry + (e.clientX / window.innerWidth - 0.5) * 12);
        live.qx(live.wallRest.rx - (e.clientY / window.innerHeight - 0.5) * 9);
      }, { passive: true });
    }
  }

  // As the hero scrolls away the wall leans back into the page. (Driven on the
  // wrapper: the wall's own rotation belongs to the pointer.)
  if (live.wallScroll) {
    live.wallScroll.scrollTrigger.kill();
    live.wallScroll.kill();
  }
  live.wallScroll = G.to(visual, {
    rotationX: 16,
    scale: 0.94,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  return true;
}

// If React replaced the hero while hydrating, move the wall pose and 3D layer
// onto the new nodes (no intro — the page is already on screen).
function rebindHero() {
  if (!live.hero || live.hero.isConnected) return;
  const next = document.querySelector('main section');
  if (!next) return;
  live.hero = next;
  const visual = next.querySelector('.fbf-hero-visual, .svc-hero-visual');
  if (visual && !reduced) bindWall(next, visual);
  if (live.floaters) live.floaters.setHost(next, heroLayout(next));
}

// ---------------------------------------------------------------------------
// Scroll reveals. The islands are inline-styled React, so targets are found by
// shape: headings, copy, media, and "card" boxes sitting in grids/flex rows.
// ---------------------------------------------------------------------------
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'svg', 'IFRAME', 'BR', 'HR', 'CANVAS', 'SOURCE', 'PATH']);
const SKIP_SEL = 'header, .fbf-hero-visual, .svc-hero-visual, .fx-gallery, .fx-funnel, [data-fx-skip], [aria-hidden="true"]';

function isTransparent(c) {
  return !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
}

function boxy(cs) {
  const bg = !isTransparent(cs.backgroundColor) || (cs.backgroundImage && cs.backgroundImage !== 'none');
  const border = parseFloat(cs.borderTopWidth) >= 1 || parseFloat(cs.borderLeftWidth) >= 1;
  const shadow = cs.boxShadow && cs.boxShadow !== 'none';
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  return ((bg || border || shadow) && radius >= 6) || (shadow && bg);
}

function scanReveals(hero) {
  const targets = [];
  const vh = window.innerHeight;
  const add = (el, type) => {
    if (targets.length > 420) return;
    el.setAttribute('data-fx-reveal', type);
    targets.push({ el, type });
  };

  function visit(el) {
    if (SKIP_TAGS.has(el.tagName) || el.matches(SKIP_SEL)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    if (cs.display === 'contents') { for (const k of el.children) visit(k); return; }
    if (cs.animationName && cs.animationName !== 'none') return; // marquees etc.
    if (cs.position === 'fixed' || cs.position === 'sticky') return;
    const tag = el.tagName;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;

    if (/^H[1-4]$/.test(tag)) return add(el, 'head');
    if (tag === 'P' || tag === 'LI' || tag === 'BLOCKQUOTE') return add(el, 'text');
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'PICTURE') {
      if (w >= 140 && h >= 100) add(el, 'media');
      return;
    }
    if ((tag === 'A' || tag === 'BUTTON') && boxy(cs) && h >= 28 && h <= 76) return add(el, 'btn');
    if (!el.children.length) {
      // Short mono "// eyebrow" labels.
      if (/mono/i.test(cs.fontFamily) && el.textContent.trim().length > 1) add(el, 'text');
      return;
    }

    const kids = [...el.children].filter((k) => !SKIP_TAGS.has(k.tagName) && k.offsetHeight > 0);
    if (/(grid|flex)/.test(cs.display) && kids.length >= 2) {
      const cards = kids.filter((k) => {
        if (k.matches(SKIP_SEL)) return false;
        const kcs = getComputedStyle(k);
        return boxy(kcs) && kcs.animationName === 'none' && k.offsetWidth >= 100 && k.offsetHeight >= 60 &&
          k.offsetHeight < vh * 1.15 && kcs.position !== 'absolute' && kcs.position !== 'fixed';
      });
      if (cards.length >= 2) {
        kids.forEach((k) => (cards.includes(k) ? add(k, 'card') : visit(k)));
        return;
      }
    }
    // A lone panel (form, pricing box, CTA card…) that fits on screen.
    if (boxy(cs) && w >= 240 && h >= 140 && h < vh * 1.1 && cs.position !== 'absolute') return add(el, 'card');
    for (const k of kids) visit(k);
  }

  document.querySelectorAll('main section, main footer').forEach((sec) => {
    if (sec === hero || sec.closest('.fx-gallery, .fx-funnel')) return;
    if (sec.parentElement && sec.parentElement.closest('section, footer')) return; // nested
    for (const k of sec.children) visit(k);
  });
  return targets;
}

// Hidden start states. `rectOf` gives each element's pre-measured box.
const FROM = {
  head: () => ({ opacity: 0, yPercent: 35, rotationX: -62, transformPerspective: 900, transformOrigin: '50% 100%' }),
  text: () => ({ opacity: 0, y: 26, rotationX: -16, transformPerspective: 900, transformOrigin: '50% 0%' }),
  btn: () => ({ opacity: 0, y: 18, scale: 0.88 }),
  media: () => ({ opacity: 0, scale: 1.12, clipPath: 'inset(14% 10% 14% 10% round 22px)' }),
  // Cards lean in from their side of the screen, so a row unfolds outward.
  card: (rectOf) => ({
    opacity: 0, y: 90, z: -160, rotationX: 24,
    rotationY: (i, el) => {
      const r = rectOf.get(el);
      return ((r.left + r.width / 2) / window.innerWidth - 0.5) * 22;
    },
    transformPerspective: 1200, transformOrigin: '50% 100%',
  }),
};
const TO = {
  head: { opacity: 1, yPercent: 0, rotationX: 0, duration: 1.15, ease: 'expo.out' },
  text: { opacity: 1, y: 0, rotationX: 0, duration: 0.9, ease: 'power3.out' },
  btn: { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.8)' },
  media: { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.3, ease: 'expo.out' },
  card: { opacity: 1, y: 0, z: 0, rotationX: 0, rotationY: 0, duration: 1.2, ease: 'expo.out' },
};

function setupReveals(targets, intro) {
  const vh = window.innerHeight;
  // Read phase: measure every target (and let GSAP cache its transform) before
  // any style is written, so the page lays out once instead of per element.
  const rectOf = new Map();
  for (const t of targets) {
    G.getProperty(t.el, 'x');
    rectOf.set(t.el, t.el.getBoundingClientRect());
  }
  // Write phase: one set() per type, so GSAP reads all starts then writes all.
  const byType = {};
  for (const t of targets) {
    hold(t.el);
    (byType[t.type] = byType[t.type] || []).push(t.el);
  }
  for (const type in byType) G.set(byType[type], FROM[type](rectOf));

  const later = [];
  let introIndex = 0;
  for (const t of targets) {
    if (rectOf.get(t.el).top < vh * 0.92) {
      // Already on screen at load: join the intro after the hero copy.
      intro.to(t.el, { ...TO[t.type], onComplete: () => release(t.el) }, 0.55 + Math.min(introIndex++, 8) * 0.07);
    } else {
      later.push(t.el);
    }
  }

  // IntersectionObserver rather than ~100 ScrollTriggers: nothing to
  // re-measure on every refresh. Items entering together are staggered.
  const shown = new WeakSet();
  const reveal = (el, delay) => {
    if (shown.has(el)) return;
    shown.add(el);
    io.unobserve(el);
    G.to(el, { ...TO[el.getAttribute('data-fx-reveal')], delay, onComplete: () => release(el) });
  };
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => rectOf.get(a).top - rectOf.get(b).top || rectOf.get(a).left - rectOf.get(b).left)
      .forEach((el, i) => reveal(el, Math.min(i, 8) * 0.075));
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
  later.forEach((el) => io.observe(el));

  // Anything in the last strip of the page can never cross the -6% line.
  const flushAtEnd = () => {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
    let i = 0;
    later.forEach((el) => { if (!shown.has(el)) reveal(el, Math.min(i++, 6) * 0.06); });
  };
  window.addEventListener('scroll', flushAtEnd, { passive: true });

  // Backup sweep: IntersectionObserver callbacks are low priority and can
  // starve when the main thread is saturated (e.g. WebGL on a machine without
  // a GPU), which would leave content hidden. A cheap timer catches anything
  // on screen that the observer missed.
  const sweep = setInterval(() => {
    const vh = window.innerHeight;
    let pending = 0, i = 0;
    for (const el of later) {
      if (shown.has(el)) continue;
      pending++;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) reveal(el, Math.min(i++, 8) * 0.075);
    }
    if (!pending) clearInterval(sweep);
  }, 200);
}

// Images inside clipped frames drift against the scroll for a sense of depth.
function setupImageDepth(hero) {
  let n = 0;
  document.querySelectorAll('main section img').forEach((img) => {
    if (n > 60 || (hero && hero.contains(img)) || img.closest(SKIP_SEL) || img.hasAttribute('data-fx-reveal')) return;
    const frame = img.parentElement;
    if (!frame || img.offsetWidth < 180 || img.offsetHeight < 180) return;
    const cs = getComputedStyle(frame);
    if (cs.overflow === 'visible' && cs.overflowY === 'visible') return;
    if (getComputedStyle(img).animationName !== 'none') return;
    n++;
    G.fromTo(img, { yPercent: -3, scale: 1.07 }, {
      yPercent: 3,
      scale: 1.07,
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// ---------------------------------------------------------------------------
// Pointer effects (desktop only): cursor ring, 3D tilt + glare, magnetic CTAs.
// ---------------------------------------------------------------------------
function setupCursor() {
  const ring = make('div', 'fx-cursor', '<span class="fx-cursor__label"></span>');
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  const label = ring.firstChild;
  const qx = G.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const qy = G.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

  document.querySelectorAll('img[src^="/reviews/"], video').forEach((m) => {
    const host = m.parentElement;
    if (host && !host.closest('header')) host.setAttribute('data-fx-cursor', 'Play');
  });

  let mode = '';
  const setMode = (m, text) => {
    if (m === mode && label.textContent === (text || '')) return;
    mode = m;
    ring.classList.toggle('is-link', m === 'link');
    ring.classList.toggle('is-media', m === 'media');
    label.textContent = text || '';
  };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    html.classList.add('fx-has-cursor');
    qx(e.clientX);
    qy(e.clientY);
    const t = e.target;
    if (!t.closest) return;
    const gallery = t.closest('.fx-gallery');
    if (gallery && !t.closest('a')) return setMode('media', gallery.classList.contains('is-over-card') ? 'View' : 'Drag');
    const media = t.closest('[data-fx-cursor]');
    if (media) return setMode('media', media.getAttribute('data-fx-cursor'));
    if (t.closest('a, button, [role="button"], label, summary, select, input[type="submit"]')) return setMode('link');
    if (t.closest('[data-fx-drag]')) return setMode('media', 'Drag');
    setMode('');
  }, { passive: true });
  document.addEventListener('mouseleave', () => html.classList.remove('fx-has-cursor'));
  window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'));
}

function setupTilt(targets) {
  targets
    .filter(({ el, type }) => {
      if (type !== 'card') return false;
      const w = el.offsetWidth, h = el.offsetHeight;
      return w >= 150 && w <= 780 && h >= 110 && h <= 780;
    })
    .forEach(({ el }) => el.setAttribute('data-fx-tilt', '1'));

  // Per-element tilt state: { q: quickTo setters } while tilting; `off` after a
  // click until the pointer leaves.
  const tilt = new WeakMap();
  const glareChecked = new WeakSet();
  let active = null;
  let rect = null;
  let rectScroll = 0;

  function allowGlare(el) {
    if (glareChecked.has(el)) return;
    glareChecked.add(el);
    // Glare needs a positioned box; only add one where it can't move children.
    const pos = getComputedStyle(el).position;
    if (pos !== 'static') el.setAttribute('data-fx-tilt', 'glare');
    else if (!el.querySelector('[style*="position:absolute"],[style*="position: absolute"]')) {
      el.style.position = 'relative';
      el.setAttribute('data-fx-tilt', 'glare');
    }
  }

  function enter(el) {
    const s = tilt.get(el);
    if (s) return !s.off;
    if (SAVED.has(el)) return false; // still revealing
    allowGlare(el);
    hold(el);
    G.set(el, { transformPerspective: 1000 });
    tilt.set(el, {
      rx: G.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' }),
      ry: G.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' }),
      s: G.quickTo(el, 'scale', { duration: 0.6, ease: 'power3' }),
    });
    rect = el.getBoundingClientRect();
    rectScroll = window.scrollY;
    return true;
  }

  function drop(el) {
    G.killTweensOf(el);
    el.style.setProperty('--fx-glare', '0');
    tilt.delete(el);
    release(el);
  }

  function leave(el) {
    const s = tilt.get(el);
    if (!s) return;
    if (s.off) { tilt.delete(el); return; }
    el.style.setProperty('--fx-glare', '0');
    s.rx(0); s.ry(0); s.s(1);
    G.delayedCall(0.65, () => { if (active !== el && tilt.get(el) === s) drop(el); });
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest ? e.target.closest('[data-fx-tilt]') : null;
    if (el !== active) {
      if (active) leave(active);
      active = el;
      if (el) { rect = el.getBoundingClientRect(); rectScroll = window.scrollY; }
    }
    if (!el || !enter(el)) return;
    if (window.scrollY !== rectScroll) { rect = el.getBoundingClientRect(); rectScroll = window.scrollY; }
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const max = Math.min(9, Math.max(3, 1500 / Math.max(rect.width, rect.height)));
    const s = tilt.get(el);
    s.ry((px - 0.5) * max * 2);
    s.rx(-(py - 0.5) * max * 2);
    s.s(1.015);
    el.style.setProperty('--fx-mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--fx-my', (py * 100).toFixed(1) + '%');
    el.style.setProperty('--fx-glare', '1');
  }, { passive: true });

  // A click may open a modal rendered inside the card: drop the transform at
  // once so position:fixed children aren't trapped by it.
  window.addEventListener('pointerdown', (e) => {
    const el = e.target.closest && e.target.closest('[data-fx-tilt]');
    if (!el || !tilt.has(el) || tilt.get(el).off) return;
    drop(el);
    tilt.set(el, { off: true });
  }, true);
}

function setupMagnetic() {
  // Only real CTA buttons: compact, short label, nothing clickable inside
  // (a tile that drifts under the cursor makes its inner controls hard to hit).
  const els = [...document.querySelectorAll('a, button')].filter((el) => {
    if (el.closest('.fx-gallery, .fbf-wall')) return false;
    const h = el.offsetHeight, w = el.offsetWidth;
    if (h < 30 || h > 60 || w < 60 || w > 280 || el.textContent.trim().length > 30) return false;
    if (el.querySelector('a, button, input, select, textarea, [role="button"], [title], [onclick]')) return false;
    const cs = getComputedStyle(el);
    return !isTransparent(cs.backgroundColor) && parseFloat(cs.borderTopLeftRadius) >= 6;
  });

  // Read everything, then write (see setupReveals).
  const plans = els.map((el) => {
    const cs = getComputedStyle(el);
    const [r, g, b] = (cs.backgroundColor.match(/\d+(\.\d+)?/g) || [255, 255, 255]).map(Number);
    const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 150;
    const hasAbs = el.querySelector('[style*="position:absolute"],[style*="position: absolute"]');
    return { el, shine: dark && !hasAbs, makeRelative: dark && !hasAbs && cs.position === 'static' };
  });
  plans.forEach(({ el, shine, makeRelative }) => {
    if (makeRelative) el.style.position = 'relative';
    el.setAttribute('data-fx-mag', shine ? 'shine' : '1');

    let qx, qy;
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || SAVED.has(el)) return;
      hold(el);
      qx = G.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      qy = G.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    });
    const cap = (v) => Math.max(-10, Math.min(10, v));
    el.addEventListener('pointermove', (e) => {
      if (!qx) return;
      const r = el.getBoundingClientRect();
      qx(cap((e.clientX - (r.left + r.width / 2)) * 0.28));
      qy(cap((e.clientY - (r.top + r.height / 2)) * 0.36));
    });
    el.addEventListener('pointerleave', () => {
      if (!qx) return;
      qx = qy = null;
      G.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)', overwrite: true, onComplete: () => release(el) });
    });
  });
}

// ---------------------------------------------------------------------------
// After each island hydrates: count-ups, animated tab/filter swaps, re-measure.
// ---------------------------------------------------------------------------
// On single-island pages new sections have to go inside React-owned DOM,
// just before a section picked by its heading. Adding them before React has
// claimed that part of the page would cause a hydration mismatch and React
// would throw them away, so wait until the anchor is hydrated — or until the
// island reports that it failed to hydrate (then React never touches the DOM).
function placeInIsland(headingMatchers, build) {
  const island = islands[0];
  if (!island) return;
  const sections = [...island.querySelectorAll('section')];
  const heading = (sec) => (sec.querySelector('h2') || {}).textContent || '';
  let anchor = null;
  for (const re of headingMatchers) {
    anchor = sections.find((sec) => re.test(heading(sec)));
    if (anchor) break;
  }
  if (!anchor) return;

  let placed = false;
  const place = () => {
    if (placed || !anchor.isConnected) return;
    placed = true;
    build(anchor);
    scheduleRefresh();
  };
  island.addEventListener('astro:hydration-error', place, { once: true });
  whenHydrated(island).then(() => {
    let tries = 0;
    const wait = () => (reactOwned(anchor) || tries++ > 50 ? place() : setTimeout(wait, 100));
    wait();
  });
}

function afterHydrate(island) {
  scheduleRefresh();
  // A hydration-mismatch re-render replaces the island's children (and lands
  // after astro:hydrate, which fires when React only *starts* hydrating).
  rebindHero();
  new MutationObserver(rebindHero).observe(island, { childList: true });
  if (reduced) return;
  setupCounters(island);
  watchSwaps(island);
}

// True once React has hydrated (claimed) this DOM node.
function reactOwned(el) {
  return Object.keys(el).some((k) => k.startsWith('__reactFiber$'));
}

function setupCounters(root) {
  const re = /^(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?([+%x×kK]?)$/;
  let n = 0;
  root.querySelectorAll('b, strong, span, div, p, h2, h3, h4').forEach((el) => {
    if (n >= 24 || el.children.length || el.childNodes.length !== 1 || el.closest(SKIP_SEL)) return;
    const node = el.firstChild;
    if (node.nodeType !== 3) return;
    const text = node.nodeValue.trim();
    const m = text.match(re);
    if (!m || parseFloat(getComputedStyle(el).fontSize) < 24) return;
    n++;
    const original = node.nodeValue;
    const dec = m[2] ? m[2].length - 1 : 0;
    const commas = m[1].includes(',');
    const value = parseFloat(m[1].replace(/,/g, '') + (m[2] || ''));
    const fmt = (v) => {
      let s = v.toFixed(dec);
      if (commas) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return s + m[3];
    };
    let tries = 0;
    const count = () => {
      // Astro fires astro:hydrate when React *starts* its concurrent hydration.
      // Rewriting the text before React has claimed this node would make it
      // throw a text mismatch (#418) and re-render the island, so wait (and
      // give up if React replaced the node instead).
      if (!el.isConnected || tries > 40) return;
      if (!reactOwned(el)) { tries++; return setTimeout(count, 250); }
      const o = { v: 0 };
      G.to(o, {
        v: value,
        duration: 1.8,
        ease: 'power3.out',
        onUpdate: () => { node.nodeValue = fmt(o.v); },
        onComplete: () => { node.nodeValue = original; },
      });
    };
    ST.create({ trigger: el, start: 'clamp(top 92%)', once: true, onEnter: count });
  });
}

// Tabs and filters swap cards in place — flip the newcomers in with a 3D turn.
function watchSwaps(island) {
  let queue = [];
  let raf = 0;
  const flush = () => {
    raf = 0;
    const vh = window.innerHeight;
    const items = queue.filter((n) => {
      if (!n.isConnected || n.closest('header') || n.closest(SKIP_SEL)) return false;
      const r = n.getBoundingClientRect();
      if (r.width < 90 || r.height < 70 || r.bottom < 0 || r.top > vh) return false;
      const p = n.parentElement;
      if (!p || p.hasAttribute('data-fx-stage')) return false; // stages animate their own swaps
      if (p.children.length < 3 || !/(grid|flex)/.test(getComputedStyle(p).display)) return false;
      const cs = getComputedStyle(n);
      return cs.position !== 'fixed' && cs.position !== 'absolute';
    }).slice(0, 40);
    queue = [];
    items.forEach((el, i) => {
      if (SAVED.has(el)) return;
      hold(el);
      G.set(el, { opacity: 0, y: 24, rotationY: -32, transformPerspective: 900, transformOrigin: '0% 50%' });
      G.to(el, { opacity: 1, y: 0, rotationY: 0, duration: 0.75, delay: i * 0.035, ease: 'expo.out', onComplete: () => release(el) });
    });
  };
  new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => n.nodeType === 1 && queue.push(n));
    if (queue.length && !raf) raf = requestAnimationFrame(flush);
  }).observe(island, { childList: true, subtree: true });
}

// ---------------------------------------------------------------------------
// WebGL components.
// ---------------------------------------------------------------------------
function mount3D(hero, intro) {
  if (page.legal) return;
  const load = () => Promise.all([import('./three/kit.js'), import('./three/floaters.js')]);
  const ready = load().then(([kit, mod]) => (kit.webglAvailable() ? mod : null)).catch(() => null);

  if (hero) {
    ready.then((mod) => {
      if (!mod) return;
      const host = live.hero && live.hero.isConnected ? live.hero : hero;
      const f = mod.mountFloaters({
        host,
        layout: heroLayout(host),
        gsap: G,
        reduced,
        maxDpr: isNarrow() ? 1.5 : 2,
      });
      live.floaters = f;
      const start = () => f.intro(0.25);
      if (reduced || !intro.duration() || intro.progress() > 0 || intro.isActive()) start();
      else intro.eventCallback('onStart', start);
    });
  }

  document.querySelectorAll('.fbe-cta-card').forEach((card) => {
    const io = new IntersectionObserver((list) => { const e = list[list.length - 1]; // latest state wins
      if (!e.isIntersecting) return;
      io.disconnect();
      ready.then((mod) => {
        if (!mod) return;
        const f = mod.mountFloaters({
          host: card,
          layout: ctaLayout,
          gsap: G,
          reduced,
          pad: isNarrow() ? 30 : 90,
          scrollOut: false,
          maxDpr: isNarrow() ? 1.5 : 2,
        });
        ST.create({ trigger: card, start: 'top 80%', once: true, onEnter: () => f.intro(0) });
      });
    }, { rootMargin: '600px 0px' });
    io.observe(card);
  });
}

// Where the hero's floating icons sit, in hero-local px.
function heroLayout(hero) {
  const wall = hero.querySelector('.fbf-wall');
  return ({ width, height }) => {
    if (wall && wall.offsetWidth) {
      const b = layoutBox(wall, hero);
      const X = (f) => b.x + f * b.w;
      const Y = (f) => b.y + f * b.h;
      if (isNarrow()) {
        // On phones the wall sits below the copy, so keep two icons up top
        // beside the (centred) rating row as well.
        return [
          { kind: 'heart', x: 34, y: 66, size: 44, z: 2 },
          { kind: 'star', x: width - 34, y: 92, size: 36, z: 2 },
          { kind: 'play', x: X(0.96), y: Y(0.22), size: 66, z: 1 },
          { kind: 'bubble', x: X(0.05), y: Y(0.62), size: 58, z: 2 },
        ];
      }
      return [
        { kind: 'heart', x: X(0.01), y: Y(0.17), size: 92, z: 2 },
        { kind: 'play', x: X(1.0), y: Y(0.33), size: 108, z: 1 },
        { kind: 'bubble', x: X(0.03), y: Y(0.76), size: 100, z: 2.5 },
        { kind: 'star', x: X(0.8), y: Y(0.96), size: 70, z: 3 },
        { kind: 'ring', x: X(0.97), y: Y(0.79), size: 62, z: -1 },
        { kind: 'pearl', x: X(0.44), y: Y(0.02), size: 34, z: 1 },
        { kind: 'sphere', x: X(-0.07), y: Y(0.47), size: 24, z: 0 },
        { kind: 'capsule', x: Math.min(width - 30, X(1.0) + 60), y: Y(0.06), size: 40, z: -2 },
      ];
    }
    return sideLayout(hero, width, height);
  };
}

function sideLayout(hero, width, height) {
  // Frame the headline band (heading → subtitle/CTAs) rather than the whole
  // section, which on some pages runs far below the fold.
  const h1 = hero.querySelector('h1') || hero.querySelector('h2');
  const hb = h1 ? layoutBox(h1, hero) : { y: 0, h: 0 };
  // Heading plus roughly a subtitle's height below it; anything further down
  // (forms, pricing panels…) is left clear.
  const top = Math.max(0, hb.y - 90);
  const bottom = Math.max(top + 160, Math.min(height, hb.y + hb.h + 150, window.innerHeight - 40));
  const Y = (f) => top + f * (bottom - top);

  // Horizontal extent of readable/interactive content inside that band.
  let L = width, R = 0;
  hero.querySelectorAll('h1, h2, p, a, button, input, textarea, select, form, img, video').forEach((n) => {
    if (!n.offsetWidth || n.closest('header')) return;
    const b = layoutBox(n, hero);
    if (b.w > width * 0.95 || b.y + b.h < top || b.y > bottom) return;
    L = Math.min(L, b.x);
    R = Math.max(R, b.x + b.w);
  });
  if (R <= L) { L = width * 0.3; R = width * 0.7; }
  const left = L, right = width - R;

  if (isNarrow()) {
    return [
      { kind: 'heart', x: width - 34, y: top + 30, size: 46, z: 1 },
      { kind: 'star', x: 28, y: bottom - 24, size: 38, z: 2 },
      { kind: 'pearl', x: width - 22, y: Y(0.62), size: 22, z: 0 },
    ];
  }
  const items = [];
  if (left > 150) {
    items.push({ kind: 'heart', x: left * 0.5, y: Y(0.3), size: Math.min(104, left * 0.55), z: 2 });
    items.push({ kind: 'bubble', x: left * 0.58, y: Y(0.78), size: Math.min(92, left * 0.5), z: 1 });
    items.push({ kind: 'pearl', x: left * 0.2, y: Y(0.55), size: 26, z: 0 });
  } else {
    items.push({ kind: 'heart', x: 56, y: Y(0.9), size: 64, z: 2 });
  }
  if (right > 150) {
    items.push({ kind: 'play', x: width - right * 0.5, y: Y(0.32), size: Math.min(108, right * 0.58), z: 2 });
    items.push({ kind: 'star', x: width - right * 0.55, y: Y(0.8), size: Math.min(74, right * 0.42), z: 1.5 });
    items.push({ kind: 'ring', x: width - right * 0.18, y: Y(0.06), size: 46, z: -1 });
  } else {
    items.push({ kind: 'play', x: width - 64, y: Y(0.12), size: 70, z: 1 });
    items.push({ kind: 'star', x: width - 40, y: Y(0.92), size: 44, z: 2 });
  }
  return items;
}

function ctaLayout({ width, height }) {
  const pad = isNarrow() ? 30 : 90;
  const X = (f) => f * width;
  const Y = (f) => f * height;
  if (isNarrow()) {
    return [
      { kind: 'heart', x: X(0.1), y: Y(0.0), size: 52, z: 2 },
      { kind: 'play', x: X(0.92), y: Y(1.0), size: 56, z: 2 },
    ];
  }
  return [
    { kind: 'heart', x: X(0.07), y: Y(0.22), size: 112, z: 2 },
    { kind: 'bubble', x: X(0.15), y: Y(0.86), size: 92, z: 3 },
    { kind: 'pearl', x: X(0.01), y: Y(0.62), size: 40, z: 1 },
    { kind: 'play', x: X(0.92), y: Y(0.26), size: 116, z: 2 },
    { kind: 'star', x: X(0.85), y: Y(0.9), size: 78, z: 3 },
    { kind: 'ring', x: X(0.995), y: Y(0.68), size: 56, z: 0 },
  ].map((i) => ({ ...i, y: Math.max(-pad * 0.6, i.y) }));
}

// ---------------------------------------------------------------------------
// Homepage 3D gallery section (inserted between islands, outside React).
// ---------------------------------------------------------------------------
const GALLERY_IMAGES = [
  ['/img/ex/feat-manaia-surf-aerial.webp', 1080, 1350],
  ['/assets/work/story-sunglasses.webp', 409, 820],
  ['/img/ex/feat-thecups-koreanicecup.webp', 1080, 1350],
  ['/assets/work/carousel-holiday.webp', 650, 820],
  ['/assets/work/ugc-mic.webp', 461, 820],
  ['/img/ex/feat-kingrilla-whatsinit.webp', 1080, 1350],
  ['/assets/work/email-glow.webp', 483, 820],
  ['/img/ex/feat-crenshaw-dreamapt.webp', 1080, 1350],
  ['/assets/work/social-citrus.webp', 673, 820],
  ['/assets/work/video-plane.webp', 461, 820],
  ['/img/ex/feat-lessbooze-mocktails.webp', 1080, 1350],
  ['/assets/work/carousel-caffeine.webp', 650, 820],
  ['/assets/work/story-yoga.webp', 409, 820],
  ['/img/ex/feat-priceco-tallhorse.webp', 1080, 1350],
  ['/assets/work/ugc-handmade.webp', 461, 820],
  ['/assets/work/email-body.webp', 482, 820],
  ['/img/ex/feat-millynnial-selfaware.webp', 1080, 1350],
  ['/assets/work/social-laundry.webp', 673, 820],
  ['/assets/work/ugc-sam.webp', 461, 820],
  ['/img/ex/feat-spinsudz-springcleaning.webp', 1080, 1350],
  ['/assets/work/carousel-driving.webp', 650, 820],
  ['/assets/work/email-health.webp', 482, 820],
  ['/assets/work/ugc-comment.webp', 461, 820],
].map(([src, w, h]) => ({ src, aspect: w / h }));

function setupGallery(curtain) {
  const anchor = islands.find((n) => n.getAttribute('component-export') === 'FBHomeBottom');
  if (!anchor) return;
  const sec = make(
    'section',
    'fx-gallery',
    '<div class="fx-gallery__stage"></div>' +
      '<div class="fx-gallery__copy"><p class="fx-gallery__eyebrow">// the work, in 3D</p>' +
      '<h2 class="fx-gallery__title">Content that stops <em>the scroll.</em></h2>' +
      '<div class="fx-gallery__row"><span class="fx-gallery__hint">drag to spin · scroll to explore</span>' +
      '<a class="fx-gallery__link" href="/examples/">See all examples <span aria-hidden="true">→</span></a></div></div>'
  );
  sec.setAttribute('aria-label', 'Portfolio showcase');
  anchor.parentNode.insertBefore(sec, anchor);
  const stage = sec.querySelector('.fx-gallery__stage');
  sec.querySelector('.fx-gallery__link').addEventListener('pointerdown', (e) => e.stopPropagation());

  let gallery = null;
  let progress = 0;
  if (!reduced) {
    ST.create({
      trigger: sec,
      start: 'top top',
      end: () => '+=' + Math.round(window.innerHeight * (isNarrow() ? 1.3 : 2.2)),
      pin: true,
      refreshPriority: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        progress = self.progress;
        if (gallery) gallery.setProgress(progress);
      },
    });
    const copy = sec.querySelectorAll('.fx-gallery__eyebrow, .fx-gallery__title, .fx-gallery__row');
    G.set(copy, { opacity: 0, y: 40, rotationX: -50, transformPerspective: 900, transformOrigin: '50% 100%' });
    G.to(copy, {
      opacity: 1, y: 0, rotationX: 0,
      duration: 1.1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: sec, start: 'top 70%', once: true },
    });
  }

  const io = new IntersectionObserver(async (list) => { const e = list[list.length - 1]; // latest state wins
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const [kit, mod] = await Promise.all([import('./three/kit.js'), import('./three/gallery.js')]);
      if (!kit.webglAvailable()) return;
      gallery = mod.mountGallery({
        section: sec,
        stage,
        images: GALLERY_IMAGES,
        gsap: G,
        reduced,
        onOpen: () => curtain.leave(new URL('/examples/', location.href).href),
      });
      gallery.setProgress(progress);
    } catch (err) {
      console.warn('[fx] gallery unavailable', err);
    }
  }, { rootMargin: '150% 0px' });
  io.observe(sec);
}

// ---------------------------------------------------------------------------
// Boot (last, so every module-level constant above is initialised).
// ---------------------------------------------------------------------------
if (!G || !ST) {
  html.classList.remove('fx-cover');
} else {
  G.registerPlugin(ST);
  try {
    init();
  } catch (err) {
    html.classList.remove('fx-cover');
    document.querySelectorAll('.fx-curtain').forEach((n) => n.remove());
    console.error('[fx] init failed', err);
  }
}

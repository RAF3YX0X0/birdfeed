// Case studies page: fullscreen slider (markup: scripts/build-cases.js, styles:
// cases.css), like a portfolio's fullscreen project slider.
//
// The section pins and each slide owns a stretch of scroll (--step). A wheel
// gesture or arrow key turns exactly one slide (trackpad momentum can't skip
// any); the first slide lets the page scroll up and the last lets it scroll on.
// Touch screens scroll natively with a snap point per slide. Prev / Next, the
// "+" list and the keys jump too. "Case study" opens the full story (from
// fx/cases.json) over the page, with its own #link.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STEP = 0.6; // scroll per slide, in screen heights

export function setupCases({ section, gsap: G, lenis, reduced }) {
  const slides = [...section.querySelectorAll('.csx__slide')];
  const N = slides.length;
  const stage = section.querySelector('.csx__stage');
  const frame = section.querySelector('.csx__frame');
  const track = section.querySelector('.csx__track i');
  const prevBtn = section.querySelector('.csx__prev');
  const nextBtn = section.querySelector('.csx__next');
  const root = document.documentElement;
  const slugs = slides.map((s) => s.dataset.slug);
  const parts = (s) => ({
    lines: s.querySelectorAll('.csx__line > span'),
    big: s.querySelector('.csx__big'),
    device: s.querySelector('.csx__device'),
    disc: s.querySelector('.csx__disc'),
    small: s.querySelectorAll('.csx__num, .csx__meta, .csx__link'),
  });

  // Opening a case (and the list) works in every mode.
  const overlays = setupOverlays({ section, slides, go: (i, o) => go(i, o), current: () => cur, gsap: G, reduced });
  const fromUrl = () => {
    const q = new URLSearchParams(location.search).get('case');
    const slug = q || decodeURIComponent(location.hash.slice(1));
    return slugs.indexOf(slug);
  };

  if (reduced || !G) {
    // Stacked slides; a linked case still opens.
    const i = fromUrl();
    if (i >= 0) { slides[i].scrollIntoView(); overlays.open(i); }
    return { buildIntro() {} };
  }

  section.classList.add('is-live');
  let cur = -1;
  let top = 0;
  let step = 1;
  let busy = false;
  let busyTimer = 0;
  let lastGo = 0;
  let lastWheel = 0;

  // ---- showing a slide -------------------------------------------------------
  function enter(s, dir) {
    const p = parts(s);
    G.killTweensOf([...p.lines, p.big, p.device, p.disc, ...p.small]);
    const tl = G.timeline();
    tl.fromTo(p.lines, { yPercent: 115 * dir }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.32)
      .fromTo(p.device, { x: 170 * dir, rotationY: 32 * dir, scale: 0.92, opacity: 0 }, { x: 0, rotationY: 0, scale: 1, opacity: 1, duration: 1.25, ease: 'expo.out' }, 0.26)
      .fromTo(p.disc, { scale: 0.45, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out' }, 0.2)
      .fromTo(p.big, { xPercent: 28 * dir, rotation: -12, opacity: 0 }, { xPercent: 0, rotation: -6, opacity: 1, duration: 1.15, ease: 'expo.out' }, 0.46)
      .fromTo(p.small, { y: 22 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.05 }, 0.5);
    return tl;
  }
  function leave(s, dir) {
    const p = parts(s);
    G.killTweensOf([...p.lines, p.big, p.device, p.disc, ...p.small]);
    s.classList.add('is-leaving');
    return G.timeline({ onComplete: () => s.classList.remove('is-leaving') })
      .to(p.lines, { yPercent: -115 * dir, duration: 0.5, ease: 'power3.in', stagger: 0.04 }, 0)
      .to(p.big, { xPercent: -24 * dir, opacity: 0, duration: 0.45, ease: 'power2.in' }, 0)
      .to(p.device, { x: -150 * dir, rotationY: -28 * dir, scale: 0.94, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0)
      .to(p.disc, { scale: 0.6, opacity: 0, duration: 0.55, ease: 'power3.in' }, 0)
      .to(p.small, { y: -18 * dir, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
  }
  function show(i, { instant = false } = {}) {
    if (i === cur) return;
    const dir = i > cur ? 1 : -1;
    const prev = slides[cur];
    cur = i;
    const s = slides[i];
    slides.forEach((x) => x.classList.toggle('is-active', x === s));
    frame.dataset.theme = s.dataset.theme;
    track.style.width = `${((i + 1) / N) * 100}%`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === N - 1;
    if (instant) {
      if (prev) prev.classList.remove('is-leaving');
      const p = parts(s);
      G.set([...p.lines], { yPercent: 0 });
      G.set([p.device, p.disc, p.big, ...p.small], { x: 0, y: 0, xPercent: 0, rotationY: 0, scale: 1, opacity: 1 });
      G.set(p.big, { rotation: -6 });
      return;
    }
    if (prev) leave(prev, dir);
    enter(s, dir);
  }

  // ---- scroll ------------------------------------------------------------------
  const snaps = matchMedia('(pointer: coarse)').matches
    ? slides.map(() => section.appendChild(Object.assign(document.createElement('i'), { className: 'csx__snap' })))
    : [];
  if (snaps.length) root.classList.add('fx-snap');
  function measure() {
    top = section.getBoundingClientRect().top + window.scrollY;
    step = Math.max(1, stage.offsetHeight * STEP);
    section.style.setProperty('--step', `${step}px`);
    snaps.forEach((n, i) => { n.style.top = `${Math.round(i * step)}px`; });
  }
  const rel = () => window.scrollY - top;
  const pinned = () => rel() > -4 && rel() < (N - 1) * step + 4;
  const scrollTo = (y, instant) => {
    if (lenis) lenis.scrollTo(y, { duration: 1, immediate: instant, lock: !instant, force: true, easing: (t) => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo({ top: y, behavior: instant ? 'auto' : 'smooth' });
  };
  function go(i, { instant = false } = {}) {
    i = clamp(i, 0, N - 1);
    busy = !instant;
    lastGo = performance.now();
    clearTimeout(busyTimer);
    busyTimer = setTimeout(() => { busy = false; }, instant ? 0 : 1050);
    show(i, { instant });
    scrollTo(top + i * step, instant);
  }

  let holding = false;
  function onScroll() {
    const hold = pinned();
    // The site's "book a demo" bar steps aside while the slider holds the screen.
    if (hold !== holding) root.classList.toggle('fx-hold', (holding = hold));
    if (busy || document.body.style.overflow === 'hidden') return;
    show(clamp(Math.round(rel() / step), 0, N - 1));
  }

  // One wheel gesture = one slide. Wheel events arriving in a stream right
  // after a turn are the same gesture (or trackpad momentum) and are dropped.
  window.addEventListener('wheel', (e) => {
    if (overlays.isOpen() || e.ctrlKey || !pinned()) return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const dir = Math.sign(d);
    if (!dir || (dir < 0 && cur === 0) || (dir > 0 && cur === N - 1)) return; // let the page move on
    e.preventDefault();
    e.stopImmediatePropagation(); // Lenis doesn't see it
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    if (busy || (gap < 180 && now - lastGo < 1300)) return;
    go(cur + dir);
  }, { passive: false, capture: true });

  window.addEventListener('keydown', (e) => {
    if (overlays.isOpen() || !pinned() || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    const dir = { ArrowDown: 1, PageDown: 1, ArrowRight: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1, ArrowLeft: -1 }[e.key];
    if (!dir || (dir < 0 && cur === 0) || (dir > 0 && cur === N - 1)) return;
    e.preventDefault();
    if (!busy) go(cur + dir);
  });

  prevBtn.addEventListener('click', () => go(cur - 1));
  nextBtn.addEventListener('click', () => go(cur + 1));

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const keep = pinned() ? cur : -1;
      measure();
      if (keep >= 0) scrollTo(top + keep * step, true);
    }, 150);
  });

  measure();
  const linked = fromUrl();
  // Start on the linked case (if any), else the first.
  slides.forEach((s) => {
    const p = parts(s);
    G.set(p.lines, { yPercent: 115 });
    G.set([p.device, p.disc, p.big, ...p.small], { opacity: 0 });
  });
  if (linked > 0) go(linked, { instant: true });
  else show(0, { instant: true });
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (linked >= 0) setTimeout(() => overlays.open(linked), 900);

  return {
    // First slide builds in as the page's intro (after the preloader).
    buildIntro(intro) {
      if (linked > 0) return;
      const s = slides[0];
      cur = -1;
      const p = parts(s);
      G.set(p.lines, { yPercent: 115 });
      G.set([p.device, p.disc, p.big, ...p.small], { opacity: 0 });
      intro.add(() => { show(0); }, 0);
    },
  };
}

// ---- the "+" list and the case study overlay -------------------------------------
function setupOverlays({ section, slides, go, current, gsap: G, reduced }) {
  const body = document.body;
  let data = null;
  let loading = null;
  const load = () => loading || (loading = fetch('/fx/cases.json').then((r) => r.json()).then((d) => (data = d)));
  // Fetch the stories once the page is idle, so opening one is instant.
  (window.requestIdleCallback || setTimeout)(() => load().catch(() => {}), { timeout: 4000 });

  const info = slides.map((s) => ({
    slug: s.dataset.slug,
    name: s.querySelector('.csx__title').textContent,
    meta: s.querySelector('.csx__meta').textContent,
    big: s.querySelector('.csx__big span').textContent,
    client: s.querySelector('.csx__who b').textContent,
  }));

  // List
  const list = document.createElement('div');
  list.className = 'csx-list';
  list.hidden = true;
  list.setAttribute('role', 'dialog');
  list.setAttribute('aria-modal', 'true');
  list.setAttribute('aria-label', 'All case studies');
  list.innerHTML = `<div class="csx-list__panel" data-lenis-prevent>
    <div class="csx-list__head"><p>All case studies · ${slides.length}</p><button class="csx-x" type="button" aria-label="Close">×</button></div>
    <ol>${info.map((c, i) => `<li><button class="csx-list__row" type="button" data-i="${i}"><span class="csx-list__n">${String(i + 1).padStart(2, '0')}</span><span class="csx-list__name">${esc(c.client)}<small>${esc(c.meta)}</small></span><span class="csx-list__big">${esc(c.big)}</span></button></li>`).join('')}</ol>
  </div>`;
  body.appendChild(list);

  // Case study
  const box = document.createElement('div');
  box.className = 'csx-case';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'csx-case-title');
  box.innerHTML = '<div class="csx-case__panel" data-lenis-prevent></div>';
  body.appendChild(box);
  const panel = box.firstElementChild;

  let openEl = null;
  let returnFocus = null;
  function lock(on) { body.style.overflow = on ? 'hidden' : ''; }
  function reveal(el, inner) {
    el.hidden = false;
    lock(true);
    if (!reduced && G) {
      G.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      G.fromTo(inner, { y: 60, opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' });
    }
  }
  // `then` runs once page scrolling is back on (starting Lenis cancels a
  // scroll that began while it was stopped).
  function close(then) {
    if (!openEl) return;
    const el = openEl;
    openEl = null;
    const done = () => {
      el.hidden = true;
      lock(false);
      if (returnFocus) returnFocus.focus({ preventScroll: true });
      if (then) requestAnimationFrame(then);
    };
    if (el === box && location.hash) history.replaceState(null, '', location.pathname);
    if (!reduced && G) G.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
    else done();
  }

  function openList() {
    returnFocus = document.activeElement;
    list.querySelectorAll('.csx-list__row').forEach((r, i) => r.classList.toggle('is-current', i === current()));
    openEl = list;
    reveal(list, list.firstElementChild);
    list.querySelector('.csx-x').focus({ preventScroll: true });
  }

  function render(i) {
    const c = data && data.find((x) => x.slug === info[i].slug);
    if (!c) return false;
    const facts = [['Industry', c.industry], ['Services', c.services.join(', ')], ['Team', c.team], ['Timeline', c.timeline]].filter((f) => f[1]);
    const words = c.headline.split(' ');
    const tail = words.length > 4 ? ` <em>${esc(words.splice(-3).join(' '))}</em>` : '';
    const prev = info[i - 1];
    const next = info[i + 1];
    panel.innerHTML = `
      <div class="csx-case__bar"><p>${esc(c.client)}<span>Case study ${String(i + 1).padStart(2, '0')} / ${String(info.length).padStart(2, '0')}</span></p><button class="csx-x" type="button" aria-label="Close">×</button></div>
      <article class="csx-case__body">
        <span class="csx-case__eyebrow"><i></i>${esc(c.industry)}</span>
        <h2 id="csx-case-title">${esc(words.join(' '))}${tail}</h2>
        <p class="csx-case__lede">${esc(c.summary)}</p>
        <dl class="csx-case__facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <ul class="csx-case__metrics">${c.metrics.map((m) => `<li><b>${esc(m.value)}</b><span>${esc(m.label)}</span></li>`).join('')}</ul>
        ${(c.body || []).map((b) => `<section class="csx-case__section"><h3>${esc(b.h)}</h3>${b.p ? `<p>${esc(b.p)}</p>` : ''}${b.list ? `<ul>${b.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
        ${c.quote ? `<blockquote><p>“${esc(c.quote.text)}”</p><footer><b>${esc(c.quote.name)}</b>${c.quote.role ? `, ${esc(c.quote.role)}` : ''}</footer></blockquote>` : ''}
        <div class="csx-case__cta"><p>Want results <em>like these?</em></p><a href="/book-demo/">Book a free demo <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
        <nav class="csx-case__nav" aria-label="More case studies">
          ${prev ? `<button type="button" data-i="${i - 1}"><small>← Previous</small><span>${esc(prev.client)}</span></button>` : ''}
          ${next ? `<button type="button" data-i="${i + 1}"><small>Next →</small><span>${esc(next.client)}</span></button>` : ''}
        </nav>
      </article>`;
    panel.scrollTop = 0;
    history.replaceState(null, '', `${location.pathname}#${c.slug}`);
    return true;
  }

  async function open(i) {
    if (!data) { try { await load(); } catch { loading = null; return; } }
    if (!render(i)) return;
    if (openEl !== box) {
      if (openEl) { openEl.hidden = true; }
      returnFocus = document.activeElement;
      openEl = box;
      reveal(box, panel);
    }
    panel.querySelector('.csx-x').focus({ preventScroll: true });
  }

  // Clicks
  section.addEventListener('click', (e) => {
    const link = e.target.closest('.csx__link');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      open(slides.indexOf(link.closest('.csx__slide')));
      return;
    }
    if (e.target.closest('.csx__all')) openList();
  });
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.csx-list__row');
    if (row) {
      const i = +row.dataset.i;
      close(() => go(i));
    } else if (e.target === list) close();
  });
  box.addEventListener('click', (e) => {
    const nav = e.target.closest('.csx-case__nav button');
    if (nav) {
      const i = +nav.dataset.i;
      open(i);
      go(i, { instant: true }); // the slider follows, so closing lands on it
    } else if (e.target.closest('.csx-x') || e.target === box) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  list.querySelector('.csx-x').addEventListener('click', () => close());

  return { open, isOpen: () => !!openEl };
}

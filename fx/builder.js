// Motion on top of the plan builder (a React island; chrome.css skins it).
// Nothing here edits the builder's own markup — it watches the estimate for
// changes and animates around them:
//   - adding a service flies its icon from the card you pressed into the
//     estimate, and the new line slides in with a flash;
//   - a removed line slides out and blurs away (a copy, as React has already
//     taken it out); a changed option flashes its line;
//   - the subtotal pops, with a "+$149" / "−$149" chip floating up beside it;
//   - the estimate card leans towards the pointer, a soft light following it;
//   - pressing a card sends a ripple across it.
// Styles in builder.css.

const num = (t) => parseInt(String(t).replace(/[^0-9]/g, ''), 10) || 0;

export function setupBuilderFx({ gsap: G, reduced, finePointer }) {
  const grid = document.querySelector('.sh-builder-grid');
  if (!grid || reduced || !G) return;
  const col = grid.lastElementChild;
  const wrap = col && col.firstElementChild;
  const card = wrap && wrap.firstElementChild;
  if (!card) return;
  wrap.classList.add('bx-receipt');
  card.classList.add('bx-card');

  // ---- Reading the estimate ----------------------------------------------------------------
  const lines = () => [...card.querySelectorAll('div')].filter((d) => d.children.length === 3 && [...d.children].every((c) => c.tagName === 'SPAN') && /^\$[\d,]+$/.test(d.children[2].textContent.trim()));
  const totalEl = () => {
    const label = [...card.querySelectorAll('span')].find((s) => /^subtotal/i.test(s.textContent.replace(/ /g, ' ').trim()));
    const box = label && label.nextElementSibling;
    return box ? box.lastElementChild || box : null;
  };
  const read = () => new Map(lines().map((el) => {
    const [name, ...rest] = el.children[0].textContent.trim().split(' · ');
    return [name.trim(), { el, detail: rest.join(' · '), price: num(el.children[2].textContent) }];
  }));

  // What we knew last time: each line's place (relative to the card) and a copy of it.
  let prev = read();
  let prevTotal = totalEl() ? num(totalEl().textContent) : null;
  let cache = new Map();
  const remember = (now) => {
    const c = card.getBoundingClientRect();
    cache = new Map([...now].map(([n, l]) => {
      const r = l.el.getBoundingClientRect();
      return [n, { dx: r.left - c.left, dy: r.top - c.top, w: r.width, h: r.height, copy: l.el.cloneNode(true) }];
    }));
  };
  remember(prev);
  const t0 = totalEl();
  if (t0) t0.classList.add('bx-total');

  // The card last pressed, to fly from.
  let press = null;
  grid.addEventListener('pointerdown', (e) => {
    const c = e.target.closest && e.target.closest('.sh-bld');
    if (!c) return;
    press = { card: c, at: performance.now() };
    ripple(c, e);
  }, true);

  // ---- Watching for changes ------------------------------------------------------------------
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; changed(); });
  }).observe(grid, { childList: true, subtree: true, characterData: true });

  function changed() {
    const now = read();
    now.forEach((l, n) => {
      const was = prev.get(n);
      if (!was) enter(l.el, n);
      else if (was.detail !== l.detail || was.price !== l.price) flash(l.el);
    });
    prev.forEach((_, n) => { if (!now.has(n)) leave(n); });
    const t = totalEl();
    if (t) {
      t.classList.add('bx-total');
      const v = num(t.textContent);
      if (prevTotal != null && v !== prevTotal) { pop(t); delta(t, v - prevTotal); }
      prevTotal = v;
    }
    prev = now;
    remember(now);
  }

  // ---- Effects ------------------------------------------------------------------------------
  function enter(el, name) {
    const from = press && performance.now() - press.at < 1500 && cardHas(press.card, name) ? press.card : null;
    const late = from ? fly(from, el) : 0;
    G.fromTo(el, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out', delay: late, clearProps: 'opacity,transform' });
    setTimeout(() => flash(el), late * 1000);
  }
  function flash(el) {
    el.classList.remove('bx-flash');
    void el.offsetWidth;
    el.classList.add('bx-flash');
    setTimeout(() => el.classList.remove('bx-flash'), 1100);
  }
  function leave(name) {
    const c = cache.get(name);
    if (!c) return;
    const r = card.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'bx-ghost';
    Object.assign(ghost.style, { left: `${r.left + c.dx}px`, top: `${r.top + c.dy}px`, width: `${c.w}px`, height: `${c.h}px` });
    ghost.appendChild(c.copy);
    document.body.appendChild(ghost);
    G.to(ghost, { opacity: 0, x: -30, filter: 'blur(6px)', duration: 0.55, ease: 'power2.in', onComplete: () => ghost.remove() });
  }
  // The subtotal pops.
  function pop(el) {
    G.fromTo(el, { scale: 1.14 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)', clearProps: 'transform' });
  }
  function delta(el, d) {
    const r = el.getBoundingClientRect();
    const chip = document.createElement('div');
    chip.className = `bx-delta${d < 0 ? ' is-down' : ''}`;
    chip.textContent = `${d > 0 ? '+' : '−'}$${Math.abs(d).toLocaleString('en-US')}`;
    Object.assign(chip.style, { left: `${r.right}px`, top: `${r.top}px` });
    document.body.appendChild(chip);
    G.fromTo(chip, { opacity: 0, y: 6, scale: 0.8 }, { opacity: 1, y: -18, scale: 1, duration: 0.45, ease: 'back.out(2)' });
    G.to(chip, { opacity: 0, y: -42, duration: 0.6, delay: 0.9, ease: 'power2.in', onComplete: () => chip.remove() });
  }
  // The card's icon arcs into the estimate's new line. Returns how long it takes.
  function fly(from, to) {
    const src = from.querySelector('svg');
    const a = (src ? (src.parentElement || src) : from).getBoundingClientRect();
    const b = to.children[0].getBoundingClientRect();
    if (!a.width || !b.width) return 0;
    const ghost = document.createElement('div');
    ghost.className = 'bx-fly';
    ghost.innerHTML = src ? src.outerHTML : '';
    const size = 40;
    Object.assign(ghost.style, { left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px` });
    document.body.appendChild(ghost);
    const dx = b.left + 10 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    G.timeline({ onComplete: () => ghost.remove() })
      .to(ghost, { x: dx, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(ghost, { y: Math.min(dy, 0) - 70, duration: 0.28, ease: 'power2.out' }, 0)
      .to(ghost, { y: dy, duration: 0.32, ease: 'power2.in' }, 0.28)
      .to(ghost, { rotationY: 360, scale: 0.55, duration: 0.6, ease: 'power1.inOut', transformPerspective: 500 }, 0)
      .to(ghost, { opacity: 0, duration: 0.12 }, 0.52);
    return 0.45;
  }
  function ripple(el, e) {
    const r = el.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'bx-ripple';
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: getComputedStyle(el).borderRadius });
    const dot = document.createElement('i');
    const size = Math.max(r.width, r.height) * 2.2;
    Object.assign(dot.style, { left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px`, width: `${size}px`, height: `${size}px` });
    box.appendChild(dot);
    document.body.appendChild(box);
    G.fromTo(dot, { scale: 0, opacity: 0.5 }, { scale: 1, opacity: 0, duration: 0.75, ease: 'power2.out', onComplete: () => box.remove() });
  }
  const cardHas = (c, name) => [...c.querySelectorAll('span')].some((s) => !s.childElementCount && s.textContent.trim() === name);

  // ---- The estimate leans towards the pointer ---------------------------------------------------
  if (finePointer) {
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      wrap.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`);
      wrap.style.setProperty('--rx', `${((0.5 - y) * 5).toFixed(2)}deg`);
      card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      wrap.classList.add('is-lit');
    });
    wrap.addEventListener('pointerleave', () => {
      wrap.style.removeProperty('--rx');
      wrap.style.removeProperty('--ry');
      wrap.classList.remove('is-lit');
    });
  }
}

// Landing-page "stages": card groups that move through 3D space the way the
// helix gallery does — curved arcs that turn with the scroll, a pinned ring
// that brings each step to the front, a cover-flow row and a vertical drum.
//
// Stages own their cards' transform/opacity (written straight to the inline
// style every frame while on screen), so these cards are left out of the
// generic reveal/tilt effects in fx.js.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const DEG = Math.PI / 180;
const PERSPECTIVE = 1800; // px, on arc/drum/flow containers

function kids(container) {
  return [...container.children].filter((k) => !/^(STYLE|SCRIPT|TEMPLATE)$/.test(k.tagName) && k.offsetHeight > 0);
}

// Offset of `el` from `ancestor`, ignoring CSS transforms.
function offsetIn(el, ancestor) {
  let x = 0, y = 0, n = el;
  while (n && n !== ancestor) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent;
    if (!p || !ancestor.contains(p)) {
      if (p !== ancestor) {
        const a = ancestor.getBoundingClientRect(), b = (p || document.body).getBoundingClientRect();
        x += b.left - a.left;
        y += b.top - a.top;
      }
      break;
    }
    n = p;
  }
  return { x, y };
}

export function mountStages({ gsap, lenis, targets, finePointer, narrow }) {
  const stages = [];
  const claimed = new Set();

  // Group card targets by their container.
  const byParent = new Map();
  for (const t of targets) {
    if (t.type !== 'card' || !t.el.parentElement) continue;
    const p = t.el.parentElement;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(t.el);
  }

  // Setup runs in phases (read all → write all) so the page lays out a
  // handful of times instead of once per card.
  const plans = [];
  for (const [container, cards] of byParent) {
    if (cards.length < 2) continue;
    const cs = getComputedStyle(container);
    const h = cards[0].offsetHeight, w = cards[0].offsetWidth;
    if (h < 110) continue; // small tiles (pricing options) keep the simple reveal
    let mode = 'arc';
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') mode = 'flow';
    else if (cs.display === 'block') mode = 'drum';
    else if (!narrow && cards.length === 3 && w >= 300 && h >= 280) mode = 'ring';
    plans.push([container, mode, kids(container)]);
  }
  for (const [container, mode, list] of plans) stages.push(createStage(container, mode, list));
  stages.forEach(measure);
  stages.filter((s) => s.mode === 'ring').forEach(pinRing);

  function createStage(container, mode, list) {
    const stage = {
      container,
      mode,
      cards: [],
      visible: false,
      entered: false,
      suspended: false,
      swing: 0,
      swingVel: 0,
      dragging: false,
    };
    container.setAttribute('data-fx-stage', mode);
    container.style.perspective = mode === 'ring' ? '1500px' : PERSPECTIVE + 'px';
    container.style.perspectiveOrigin = '50% 40%';
    if (mode === 'ring') container.style.transformStyle = 'preserve-3d';

    collect(stage, false, list);
    if (mode === 'flow' && finePointer) dragScroll(stage);
    if ((mode === 'arc' && stage.cards.length >= 4) && finePointer) dragSwing(stage);
    guardFixed(stage);

    // React swaps cards when tabs/filters change: pick up the new ones.
    new MutationObserver(() => {
      const before = stage.cards.map((c) => c.el);
      const now = kids(container);
      if (now.length === before.length && now.every((n, i) => n === before[i])) return;
      collect(stage);
      stage.cards.forEach((c, i) => {
        if (before.includes(c.el)) return;
        c.e = 0;
        gsap.to(c, { e: 1, duration: 1, delay: i * 0.05, ease: 'expo.out' });
      });
    }).observe(container, { childList: true });

    return stage;
  }

  function collect(stage, remeasure = true, list = kids(stage.container)) {
    const old = new Map(stage.cards.map((c) => [c.el, c]));
    stage.cards = list.map((el, i) => {
      claimed.add(el);
      el.setAttribute('data-fx-staged', '');
      const c = old.get(el) || { el, e: stage.entered ? 1 : 0, hover: 0, hoverTo: 0, last: '', lastO: '', origT: el.style.transform, origO: el.style.opacity };
      c.i = i;
      if (!old.has(el)) {
        el.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') c.hoverTo = 1; });
        el.addEventListener('pointerleave', () => { c.hoverTo = 0; });
      }
      return c;
    });
    if (remeasure) measure(stage);
  }

  // Cache each card's untransformed centre relative to its container.
  function measure(stage) {
    const box = stage.container;
    stage.w = box.offsetWidth;
    stage.h = box.offsetHeight;
    for (const c of stage.cards) {
      const o = offsetIn(c.el, box);
      c.cx = o.x + c.el.offsetWidth / 2;
      c.cy = o.y + c.el.offsetHeight / 2;
      c.w = c.el.offsetWidth;
    }
    if (stage.mode === 'ring' && stage.cards.length >= 2) {
      const xs = stage.cards.map((c) => c.cx).sort((a, b) => a - b);
      stage.spacing = xs[1] - xs[0];
    }
  }

  function enter(stage) {
    stage.entered = true;
    stage.cards.forEach((c, i) => gsap.to(c, { e: 1, duration: 1.4, delay: 0.08 + i * 0.08, ease: 'expo.out' }));
  }

  // ---- pinned ring (sticky, no DOM changes) ------------------------------
  function pinRing(stage) {
    const sec = stage.container.closest('section');
    const head = sec && sec.querySelector('h2');
    if (!sec || !head) { stage.mode = 'arc'; return; }
    // Lowest element holding both the heading and the cards.
    let inner = stage.container.parentElement;
    while (inner && inner !== sec && !inner.contains(head)) inner = inner.parentElement;
    const header = document.querySelector('header');
    const top = (header ? header.offsetHeight : 0) + 12;
    if (!inner || inner === sec || inner.offsetHeight + top + 24 > window.innerHeight) { stage.mode = 'arc'; return; }
    stage.pinLen = Math.round(window.innerHeight * 1.5);
    stage.sec = sec;
    stage.inner = inner;
    stage.stickyTop = top;
    stage.padTop = parseFloat(getComputedStyle(sec).paddingTop) || 0;
    inner.style.position = 'sticky';
    inner.style.top = top + 'px';
    // A sticky box only travels inside its parent's content box (padding
    // doesn't count), so the pin length goes into the section's height.
    sec.style.minHeight = sec.offsetHeight + stage.pinLen + 'px';
  }

  // ---- drag interactions ----------------------------------------------------
  function dragSwing(stage) {
    const box = stage.container;
    box.setAttribute('data-fx-drag', '');
    let lastX = 0, moved = 0, id = null;
    box.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      stage.dragging = true; moved = 0; lastX = e.clientX; id = e.pointerId;
    });
    window.addEventListener('pointermove', (e) => {
      if (!stage.dragging || e.pointerId !== id) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (moved > 6) { box.classList.add('is-dragging'); document.body.style.userSelect = 'none'; }
      stage.swingVel = dx * 0.09;
      stage.swing = clamp(stage.swing + stage.swingVel, -38, 38);
    });
    const up = () => {
      if (!stage.dragging) return;
      stage.dragging = false;
      box.classList.remove('is-dragging');
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // A drag shouldn't also count as a click on whatever was under it.
    box.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  function dragScroll(stage) {
    const box = stage.container;
    box.setAttribute('data-fx-drag', '');
    let lastX = 0, moved = 0, vel = 0, down = false, id = null;
    box.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; vel = 0; lastX = e.clientX; id = e.pointerId;
      gsap.killTweensOf(box);
    });
    window.addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== id) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (moved > 6) { box.classList.add('is-dragging'); document.body.style.userSelect = 'none'; }
      vel = dx;
      box.scrollLeft -= dx;
    });
    const up = () => {
      if (!down) return;
      down = false;
      box.classList.remove('is-dragging');
      document.body.style.userSelect = '';
      if (Math.abs(vel) > 1) gsap.to(box, { scrollLeft: box.scrollLeft - vel * 18, duration: 1.1, ease: 'power3.out' });
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    box.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  // A 3D transform on an ancestor would trap a position:fixed popup (modal,
  // lightbox) inside the card; flatten the stage while one is open.
  function guardFixed(stage) {
    const check = () => {
      const open = [...stage.container.querySelectorAll('[style*="fixed"]')].some((n) => getComputedStyle(n).position === 'fixed');
      if (open === stage.suspended) return;
      stage.suspended = open;
      stage.container.style.perspective = open ? '' : (stage.mode === 'ring' ? '1500px' : PERSPECTIVE + 'px');
      if (open) stage.cards.forEach((c) => { c.el.style.transform = c.origT; c.el.style.opacity = c.origO; c.last = c.lastO = ''; });
    };
    new MutationObserver(check).observe(stage.container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  }

  // ---- per-frame update -----------------------------------------------------
  const vh = () => window.innerHeight;
  let lean = 0;

  // Everything update() needs from layout, read before any stage writes.
  function read(stage) {
    stage.rect = stage.container.getBoundingClientRect();
    if (stage.sec) stage.secTop = stage.sec.getBoundingClientRect().top;
    if (stage.mode === 'flow') {
      stage.scrollLeft = stage.container.scrollLeft;
      stage.clientW = stage.container.clientWidth;
    }
  }

  function update(stage, dt) {
    const f = dt * 60;
    const r = stage.rect;
    const H = vh();
    // Where the stage sits in the viewport: -1 entering at the bottom, +1 leaving at the top.
    const p = clamp(((H / 2) - (r.top + r.height / 2)) / (H / 2 + r.height / 2), -1, 1);

    if (!stage.dragging) {
      stage.swing += stage.swingVel * f;
      stage.swingVel *= Math.pow(0.9, f);
      stage.swing *= Math.pow(0.94, f); // spring back to rest
    }

    // Ring progress while pinned.
    let q = 0;
    if (stage.mode === 'ring' && stage.sec) {
      q = clamp((stage.stickyTop - (stage.secTop + stage.padTop)) / stage.pinLen, 0, 1);
    }
    const flowCenter = stage.mode === 'flow' ? stage.scrollLeft + stage.clientW / 2 : 0;

    for (const c of stage.cards) {
      c.hover += (c.hoverTo - c.hover) * (1 - Math.pow(0.85, f));
      const e = c.e;
      let tx = 0, ty = 0, tz = 0, ry = 0, rx = 0, sc = 1, op = 1, zi = '';

      if (stage.mode === 'arc') {
        const cx = (c.cx - stage.w / 2) / (stage.w / 2);          // -1 … 1 across the row
        const yv = clamp((r.top + c.cy - H / 2) / (H / 2), -1.3, 1.3); // -1 top … 1 bottom of screen
        const a = cx * 24 - p * 14 + stage.swing;                  // arc + scroll turn + drag
        ry = -a;
        tz = -(1 - Math.cos(a * DEG)) * 1100 - Math.abs(yv) * 60;
        // Pushed-back cards project toward the centre; move them out again so
        // neighbours in a tight row don't overlap.
        tx = (c.cx - stage.w / 2) * (-tz / PERSPECTIVE);
        rx = -yv * 10 + lean;
        op = 0.62 + 0.38 * Math.pow(Math.cos(a * DEG), 6);
      } else if (stage.mode === 'drum') {
        const yv = clamp((r.top + c.cy - H / 2) / (H / 2), -1.4, 1.4);
        const cx = (c.cx - stage.w / 2) / (stage.w / 2);
        rx = -yv * 24 + lean;
        ry = -cx * 10;
        tz = -yv * yv * 140;
        op = 0.45 + 0.55 * Math.cos(clamp(yv, -1, 1) * 1.1);
      } else if (stage.mode === 'flow') {
        const cx = clamp((c.cx - flowCenter) / (stage.clientW / 2), -1.6, 1.6);
        ry = -cx * 38;
        tz = -Math.abs(cx) * 170;
        tx = -cx * Math.abs(cx) * 22;
        rx = lean * 0.6;
        op = 0.55 + 0.45 * Math.cos(clamp(cx, -1.5, 1.5) * 0.9);
        zi = String(100 - Math.round(Math.abs(cx) * 40));
      } else if (stage.mode === 'ring') {
        const n = stage.cards.length;
        const beta = 38;                                            // angle between steps
        const R = stage.spacing / Math.sin(beta * DEG);
        const rot = (n - 1) / 2 * beta - ease(q) * (n - 1) * beta; // step 1 → step n
        const alpha = (c.i - (n - 1) / 2) * beta + rot;
        const x = R * Math.sin(alpha * DEG);
        tx = x - (c.cx - stage.w / 2);
        tz = R * (Math.cos(alpha * DEG) - 1);
        ry = -alpha;
        const front = Math.max(0, Math.cos(alpha * DEG));
        // Opaque while facing us (a see-through card shows the one behind it
        // on the light page); fade only as a card turns away past ~50°.
        op = clamp((90 - Math.abs(alpha)) / 40, 0, 1);
        sc = 1 + 0.05 * Math.pow(front, 12);
        zi = String(Math.round(1000 + tz));
      }

      // Hover: come forward like the helix cards.
      tz += c.hover * 70;
      sc *= 1 + c.hover * 0.025;
      // Entrance: fly in from deep behind, turning.
      tz -= (1 - e) * 520;
      ty += (1 - e) * 120;
      ry += (1 - e) * (c.cx < stage.w / 2 ? 28 : -28);
      op *= e;

      const t = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      if (t !== c.last) { c.el.style.transform = t; c.last = t; }
      const o = op.toFixed(3);
      if (o !== c.lastO) { c.el.style.opacity = o; c.lastO = o; }
      if (zi && c.el.style.zIndex !== zi) c.el.style.zIndex = zi;
    }
  }

  function tick(time, deltaTime) {
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    // Velocity lean, like the helix tilting when flung.
    const v = lenis ? lenis.velocity : 0;
    lean += (clamp(-v * 0.35, -9, 9) - lean) * (1 - Math.pow(0.88, dt * 60));
    // Visibility from measured position rather than IntersectionObserver:
    // observer callbacks can starve on a busy main thread (software WebGL).
    const H = vh();
    for (const s of stages) {
      const r = s.container.getBoundingClientRect();
      s.visible = r.bottom > -H * 0.1 && r.top < H * 1.1;
      if (!s.entered && r.top < H * 0.88 && r.bottom > H * 0.12) enter(s);
    }
    const live = stages.filter((s) => (s.visible || s.dragging) && !s.suspended);
    live.forEach(read);
    live.forEach((s) => update(s, dt));
  }

  // Initial state: cards hidden deep in the scene until their stage enters.
  stages.forEach(read);
  stages.forEach((s) => update(s, 0.016));
  gsap.ticker.add(tick);

  let rz = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => stages.forEach((s) => {
      if (s.sec) {
        s.sec.style.minHeight = '';
        s.pinLen = Math.round(window.innerHeight * 1.5);
        s.sec.style.minHeight = s.sec.offsetHeight + s.pinLen + 'px';
      }
      measure(s);
    }), 150);
  });

  return { claimed, stages };
}

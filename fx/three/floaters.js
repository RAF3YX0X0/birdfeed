// Floating 3D social icons (hearts, play buttons, chat bubbles, stars…) that
// hover over a host element, drift with the pointer, get nudged away when the
// cursor comes close, and float off as the host scrolls out of view.
//
// The canvas lives in <body> (not inside the React islands) and is kept aligned
// to the host's box, so it never interferes with hydration or re-renders.
import { THREE, createRenderer, studioEnvironment, createMaterials, createIcon, disposeObject, onScreen } from './kit.js';

const FOV = 30;
const CAM_DIST = 30;
const FLAT = new Set(['heart', 'play', 'bubble', 'star']);

export function mountFloaters({
  host,
  layout,              // (hostRect) => [{ kind, x, y, size, z? }] in host-local px
  gsap,
  pad = 0,             // canvas bleed beyond the host box, px
  reduced = false,
  interactive = true,
  scrollOut = true,
  maxDpr = 2,
  zIndex,
}) {
  const wrap = document.createElement('div');
  wrap.className = 'fx-gl';
  wrap.setAttribute('aria-hidden', 'true');
  if (zIndex != null) wrap.style.zIndex = zIndex;
  document.body.appendChild(wrap);

  const renderer = createRenderer({ maxDpr });
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-6, 10, 12);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb0ff, 1.1);
  rim.position.set(8, -4, -6);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAM_DIST);

  const materials = createMaterials();
  const root = new THREE.Group();
  scene.add(root);

  let items = [];
  let box = { x: 0, y: 0, w: 1, h: 1, cl: 0, cw: 1 };
  let k = 0.01;                         // world units per CSS px at z=0
  const pointer = { x: -9999, y: -9999, nx: 0, ny: 0, sx: 0, sy: 0, active: false };
  const state = { scroll: 0, running: false, visible: false, destroyed: false, t: 0 };
  let introPlayed = reduced;

  function build(specs) {
    items.forEach((it) => { root.remove(it.obj); disposeObject(it.obj); });
    items = specs.map((spec, i) => {
      const obj = createIcon(spec.kind, materials);
      const pivot = new THREE.Group();
      pivot.add(obj);
      root.add(pivot);
      const it = {
        spec,
        obj: pivot,
        inner: obj,
        appear: reduced ? 1 : 0,
        phase: i * 1.7 + Math.random() * 2,
        speed: 0.55 + Math.random() * 0.45,
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.25),
        tilt: new THREE.Euler((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.5),
        drift: 0.5 + Math.random() * 0.9,
        flip: (Math.random() < 0.5 ? -1 : 1) * Math.PI * (FLAT.has(spec.kind) ? 0.85 : 1.5),
        off: new THREE.Vector2(),
        vel: new THREE.Vector2(),
        ang: new THREE.Vector3(),
        angVel: new THREE.Vector3(),
      };
      pivot.rotation.copy(it.tilt);
      return it;
    });
  }

  function placeItems(specs) {
    specs.forEach((spec, i) => {
      const it = items[i];
      it.spec = spec;
      // Nearer objects project larger and further from centre; undo that so
      // the anchor and size given in px are what actually lands on screen.
      const z = spec.z || 0;
      const persp = (CAM_DIST - z) / CAM_DIST;
      it.base = new THREE.Vector3(
        (spec.x + pad - box.w / 2) * k * persp,
        -(spec.y + pad - box.h / 2) * k * persp,
        z
      );
      it.scale = spec.size * k * persp;
    });
  }

  // `x/y/w/h` is the full virtual box (host + pad) in document px; the canvas
  // itself is clipped to the page width so the bleed never adds a scrollbar.
  function measure() {
    const r = host.getBoundingClientRect();
    const x = r.left + window.scrollX - pad;
    const w = Math.max(1, r.width + pad * 2);
    const vw = document.documentElement.clientWidth;
    const cl = Math.max(0, x);
    const cr = Math.min(vw, x + w);
    return {
      x,
      y: r.top + window.scrollY - pad,
      w,
      h: Math.max(1, r.height + pad * 2),
      cl,
      cw: Math.max(1, cr - cl),
      hostW: r.width,
      hostH: r.height,
      top: r.top,
    };
  }

  function relayout(force) {
    const m = measure();
    const sizeChanged = force || m.w !== box.w || m.h !== box.h || m.cw !== box.cw || m.cl - m.x !== box.cl - box.x;
    if (m.cl !== box.cl || m.y !== box.y || sizeChanged) {
      wrap.style.left = m.cl + 'px';
      wrap.style.top = m.y + 'px';
      wrap.style.width = m.cw + 'px';
      wrap.style.height = m.h + 'px';
    }
    box = m;
    if (!sizeChanged) return;
    renderer.setSize(m.cw, m.h, false);
    camera.aspect = m.w / m.h;
    camera.setViewOffset(m.w, m.h, m.cl - m.x, 0, m.cw, m.h);
    camera.updateProjectionMatrix();
    k = (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_DIST) / m.h;
    const specs = layout({ width: m.hostW, height: m.hostH }) || [];
    const kinds = specs.map((s) => s.kind).join();
    if (kinds !== items.map((it) => it.spec.kind).join()) {
      build(specs);
      if (introPlayed) items.forEach((it) => (it.appear = 1));
    }
    placeItems(specs);
  }

  // ---- motion --------------------------------------------------------------
  const tmp = new THREE.Vector2();
  function tick(time, deltaTime) {
    if (state.destroyed) return;
    if (time && !onScreen(host, 200)) return; // frame-loop call while off-screen
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    state.t += reduced ? 0 : dt;
    relayout(false);

    // Scroll-out progress: 0 while the host is in place, 1 once it has left.
    if (scrollOut) state.scroll = Math.min(1, Math.max(0, -box.top / Math.max(1, box.hostH)));

    // All springs/damping below are tuned per 60fps frame; `f` rescales them
    // so motion is the same on slow and high-refresh screens.
    const f = dt * 60;
    const damp = (base) => Math.pow(base, f);

    // Smoothed pointer for parallax.
    pointer.sx += (pointer.nx - pointer.sx) * (1 - damp(0.95));
    pointer.sy += (pointer.ny - pointer.sy) * (1 - damp(0.95));
    root.rotation.y = pointer.sx * 0.12;
    root.rotation.x = -pointer.sy * 0.08;

    // Pointer in world space (z=0 plane), relative to the canvas box.
    const px = (pointer.x - (box.x - window.scrollX) - box.w / 2) * k;
    const py = -(pointer.y - (box.y - window.scrollY) - box.h / 2) * k;

    for (const it of items) {
      const t = state.t * it.speed + it.phase;
      const s = it.scale * Math.max(0, it.appear) * (1 - state.scroll * 0.35);

      // Cursor repulsion with a spring back to rest.
      if (interactive && pointer.active) {
        tmp.set(it.base.x + it.off.x - px, it.base.y + it.off.y - py);
        const d = tmp.length();
        const reach = it.scale * 1.6 + 1.2;
        if (d < reach && d > 0.0001) {
          tmp.normalize().multiplyScalar((1 - d / reach) * 0.072 * f);
          it.vel.add(tmp);
          it.angVel.x += -tmp.y * 0.8;
          it.angVel.y += tmp.x * 0.8;
        }
      }
      it.vel.x += -it.off.x * 0.045 * f;
      it.vel.y += -it.off.y * 0.045 * f;
      it.vel.multiplyScalar(damp(0.86));
      it.off.addScaledVector(it.vel, f);
      it.angVel.multiplyScalar(damp(0.94));
      it.ang.addScaledVector(it.angVel, f);
      it.ang.multiplyScalar(damp(0.985));
      // Spin-in: the icon turns from `flip` to rest as it appears (the elastic
      // overshoot of `appear` gives it a little wobble at the end).
      const flip = (1 - it.appear) * it.flip;

      const depth = (it.base.z + 6) / 12; // nearer objects move more
      it.obj.position.set(
        it.base.x + it.off.x + pointer.sx * depth * 0.6,
        it.base.y + it.off.y + Math.sin(t) * it.scale * 0.14 + state.scroll * it.drift * box.h * k * 0.55 - pointer.sy * depth * 0.4,
        it.base.z
      );
      it.obj.scale.setScalar(Math.max(0.0001, s));
      // Flat icons only rock toward the viewer (a full turn would show them
      // edge-on); round ones can spin freely.
      const spinY = FLAT.has(it.spec.kind) ? 0 : state.t * it.spin.y * 0.4;
      it.obj.rotation.set(
        it.tilt.x + Math.sin(t * 0.8) * 0.18 + it.ang.x + state.scroll * it.spin.x * 6,
        it.tilt.y + Math.sin(t * 0.6 + 1) * 0.3 + it.ang.y + spinY + flip + state.scroll * it.spin.y * 6,
        it.tilt.z + Math.cos(t * 0.7) * 0.08 + state.scroll * it.spin.z * 4
      );
    }
    renderer.render(scene, camera);
  }

  function setRunning(on) {
    if (on === state.running || state.destroyed) return;
    state.running = on;
    if (on) gsap.ticker.add(tick);
    else gsap.ticker.remove(tick);
  }

  // ---- events --------------------------------------------------------------
  function onPointer(e) {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.active = true;
  }
  function onLeave() { pointer.active = false; pointer.nx = pointer.ny = 0; }
  if (!reduced) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);
  }

  const io = new IntersectionObserver(
    (list) => {
      const entry = list[list.length - 1]; // latest state wins
      state.visible = entry.isIntersecting;
      if (reduced) { if (state.visible) tick(0, 16); return; }
      setRunning(state.visible && !document.hidden);
    },
    { rootMargin: '120px 0px' }
  );
  io.observe(host);
  function onVis() { setRunning(state.visible && !document.hidden && !reduced); }
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => { relayout(true); if (!state.running) tick(0, 16); });
  ro.observe(host);

  relayout(true);

  // ---- public API ----------------------------------------------------------
  function intro(delay = 0) {
    wrap.classList.add('is-ready');
    if (introPlayed) { tick(0, 16); return; }
    introPlayed = true;
    items.forEach((it, i) => {
      gsap.to(it, { appear: 1, duration: 1.6, delay: delay + i * 0.09, ease: 'elastic.out(1, 0.55)' });
    });
    if (!state.running) tick(0, 16);
  }

  // React can replace the host (a hydration mismatch re-renders the island);
  // follow the new element.
  function setHost(el, nextLayout) {
    if (!el || el === host) return;
    io.unobserve(host);
    ro.unobserve(host);
    host = el;
    if (nextLayout) layout = nextLayout;
    io.observe(host);
    ro.observe(host);
    relayout(true);
    if (!state.running) tick(0, 16);
  }

  function destroy() {
    state.destroyed = true;
    setRunning(false);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    disposeObject(root);
    Object.values(materials).forEach((m) => m.dispose());
    scene.environment && scene.environment.dispose();
    renderer.dispose();
    wrap.remove();
  }

  return { intro, destroy, setHost, relayout: () => relayout(true), element: wrap };
}

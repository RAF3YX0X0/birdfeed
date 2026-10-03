// Shared scaffolding for the explainer scenes: renderer + studio lighting,
// a root group, resize handling, a frame loop that pauses off-screen, and a
// helper to pin HTML labels to points in the scene.
import { THREE, createRenderer, studioEnvironment, onScreen } from './kit.js';

export { THREE };

export function createScene({ host, gsap, reduced = false, fov = 30, fit, frame }) {
  const renderer = createRenderer({ maxDpr: 2 });
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(-5, 9, 7);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  const root = new THREE.Group();
  scene.add(root);

  const size = { W: 1, H: 1 };
  function resize() {
    const r = host.getBoundingClientRect();
    size.W = Math.max(1, r.width);
    size.H = Math.max(1, r.height);
    renderer.setSize(size.W, size.H, false);
    camera.aspect = size.W / size.H;
    fit(camera, size);
    camera.updateProjectionMatrix();
  }

  let t = 0;
  let running = false;
  function tick(time, deltaTime) {
    if (time && !onScreen(host)) return;
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    if (!reduced) t += dt;
    frame(dt, t);
    root.updateMatrixWorld();
    renderer.render(scene, camera);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick);
  }
  const io = new IntersectionObserver((list) => {
    const e = list[list.length - 1];
    if (reduced) { if (e.isIntersecting) tick(0, 16); return; }
    setRunning(e.isIntersecting);
  });
  io.observe(host);
  const ro = new ResizeObserver(() => { resize(); if (!running) tick(0, 16); });
  ro.observe(host);
  resize();

  const v = new THREE.Vector3();
  return {
    THREE, scene, camera, root, size,
    // Render once when the loop is idle (reduced motion, static updates).
    refresh() { if (!running) tick(0, 16); },
    // Place an HTML label at a world-space point; `anchor` is a CSS translate
    // for the label's own box (e.g. '-50%, -100%' = centred above).
    pin(el, point, anchor = '-50%, -100%') {
      v.copy(point).project(camera);
      el.style.transform = `translate(${((v.x * 0.5 + 0.5) * size.W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * size.H).toFixed(1)}px) translate(${anchor})`;
    },
    destroy() {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// Text drawn onto a canvas texture (labels on 3D cards and panels).
export function textTexture(draw, w = 512, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function glossy(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, ...extra });
}

export function label(tags, cls, html) {
  const el = document.createElement('div');
  el.className = 'fx-ex__tag ' + (cls || '');
  el.innerHTML = html;
  tags.appendChild(el);
  return el;
}

export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

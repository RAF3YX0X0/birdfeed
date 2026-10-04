// 3D sales funnel, minimal: five solid, matte tiers stacked with clean gaps
// over a soft contact shadow. Nothing else moves but the funnel itself: as the
// steps are walked through, the active tier lifts, widens a touch and turns
// blue, and the tiers already passed keep a faint blue tint.
import { THREE, createRenderer, studioEnvironment, onScreen } from './kit.js';

const TOP = 3;
const BOT = -3;
const GAP = 0.26;
const radiusAt = (y) => 0.75 + ((y - BOT) / (TOP - BOT)) * 2.45; // narrow at the bottom
const BASE = new THREE.Color(0xf4f4f0);
const BLUE = new THREE.Color(0x0029ff);

export function mountFunnel({ host, tagsHost, stages, gsap, reduced = false }) {
  const renderer = createRenderer({ maxDpr: 2 });
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.75;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 9, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(5, 2, -4);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  // ---- tiers ---------------------------------------------------------------
  const N = stages.length;
  const layerH = (TOP - BOT - GAP * (N - 1)) / N;
  const tiers = stages.map((s, i) => {
    const yTop = TOP - i * (layerH + GAP);
    const yBot = yTop - layerH;
    const mat = new THREE.MeshPhysicalMaterial({
      color: BASE.clone(), roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radiusAt(yTop), radiusAt(yBot), layerH, 128, 1, false), mat);
    const g = new THREE.Group();
    g.position.y = (yTop + yBot) / 2;
    g.add(body);
    root.add(g);
    return { g, mat, yMid: (yTop + yBot) / 2, r: radiusAt((yTop + yBot) / 2), focus: 0, past: 0, lift: 0 };
  });

  // Soft contact shadow under the funnel.
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const sx = sc.getContext('2d');
  const grad = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(10, 11, 16, 0.22)');
  grad.addColorStop(1, 'rgba(10, 11, 16, 0)');
  sx.fillStyle = grad;
  sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 4.2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = BOT - 0.35;
  root.add(shadow);

  // ---- labels beside each tier ---------------------------------------------
  const tagEls = stages.map((s, i) => {
    const el = document.createElement('span');
    el.className = 'fx-funnel__tag';
    el.style.setProperty('--c', s.color);
    el.innerHTML = `<i>${i + 1}</i>${s.key}`;
    tagsHost.appendChild(el);
    return el;
  });
  // Labels follow the funnel's tilt but not its sway, so they stay on the left.
  const proj = new THREE.Vector3();
  const tilt = new THREE.Matrix4();
  function placeTags(w, h) {
    tilt.makeRotationX(root.rotation.x);
    tiers.forEach((tr, i) => {
      proj.set(-(tr.r * (1 + tr.focus * 0.06) + 0.3), tr.yMid + tr.lift, 0).applyMatrix4(tilt).project(camera);
      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      tagEls[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-100%, -50%)`;
    });
  }

  // ---- layout ----------------------------------------------------------------
  let W = 1, H = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const half = Math.tan((camera.fov / 2) * (Math.PI / 180));
    // Narrow boxes (phones): step back and slide the funnel right so the
    // tier labels on its left stay on screen.
    const compact = W < 560;
    const dist = (Math.max(3.9 / half, 3.9 / (half * camera.aspect)) + 1) * (compact ? 1.25 : 1);
    camera.position.set(compact ? -1.4 : 0, dist * 0.32, dist);
    camera.lookAt(compact ? -1.4 : 0, -0.1, 0);
    camera.updateProjectionMatrix();
  }

  // ---- loop ------------------------------------------------------------------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let active = -1;
  let running = false;
  let t = 0;
  function tick(time, deltaTime) {
    if (time && !onScreen(host)) return; // frame-loop call while off-screen
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    const f = 1 - Math.pow(0.88, dt * 60);
    t += dt;
    pointer.sx += (pointer.x - pointer.sx) * f * 0.4;
    pointer.sy += (pointer.y - pointer.sy) * f * 0.4;
    // A slow, gentle sway (and the pointer) so the light moves across it.
    const sway = reduced ? 0 : Math.sin(t * 0.35) * 0.18;
    root.rotation.set(0.1 + pointer.sy * 0.06, sway + pointer.sx * 0.2, 0);

    tiers.forEach((tr, i) => {
      tr.focus += ((i === active ? 1 : 0) - tr.focus) * f;
      tr.past += ((active >= 0 && i < active ? 1 : 0) - tr.past) * f;
      tr.lift = tr.focus * 0.16;
      tr.g.position.y = tr.yMid + tr.lift;
      const s = 1 + tr.focus * 0.06;
      tr.g.scale.set(s, 1, s);
      tr.mat.color.copy(BASE).lerp(BLUE, Math.min(1, tr.focus + tr.past * 0.14));
    });
    root.updateMatrixWorld();
    placeTags(W, H);
    renderer.render(scene, camera);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick);
  }

  const io = new IntersectionObserver((list) => { const e = list[list.length - 1]; // latest state wins
    if (reduced) { if (e.isIntersecting) tick(0, 16); return; }
    setRunning(e.isIntersecting && !document.hidden);
  });
  io.observe(host);
  const ro = new ResizeObserver(() => { resize(); if (!running) tick(0, 16); });
  ro.observe(host);
  const onMove = (e) => {
    const r = host.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });
  resize();
  tick(0, 16);

  return {
    setActive(i) {
      active = i;
      tagEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
      if (!running) {
        // Reduced motion: jump straight to the highlighted state.
        tiers.forEach((tr, k) => { tr.focus = k === i ? 1 : 0; tr.past = k < i ? 1 : 0; });
        tick(0, 16);
      }
    },
    destroy() {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      renderer.domElement.remove();
      tagEls.forEach((el) => el.remove());
    },
  };
}

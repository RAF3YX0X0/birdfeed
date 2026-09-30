// Glossy 3D bar chart used by the ROI calculator. Bar heights use a log
// scale (reach is in the thousands, customers in the tens) and animate when
// the values change; each bar carries an HTML label with its number.
import { THREE, createRenderer, studioEnvironment, onScreen } from './kit.js';

export function mountBars({ host, tagsHost, bars, gsap, reduced = false }) {
  const renderer = createRenderer({ maxDpr: 2 });
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-4, 8, 6);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const MAX_H = 4.2;
  const GAP = 1.55;
  const x0 = -((bars.length - 1) * GAP) / 2;

  // Base plate
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 0.12, 96),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 1, transparent: true, opacity: 0.9 })
  );
  plate.position.y = -0.06;
  root.add(plate);

  const items = bars.map((b, i) => {
    const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(b.color3d), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1, 0.95), mat);
    mesh.position.set(x0 + i * GAP, 0.5, 0);
    root.add(mesh);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 1.02), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 1 }));
    root.add(cap);
    const tag = document.createElement('div');
    tag.className = 'fx-roi__tag';
    tag.style.setProperty('--c', b.color);
    tag.innerHTML = `<b>0</b><span>${b.label}</span>`;
    tagsHost.appendChild(tag);
    return { mesh, cap, tag, num: tag.querySelector('b'), h: 0.02, value: 0 };
  });

  let W = 1, H = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const half = Math.tan((camera.fov / 2) * (Math.PI / 180));
    const dist = Math.max(3.6 / half, 4.9 / (half * camera.aspect)) + 2;
    camera.position.set(0, dist * 0.42, dist);
    camera.lookAt(0, 1.6, 0);
    camera.updateProjectionMatrix();
  }

  const v = new THREE.Vector3();
  const pointer = { x: 0, sx: 0 };
  let t = 0;
  let running = false;
  function tick(time, deltaTime) {
    if (time && !onScreen(host)) return;
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    if (!reduced) t += dt;
    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    root.rotation.y = -0.35 + Math.sin(t * 0.3) * 0.08 + pointer.sx * 0.2;
    items.forEach((it) => {
      it.mesh.scale.y = it.h;
      it.mesh.position.y = it.h / 2;
      it.cap.position.set(it.mesh.position.x, it.h + 0.04, 0);
    });
    root.updateMatrixWorld();
    items.forEach((it) => {
      v.set(it.mesh.position.x, it.h + 0.35, 0).applyMatrix4(root.matrixWorld).project(camera);
      it.tag.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(-50%, -100%)`;
    });
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
  const onMove = (e) => { pointer.x = (e.clientX / window.innerWidth - 0.5) * 2; };
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });
  resize();

  // Log scale so tens and tens of thousands both read on the same chart.
  const REF = Math.log10(200000);
  const heightFor = (n) => Math.max(0.06, (Math.log10(Math.max(1, n) + 1) / REF) * MAX_H);

  return {
    set(values) {
      values.forEach((n, i) => {
        const it = items[i];
        const from = { n: it.value };
        gsap.to(it, { h: heightFor(n), duration: reduced ? 0 : 0.9, ease: 'elastic.out(1, 0.7)', overwrite: true });
        gsap.to(from, {
          n, duration: reduced ? 0 : 0.8, ease: 'power3.out',
          onUpdate: () => { it.num.textContent = Math.round(from.n).toLocaleString('en-US'); },
          onComplete: () => { it.value = n; if (!running) tick(0, 16); },
        });
      });
      if (!running) setTimeout(() => tick(0, 16), 20);
    },
    destroy() {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

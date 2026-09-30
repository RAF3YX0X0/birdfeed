// 3D cost towers for the Compare page. Each option is a glossy tower: the
// solid part is its starting price, the translucent part runs up to the top
// of its range. A "ghost" tower (outline only) stands for a cost that isn't
// money (DIY time). Towers rise one after another as `setProgress` goes 0 → 1.
import { THREE, createRenderer, studioEnvironment, onScreen } from './kit.js';

export function mountTowers({ host, tagsHost, options, maxValue, gsap, reduced = false }) {
  const renderer = createRenderer({ maxDpr: 2 });
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(-5, 9, 7);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const MAX_H = 4.6;
  const GAP = 1.45;
  const x0 = -((options.length - 1) * GAP) / 2;
  const hOf = (v) => Math.max(0.05, (v / maxValue) * MAX_H);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(options.length * GAP + 0.9, 0.1, 2.2),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, clearcoat: 1 })
  );
  floor.position.y = -0.05;
  root.add(floor);

  const towers = options.map((o, i) => {
    const g = new THREE.Group();
    g.position.x = x0 + i * GAP;
    root.add(g);
    const color = new THREE.Color(o.color3d);
    const box = new THREE.BoxGeometry(0.9, 1, 0.9);
    let solid = null, range = null, ghost = null;
    if (o.ghost) {
      ghost = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
      g.add(ghost);
    } else {
      solid = new THREE.Mesh(box, new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 }));
      range = new THREE.Mesh(box, new THREE.MeshPhysicalMaterial({ color, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.32, depthWrite: false }));
      g.add(solid, range);
    }
    const tag = document.createElement('div');
    tag.className = 'fx-towers__tag' + (o.brand ? ' is-brand' : '');
    tag.style.setProperty('--c', o.color);
    tag.innerHTML = `<b>${o.price}</b><span>${o.name}</span><em>${o.catch}</em>`;
    tagsHost.appendChild(tag);
    return { o, g, solid, range, ghost, tag, grow: reduced ? 1 : 0, lo: hOf(o.min), hi: hOf(o.ghost ? o.ghostHeight : o.max) };
  });

  let W = 1, H = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const half = Math.tan((camera.fov / 2) * (Math.PI / 180));
    const dist = Math.max(3.4 / half, ((options.length * GAP) / 2 + 0.8) / (half * camera.aspect));
    camera.position.set(0, dist * 0.3, dist);
    camera.lookAt(0, 1.9, 0);
    camera.updateProjectionMatrix();
  }

  let progress = reduced ? 1 : 0;
  let orbit = 0;
  let t = 0;
  let running = false;
  const v = new THREE.Vector3();
  function tick(time, deltaTime) {
    if (time && !onScreen(host)) return;
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    t += reduced ? 0 : dt;
    orbit += ((-0.32 + progress * 0.5) - orbit) * 0.06;
    root.rotation.y = orbit;
    towers.forEach((tw, i) => {
      // Staggered rise: each tower starts a little after the previous one;
      // the brand tower lands last with a small bounce.
      const start = i / (towers.length + 1);
      const target = Math.min(1, Math.max(0, (progress - start) * 2.6));
      tw.grow += (target - tw.grow) * 0.12;
      const k = tw.o.brand ? Math.min(1.08, tw.grow * 1.08) : tw.grow;
      const lo = Math.max(0.001, tw.lo * k);
      const hi = Math.max(0.001, tw.hi * k);
      if (tw.ghost) { tw.ghost.scale.y = hi; tw.ghost.position.y = hi / 2; }
      else {
        tw.solid.scale.y = lo; tw.solid.position.y = lo / 2;
        tw.range.scale.y = Math.max(0.001, hi - lo); tw.range.position.y = lo + (hi - lo) / 2;
      }
      if (tw.o.brand) tw.g.position.y = Math.sin(t * 2) * 0.03 * tw.grow;
      tw.tag.style.opacity = String(Math.min(1, tw.grow * 1.5));
      tw.topY = hi;
    });
    root.updateMatrixWorld();
    towers.forEach((tw) => {
      v.set(0, tw.topY + 0.25, 0).applyMatrix4(tw.g.matrixWorld).project(camera);
      tw.tag.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(-50%, -100%)`;
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
  resize();
  tick(0, 16);

  return {
    setProgress(p) { progress = reduced ? 1 : p; },
    destroy() {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

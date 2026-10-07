// 3D content calendar: a tilted month board of day tiles. As `setProgress`
// goes 0 → 1, each scheduled day flips over to reveal its post (real
// portfolio images) and the newest one lifts off the board.
import { THREE, createRenderer, studioEnvironment, onScreen } from './kit.js';

const TILE = 1;
const GAP = 0.16;

function coverTexture(src, size = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const s = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2.6, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function numberTexture(n, muted) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = muted ? '#efeeeb' : '#fdfdfe';
  ctx.fillRect(0, 0, 128, 128);
  if (n) {
    ctx.fillStyle = muted ? '#b9b9c0' : '#4b5563';
    ctx.font = '600 34px Satoshi, Satoshi Fallback, system-ui, sans-serif';
    ctx.fillText(String(n), 14, 44);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function headerTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#858c99';
  ctx.font = '500 30px Satoshi, Satoshi Fallback, system-ui, sans-serif';
  ctx.textAlign = 'center';
  'MON TUE WED THU FRI SAT SUN'.split(' ').forEach((d, i) => ctx.fillText(d, (i + 0.5) * (1024 / 7), 44));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mountCalendar({ host, days, offset, images, types, gsap, reduced = false }) {
  const renderer = createRenderer({ maxDpr: 2 });
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.9;
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const board = new THREE.Group();
  board.rotation.x = -0.72;
  scene.add(board);

  const rows = Math.ceil((offset + days.length) / 7);
  const step = TILE + GAP;
  const bw = 7 * step + 0.3, bh = rows * step + 0.9;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(bw, bh, 0.16),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 1 })
  );
  plate.position.set(0, 0.25, -0.1);
  board.add(plate);
  const header = new THREE.Mesh(new THREE.PlaneGeometry(7 * step, 0.44), new THREE.MeshBasicMaterial({ map: headerTexture(), transparent: true }));
  header.position.set(0, bh / 2 - 0.2, 0.001);
  board.add(header);

  const side = new THREE.MeshPhysicalMaterial({ color: 0xf1f0ed, roughness: 0.4 });
  const geo = new THREE.BoxGeometry(TILE, TILE, 0.08);
  const tiles = days.map((d, i) => {
    const slot = offset + i;
    const col = slot % 7, row = Math.floor(slot / 7);
    const front = new THREE.MeshBasicMaterial({ map: numberTexture(d.day, !d.type) });
    const back = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geo, [side, side, side, side, front, back]);
    const g = new THREE.Group();
    g.position.set((col - 3) * step, (rows / 2 - row - 0.5) * step - 0.2, 0.05);
    g.add(mesh);
    if (d.type) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.86, 0.09, 0.02), new THREE.MeshBasicMaterial({ color: types[d.type].color }));
      bar.position.set(0, -TILE / 2 + 0.1, -0.052);
      bar.rotation.y = Math.PI;
      mesh.add(bar);
    }
    board.add(g);
    return { d, g, mesh, back, flip: reduced && d.type ? 1 : 0, lift: 0 };
  });

  // Post images for the scheduled days (cycled from the portfolio set).
  let imgIndex = 0;
  tiles.filter((t) => t.d.type).forEach((t) => {
    const src = images[imgIndex++ % images.length];
    coverTexture(src).then((tex) => { if (tex) { t.back.map = tex; t.back.needsUpdate = true; } });
  });

  let W = 1, H = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const half = Math.tan((camera.fov / 2) * (Math.PI / 180));
    const dist = Math.max((bh * 0.62) / half, (bw * 0.56) / (half * camera.aspect)) + 1.2;
    camera.position.set(0, 0.4, dist);
    camera.lookAt(0, -0.2, 0);
    camera.updateProjectionMatrix();
  }

  let progress = reduced ? 1 : 0;
  let running = false;
  let t = 0;
  const scheduled = tiles.filter((x) => x.d.type);
  function tick(time, deltaTime) {
    if (time && !onScreen(host)) return;
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    t += reduced ? 0 : dt;
    board.rotation.z = Math.sin(t * 0.35) * 0.02 + (progress - 0.5) * 0.06;
    board.rotation.y = (progress - 0.5) * 0.22;
    const n = tiles.length;
    const cut = progress * n; // day index reached so far
    let newest = null;
    tiles.forEach((tile, i) => {
      if (!tile.d.type) return;
      const target = cut > i ? 1 : 0;
      tile.flip += (target - tile.flip) * (reduced ? 1 : 0.14);
      if (target) newest = tile;
    });
    scheduled.forEach((tile) => {
      const up = tile === newest && progress < 0.999 ? 1 : 0;
      tile.lift += (up - tile.lift) * 0.12;
      tile.mesh.rotation.y = tile.flip * Math.PI;
      tile.g.position.z = 0.05 + Math.sin(tile.flip * Math.PI) * 0.5 + tile.lift * 0.6;
      const s = 1 + tile.lift * 0.28;
      tile.g.scale.set(s, s, 1);
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
    setProgress(p) { progress = reduced ? 1 : p; if (!running) tick(0, 16); },
    destroy() {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

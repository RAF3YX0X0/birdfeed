// "Win the first 3 seconds": a 3D phone playing reels beside a retention
// chart. Two curves draw in as progress runs through a 15-second video —
// a strong hook keeps most viewers, a weak one loses them by second 3.
import { createScene, textTexture, glossy, label } from './base.js';

const SECONDS = 15;
const REELS = ['/assets/work/ugc-mic.webp', '/assets/work/video-plane.webp', '/assets/work/ugc-handmade.webp', '/assets/work/ugc-sam.webp', '/assets/work/ugc-comment.webp'];

function roundedRect(THREE, w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// strong/weak(seconds) → share still watching; passed in from the page data.
export function mount({ host, tags, gsap, reduced, strong, weak }) {
  let progress = reduced ? 1 : 0;
  let shown = progress;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(1.85 / half, 3.3 / (half * camera.aspect));
      camera.position.set(0.25, 0.3, d);
      camera.lookAt(0.25, 0.05, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.1);
      const sec = shown * SECONDS;
      phone.rotation.set(0.04, 0.42 + Math.sin(t * 0.5) * 0.05, 0.03);
      // Swap the reel every few seconds with a quick swipe.
      const idx = Math.min(REELS.length - 1, Math.floor(shown * REELS.length * 0.999));
      if (idx !== current) { current = idx; swipe = 1; screen.material.map = textures[idx] || screen.material.map; screen.material.needsUpdate = true; }
      swipe = Math.max(0, swipe - dt * 3);
      screen.position.y = swipe * -0.4;
      screen.material.opacity = 1 - swipe * 0.6;
      const n = Math.max(2, Math.floor(strongLine.geometry.index.count * shown / 6) * 6);
      strongLine.geometry.setDrawRange(0, n);
      weakLine.geometry.setDrawRange(0, n);
      marker.material.opacity = sec > 0.5 ? 0.5 : 0;
      ctx.root.updateMatrixWorld();
      const sx = X(sec);
      ctx.pin(tagStrong, new ctx.THREE.Vector3(sx, Y(strong(sec)) + 0.12, 0).applyMatrix4(chart.matrixWorld), '-10%, -100%');
      ctx.pin(tagWeak, new ctx.THREE.Vector3(sx, Y(weak(sec)) - 0.12, 0).applyMatrix4(chart.matrixWorld), '-10%, 0');
      tagStrong.innerHTML = `Strong hook <b>${Math.round(strong(sec) * 100)}%</b>`;
      tagWeak.innerHTML = `Weak hook <b>${Math.round(weak(sec) * 100)}%</b>`;
      ctx.pin(tag3, new ctx.THREE.Vector3(X(3), Y(1.04), 0).applyMatrix4(chart.matrixWorld), '-50%, -100%');
      ctx.pin(tagAxis, new ctx.THREE.Vector3(X(SECONDS), Y(0) - 0.12, 0).applyMatrix4(chart.matrixWorld), '-100%, 0');
    },
  });
  const { THREE, root } = ctx;

  // Phone
  const phone = new THREE.Group();
  phone.position.set(-2.1, 0, 0);
  root.add(phone);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(THREE, 1.5, 3.0, 0.24), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 6, curveSegments: 24 }), glossy(0x16181f));
  body.position.z = -0.1;
  phone.add(body);
  const screenMask = new THREE.Group();
  phone.add(screenMask);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.82), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  screen.position.z = 0.07;
  screenMask.add(screen);
  const loader = new THREE.TextureLoader();
  const textures = REELS.map((src, i) => loader.load(src, (tx) => { tx.colorSpace = THREE.SRGBColorSpace; if (i === current) { screen.material.map = tx; screen.material.needsUpdate = true; } }));
  let current = 0;
  let swipe = 0;

  // Chart
  const W = 3.6, H = 2.4;
  const X = (s) => -W / 2 + (s / SECONDS) * W;
  const Y = (v) => -H / 2 + v * H;
  const chart = new THREE.Group();
  chart.position.set(1.15, 0, 0);
  chart.rotation.y = -0.22;
  root.add(chart);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, H + 0.6, 0.06), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, clearcoat: 1 }));
  panel.position.z = -0.06;
  chart.add(panel);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({
    map: textTexture((c, w, h) => {
      c.strokeStyle = '#e6e5e1'; c.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { const y = (h - 2) * (i / 4) + 1; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.fillStyle = '#9a9aa3'; c.font = '500 22px Satoshi, Satoshi Fallback, system-ui, sans-serif';
      ['100%', '75%', '50%', '25%'].forEach((s, i) => c.fillText(s, 8, (h - 2) * (i / 4) + 26));
    }, 768, 512),
    transparent: true,
  }));
  grid.position.z = 0.002;
  chart.add(grid);
  const curveOf = (fn) => new THREE.CatmullRomCurve3(Array.from({ length: 61 }, (_, i) => new THREE.Vector3(X((i / 60) * SECONDS), Y(fn((i / 60) * SECONDS)), 0.04)));
  const strongLine = new THREE.Mesh(new THREE.TubeGeometry(curveOf(strong), 200, 0.045, 8, false), glossy(0x0066ff, { emissive: 0x0066ff, emissiveIntensity: 0.2 }));
  const weakLine = new THREE.Mesh(new THREE.TubeGeometry(curveOf(weak), 200, 0.04, 8, false), glossy(0x0a0a0a));
  chart.add(strongLine, weakLine);
  const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.02, H), new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0 }));
  marker.position.set(X(3), 0, 0.03);
  chart.add(marker);

  const tagStrong = label(tags, 'is-on', '');
  const tagWeak = label(tags, 'is-coral is-on', '');
  const tag3 = label(tags, 'is-plain', 'THE FIRST 3 SECONDS');
  const tagAxis = label(tags, 'is-plain', 'SECONDS INTO THE VIDEO →');
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 1 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

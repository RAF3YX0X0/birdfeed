// About page globe: a dotted sphere with the team's regions pinned and linked
// by arcs; progress rotates the globe and grows the arcs.
import { createScene, glossy, label, clamp } from './base.js';

const toVec = (THREE, lat, lon, r) => {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

export function mount({ host, tags, gsap, reduced, places }) {
  let progress = reduced ? 1 : 0;
  let shown = progress;
  const R = 2;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(2.9 / half, 2.9 / (half * camera.aspect));
      camera.position.set(0, 0.6, d);
      camera.lookAt(0, 0, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.08);
      // Americas facing us at the start, turning to Europe by the end.
      globe.rotation.y = 0.2 - shown * 1.8 + Math.sin(t * 0.2) * 0.04;
      globe.rotation.x = 0.35;
      arcs.forEach((a, i) => {
        const g = clamp(shown * arcs.length * 1.2 - i * 0.6, 0, 1);
        a.geometry.setDrawRange(0, Math.floor(a.geometry.index.count * g / 6) * 6);
      });
      ctx.root.updateMatrixWorld();
      const cam = ctx.camera.position;
      pins.forEach((p) => {
        const w = p.at.clone().applyMatrix4(globe.matrixWorld);
        const facing = w.clone().normalize().dot(cam.clone().normalize()) > 0.1;
        p.tag.style.opacity = facing ? '1' : '0';
        ctx.pin(p.tag, w.multiplyScalar(1.08));
      });
    },
  });
  const { THREE, root } = ctx;
  const globe = new THREE.Group();
  root.add(globe);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 48), new THREE.MeshPhysicalMaterial({ color: 0xf6f6fb, roughness: 0.5, clearcoat: 0.6 })));

  // Fibonacci-sphere dots.
  const N = 1400, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
  }
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  globe.add(new THREE.Points(dotsGeo, new THREE.PointsMaterial({ color: 0x1a75ff, size: 0.05, sizeAttenuation: true })));

  const pins = places.map((pl) => {
    const at = toVec(THREE, pl.lat, pl.lon, R);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), glossy(pl.color || 0x0066ff, { emissive: pl.color || 0x0066ff, emissiveIntensity: 0.4 }));
    pin.position.copy(at);
    globe.add(pin);
    return { at, tag: label(tags, 'is-on', pl.name) };
  });
  const arcs = [];
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const a = toVec(THREE, places[i].lat, places[i].lon, R), b = toVec(THREE, places[j].lat, places[j].lon, R);
      const mid = a.clone().add(b).normalize().multiplyScalar(R * 1.45);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.018, 6, false), new THREE.MeshBasicMaterial({ color: 0x0a0a0a }));
      globe.add(arc);
      arcs.push(arc);
    }
  }
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 1 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

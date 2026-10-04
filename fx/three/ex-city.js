// City pages: a stylised city on a round map tile with a map pin at the
// business; a reach ring spreads out with progress and lights up the blocks
// (people) it covers.
import { createScene, glossy, label } from './base.js';

export function mount({ host, tags, gsap, reduced, city }) {
  let progress = reduced ? 1 : 0;
  let shown = progress;
  const R = 4;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(2.6 / half, 4.3 / (half * camera.aspect));
      camera.position.set(0, d * 0.72, d * 0.72);
      camera.lookAt(0, 0, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.08);
      ctx.root.rotation.y = shown * 0.6 + Math.sin(t * 0.2) * 0.05;
      const reach = 0.4 + shown * (R - 0.3);
      ring.scale.set(reach, reach, 1);
      ring.material.opacity = 0.55;
      pulse.scale.setScalar(0.4 + ((t * 0.6) % 1) * reach);
      pulse.material.opacity = 0.35 * (1 - ((t * 0.6) % 1));
      blocks.forEach((b) => {
        const inside = b.d <= reach;
        b.mesh.material = inside ? lit : dim;
        b.mesh.scale.y = b.h * (inside ? 1.15 : 1);
        b.mesh.position.y = (b.h * (inside ? 1.15 : 1)) / 2;
      });
      pin.position.y = 1.05 + Math.sin(t * 2.4) * 0.08;
      pin.rotation.y = t;
      ctx.root.updateMatrixWorld();
      ctx.pin(tag, pin.position.clone().add(new ctx.THREE.Vector3(0, 0.6, 0)).applyMatrix4(ctx.root.matrixWorld));
    },
  });
  const { THREE, root } = ctx;
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.4, R + 0.4, 0.12, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, clearcoat: 1 })));

  const dim = new THREE.MeshPhysicalMaterial({ color: 0xe4e3df, roughness: 0.4 });
  const lit = glossy(0x7088ff);
  const box = new THREE.BoxGeometry(0.34, 1, 0.34);
  const blocks = [];
  // Deterministic pseudo-random city so every load looks the same.
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let x = -R; x <= R; x += 0.5) {
    for (let z = -R; z <= R; z += 0.5) {
      const d = Math.hypot(x, z);
      if (d > R || d < 0.5 || rnd() < 0.18) continue;
      const h = 0.15 + rnd() * rnd() * 1.1 * (1.2 - d / R);
      const mesh = new THREE.Mesh(box, dim);
      mesh.position.set(x + (rnd() - 0.5) * 0.12, h / 2, z + (rnd() - 0.5) * 0.12);
      root.add(mesh);
      blocks.push({ mesh, d, h });
    }
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 128), new THREE.MeshBasicMaterial({ color: 0x0029ff, transparent: true, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  const pulse = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({ color: 0x0029ff, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.07;
  root.add(ring, pulse);

  // Map pin: cone + sphere.
  const pin = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 24), glossy(0x0a0b10));
  head.position.y = 0.35;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 32), glossy(0x0a0b10));
  tip.rotation.x = Math.PI;
  pin.add(head, tip);
  root.add(pin);
  const tag = label(tags, 'is-coral is-on', `Your business, ${city}`);
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 1 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

// "Follow the customer": a winding 3D path from ad to purchase. A glowing
// customer travels along it with progress; each step lights up and sends a
// "tracked" ping as the customer passes it.
import { createScene, glossy, label, clamp } from './base.js';

const STEPS = ['Sees your ad', 'Clicks', 'Visits your site', 'Adds to cart', 'Buys'];

export function mount({ host, tags, gsap, reduced }) {
  let progress = reduced ? 1 : 0;
  let shown = progress;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(3.2 / half, 5.4 / (half * camera.aspect));
      camera.position.set(0, d * 0.55, d * 0.85);
      camera.lookAt(0, 0, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.08);
      ctx.root.rotation.y = Math.sin(t * 0.25) * 0.08;
      const u = clamp(shown, 0, 1) * 0.999;
      curve.getPointAt(u, walker.position);
      walker.position.y += 0.35;
      glow.position.copy(walker.position);
      glow.scale.setScalar(1 + Math.sin(t * 6) * 0.08);
      ctx.root.updateMatrixWorld();
      nodes.forEach((n, i) => {
        const reached = u >= n.u - 0.002;
        n.on += ((reached ? 1 : 0) - n.on) * 0.15;
        n.pod.material.emissiveIntensity = n.on * 0.55;
        n.pod.position.y = 0.12 + n.on * 0.08;
        if (reached && !n.pinged) { n.pinged = true; n.ring.userData.t = 0; }
        if (!reached) n.pinged = false;
        const rt = n.ring.userData.t;
        if (rt !== undefined && rt < 1) {
          n.ring.userData.t = rt + dt * 0.9;
          n.ring.scale.setScalar(1 + rt * 2.4);
          n.ring.material.opacity = 0.6 * (1 - rt);
        } else n.ring.material.opacity = 0;
        n.tag.classList.toggle('is-on', reached);
        ctx.pin(n.tag, n.top.clone().applyMatrix4(ctx.root.matrixWorld));
      });
      // The path behind the customer fills in.
      done.geometry.setDrawRange(0, Math.floor(done.geometry.index.count * u / 6) * 6);
    },
  });
  const { THREE, root } = ctx;

  const pts = [[-4.2, 0, 1.2], [-2.2, 0, -0.8], [0, 0, 0.9], [2.2, 0, -0.9], [4.2, 0, 1.0]];
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const tube = (radius, mat) => new THREE.Mesh(new THREE.TubeGeometry(curve, 240, radius, 10, false), mat);
  root.add(tube(0.06, new THREE.MeshPhysicalMaterial({ color: 0xdfe2ea, roughness: 0.5 })));
  const done = tube(0.075, glossy(0x3b5bff, { emissive: 0x3b5bff, emissiveIntensity: 0.25 }));
  root.add(done);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.08, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, transparent: true, opacity: 0.85 }));
  floor.position.y = -0.12;
  root.add(floor);

  const nodes = STEPS.map((name, i) => {
    const u = i / (STEPS.length - 1);
    const p = curve.getPointAt(Math.min(0.999, u));
    const color = i === STEPS.length - 1 ? 0xe8435f : 0x3b5bff;
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.24, 48), glossy(0xffffff, { emissive: color, emissiveIntensity: 0 }));
    pod.position.set(p.x, 0.12, p.z);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 32), glossy(color));
    pod.add(dot);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(p.x, 0.05, p.z);
    root.add(pod, ring);
    const tag = label(tags, i === STEPS.length - 1 ? 'is-coral' : '', `${name} <b>✓</b>`);
    return { u, pod, ring, tag, on: 0, pinged: false, top: new THREE.Vector3(p.x, 0.75, p.z) };
  });

  const walker = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 20), glossy(0xff5c7a));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff5c7a, transparent: true, opacity: 0.18 }));
  root.add(walker, glow);
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 1 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

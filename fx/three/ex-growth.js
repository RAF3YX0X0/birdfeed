// "Real growth vs. bought followers": two rows of glossy bars build month by
// month. Real followers grow steadily and send up hearts (engagement); bought
// followers spike in month one, then sit still with almost no hearts.
import { createScene, glossy, label, clamp } from './base.js';

export function mount({ host, tags, gsap, reduced, real: REAL, bought: BOUGHT }) {
  let progress = reduced ? 1 : 0;
  let shown = progress;
  const MAX = 5200, HGT = 3.2, GAP = 1.05;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(2.3 / half, 3.5 / (half * camera.aspect)) + 1;
      camera.position.set(0, d * 0.3, d);
      camera.lookAt(0, 1.3, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.1);
      ctx.root.rotation.y = -0.38 + Math.sin(t * 0.3) * 0.05;
      const months = shown * 6;
      rows.forEach((row) => row.bars.forEach((bar, i) => {
        const grow = clamp(months - i, 0, 1);
        const h = Math.max(0.001, (row.data[i] / MAX) * HGT * grow);
        bar.scale.y = h;
        bar.position.y = h / 2;
      }));
      // Hearts float up from the newest real bar, rarely from the bought one.
      const m = clamp(Math.ceil(months) - 1, 0, 5);
      hearts.forEach((hrt) => {
        hrt.t += dt * hrt.speed;
        if (hrt.t > 1) {
          hrt.t = 0;
          hrt.row = Math.random() < 0.95 ? rows[0] : rows[1];
          hrt.x = (Math.random() - 0.5) * 0.5;
        }
        const bar = hrt.row.bars[m];
        const live = months > 0.2 && (hrt.row === rows[0] || hrt.rare);
        hrt.mesh.visible = live && !reduced;
        hrt.mesh.position.set(bar.position.x + hrt.x, bar.scale.y + hrt.t * 1.4, bar.position.z);
        hrt.mesh.scale.setScalar(0.12 * (1 - hrt.t * 0.6));
      });
      ctx.root.updateMatrixWorld();
      rows.forEach((row) => {
        const bar = row.bars[m];
        const v = Math.round(row.data[m] * clamp(months - m, 0, 1));
        const text = `${row.name} <b>${v.toLocaleString('en-US')}</b>`;
        if (row.tag.dataset.v !== text) { row.tag.dataset.v = text; row.tag.innerHTML = text; }
        ctx.pin(row.tag, new ctx.THREE.Vector3(bar.position.x, bar.scale.y + 0.25, bar.position.z).applyMatrix4(ctx.root.matrixWorld));
      });
    },
  });
  const { THREE, root } = ctx;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(6 * GAP + 0.8, 0.08, 3.2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4, clearcoat: 1 }));
  floor.position.y = -0.04;
  root.add(floor);
  const box = new THREE.BoxGeometry(0.62, 1, 0.62);
  const mk = (name, data, z, mat, cls) => ({
    name, data, tag: label(tags, cls, ''),
    bars: data.map((_, i) => { const b = new THREE.Mesh(box, mat); b.position.set((i - 2.5) * GAP, 0, z); root.add(b); return b; }),
  });
  const rows = [
    mk('Real followers', REAL, 0.75, glossy(0x0066ff), 'is-on'),
    mk('Bought followers', BOUGHT, -0.75, new THREE.MeshPhysicalMaterial({ color: 0xb7b9c2, roughness: 0.35, transparent: true, opacity: 0.7 }), ''),
  ];

  // Heart shape for engagement particles.
  const s = new THREE.Shape();
  s.moveTo(0, -0.35); s.bezierCurveTo(-0.6, 0.05, -0.35, 0.55, 0, 0.25); s.bezierCurveTo(0.35, 0.55, 0.6, 0.05, 0, -0.35);
  const heartGeo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 });
  heartGeo.center();
  const heartMat = glossy(0x0066ff);
  const hearts = Array.from({ length: 14 }, (_, i) => {
    const mesh = new THREE.Mesh(heartGeo, heartMat);
    root.add(mesh);
    return { mesh, t: i / 14, speed: 0.5 + Math.random() * 0.4, row: rows[0], x: 0, rare: i === 0 };
  });

  const legend = label(tags, 'is-plain', 'MONTH 1 → 6');
  legend.style.left = '12px';
  legend.style.top = '10px';
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 1 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

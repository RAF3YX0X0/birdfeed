// "Your brand on top": a white-label stack. Progress pulls the layers apart
// to show who does what, then settles them back so only the partner's brand
// shows — which is all their clients ever see.
import { createScene, textTexture, glossy, label, clamp } from './base.js';

export function mount({ host, tags, gsap, reduced, layers }) {
  let progress = reduced ? 0.5 : 0;
  let shown = progress;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(3.3 / half, 3.6 / (half * camera.aspect));
      camera.position.set(0, d * 0.62, d * 0.8);
      camera.lookAt(0, 0.9, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.08);
      // 0 → 0.75 explode, 0.75 → 1 settle back (only the brand shows).
      const open = shown < 0.75 ? clamp(shown / 0.45, 0, 1) : clamp(1 - (shown - 0.75) / 0.25, 0, 1);
      ctx.root.rotation.y = -0.6 + shown * 0.5 + Math.sin(t * 0.3) * 0.04;
      ctx.root.updateMatrixWorld();
      items.forEach((it, i) => {
        const y = i * (0.28 + open * 0.85);
        it.mesh.position.y = y;
        const show = i === items.length - 1 ? 1 : open;
        it.tag.style.opacity = String(show);
        it.tag.classList.toggle('is-on', i === items.length - 1);
        ctx.pin(it.tag, new ctx.THREE.Vector3(1.75, y, 0).applyMatrix4(ctx.root.matrixWorld), '0, -50%');
      });
    },
  });
  const { THREE, root } = ctx;
  const items = layers.map((l, i) => {
    const top = i === layers.length - 1;
    const tex = textTexture((x, w, h) => {
      x.fillStyle = top ? '#3b5bff' : '#fbfaf8'; x.fillRect(0, 0, w, h);
      x.fillStyle = top ? '#ffffff' : '#8a8b95'; x.font = `600 ${top ? 56 : 44}px Geist, Inter, sans-serif`; x.textAlign = 'center';
      x.fillText(l.face, w / 2, h / 2 + 18);
    }, 1024, 512);
    const face = new THREE.MeshBasicMaterial({ map: tex });
    const side = top ? glossy(0x3b5bff) : glossy(0xf1f0ed, { transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 1.9), [side, side, face, side, side, side]);
    root.add(mesh);
    const tag = label(tags, '', `<b>${l.name}</b>`);
    return { mesh, tag };
  });
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 0.5 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

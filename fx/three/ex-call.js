// "What happens on the call": the three parts of the demo as glossy cards on
// a 3D ring; progress turns the ring so each part comes to the front.
import { createScene, textTexture, glossy, ease } from './base.js';

export function mount({ host, gsap, reduced, cards }) {
  let progress = reduced ? 0.5 : 0;
  let shown = progress;
  const N = cards.length;
  const STEP = 50 * Math.PI / 180, R = 3.2;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(1.35 / half, 2.6 / (half * camera.aspect)) + R * 0.3;
      camera.position.set(0, 0.5, d);
      camera.lookAt(0, 0, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.1);
      const rot = -ease(Math.min(1, shown)) * (N - 1) * STEP;
      items.forEach((it, i) => {
        const a = i * STEP + rot;
        it.g.position.set(Math.sin(a) * R, Math.sin(t * 1.2 + i) * 0.05, Math.cos(a) * R - R);
        it.g.rotation.y = a * 0.85;
        const front = Math.max(0, Math.cos(a));
        it.g.scale.setScalar(0.85 + 0.2 * Math.pow(front, 6));
      });
    },
  });
  const { THREE, root } = ctx;
  const items = cards.map((c, i) => {
    const g = new THREE.Group();
    const tex = textTexture((x, w, h) => {
      x.fillStyle = '#fefefc'; x.fillRect(0, 0, w, h);
      x.scale(1.6, 1.6);
      x.fillStyle = '#0029ff'; x.beginPath(); x.arc(70, 76, 34, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.font = '700 34px Inter, Inter Fallback, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText(String(i + 1), 70, 88);
      x.textAlign = 'left'; x.fillStyle = '#8a8b95'; x.font = '500 24px Inter, Inter Fallback, system-ui, sans-serif'; x.fillText(c.time.toUpperCase(), 124, 86);
      x.fillStyle = '#0a0b10'; x.font = '600 46px Inter, Inter Fallback, system-ui, sans-serif';
      wrap(x, c.title, 40, 190, 640 - 80, 54);
      x.fillStyle = '#52525b'; x.font = '400 30px Inter, Inter Fallback, system-ui, sans-serif';
      wrap(x, c.text, 40, 330, 640 - 80, 40);
    }, 1024, 832);
    const face = new THREE.MeshBasicMaterial({ map: tex });
    const side = glossy(0xffffff);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.95, 0.08), [side, side, side, side, face, side]));
    root.add(g);
    return { g };
  });
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 0.5 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

function wrap(ctx, text, x, y, max, lh) {
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > max && line) { ctx.fillText(line, x, y); line = word; y += lh; }
    else line = test;
  }
  ctx.fillText(line, x, y);
}

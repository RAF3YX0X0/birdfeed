// "Climb to page one": a tilted column of search results. As progress runs
// through the year, the highlighted "your business" result climbs from page 5
// to #1, nudging competitors down; anything past #10 fades into "page 2".
import { createScene, textTexture, glossy, label, clamp, lerp } from './base.js';

// Rank at progress p, interpolated through the given keyframes (month 0 → 12).
export function rankAt(p, ranks) {
  const f = clamp(p, 0, 1) * (ranks.length - 1);
  const i = Math.floor(f);
  return lerp(ranks[i], ranks[Math.min(i + 1, ranks.length - 1)], f - i);
}

const SLOT = 0.62;
const slotY = (rank) => 2.9 - (rank - 1) * SLOT;

function resultCard(THREE, mine, n) {
  const tex = textTexture((ctx, w, h) => {
    ctx.fillStyle = mine ? '#0029ff' : '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = mine ? 'rgba(255,255,255,.95)' : '#d9dde8';
    ctx.beginPath(); ctx.arc(34, 40, 14, 0, Math.PI * 2); ctx.fill();
    if (mine) {
      ctx.fillStyle = '#fff';
      ctx.font = '600 30px Inter, Inter Fallback, system-ui, sans-serif';
      ctx.fillText('Your business — exactly what they searched', 62, 50);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.font = '400 20px Inter, Inter Fallback, system-ui, sans-serif';
      ctx.fillText('yourbusiness.com', 62, 84);
    } else {
      ctx.fillStyle = '#c8ccd6';
      ctx.fillRect(62, 30, 300 + ((n * 53) % 160), 18);
      ctx.fillStyle = '#e3e5ec';
      ctx.fillRect(62, 68, 180 + ((n * 37) % 90), 12);
    }
    ctx.fillStyle = mine ? 'rgba(255,255,255,.55)' : '#eceef3';
    ctx.fillRect(20, 104, 560 + ((n * 29) % 200), 10);
    ctx.strokeStyle = mine ? '#0021d6' : '#d6d9e2';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }, 1024, 128);
  const face = new THREE.MeshBasicMaterial({ map: tex });
  const side = mine ? glossy(0x0029ff) : glossy(0xf4f3f0);
  return new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.52, 0.06), [side, side, side, side, face, side]);
}

export function mount({ host, tags, gsap, reduced, ranks }) {
  let progress = reduced ? 1 : 0;
  let shown = progress;
  const ctx = createScene({
    host, gsap, reduced, fov: 30,
    fit(camera) {
      const half = Math.tan((camera.fov / 2) * Math.PI / 180);
      const d = Math.max(3.9 / half, 4.1 / (half * camera.aspect));
      camera.position.set(0.4, 0.4, d);
      camera.lookAt(0.4, -0.5, 0);
    },
    frame(dt, t) {
      shown += (progress - shown) * (reduced ? 1 : 0.1);
      const r = rankAt(shown, ranks);
      ctx.root.rotation.set(-0.2, 0.18 + Math.sin(t * 0.3) * 0.03, 0.01);
      // Your card: on page 1 at its slot, otherwise hovering below the fold.
      const myY = r <= 10.5 ? slotY(r) : slotY(10) - 0.8 - Math.min(0.6, (r - 10) * 0.025);
      mine.position.set(0, myY, 0.25);
      mine.scale.setScalar(1.04);
      others.forEach((card, j) => {
        const natural = j + 1;
        const shift = clamp(natural + 0.5 - r, 0, 1); // pushed down once you pass it
        const rank = natural + shift;
        card.position.set(0, rank > 10 ? slotY(10) - 0.9 - (rank - 10) * 0.25 : slotY(rank), 0);
        card.visible = rank < 11.6;
      });
      ctx.root.updateMatrixWorld();
      ctx.pin(myTag, mine.position.clone().add(new ctx.THREE.Vector3(2.45, 0, 0.1)).applyMatrix4(ctx.root.matrixWorld), '0, -50%');
      const shownRank = Math.round(r);
      if (myTag.dataset.r !== String(shownRank)) { myTag.dataset.r = shownRank; myTag.innerHTML = `<b>#${shownRank}</b> your business`; }
      myTag.classList.toggle('is-on', r <= 10.5);
      ctx.pin(p1, new ctx.THREE.Vector3(-2.4, slotY(1) + 0.45, 0).applyMatrix4(ctx.root.matrixWorld), '0, -100%');
      ctx.pin(p2, new ctx.THREE.Vector3(-2.4, slotY(10) - 0.55, 0).applyMatrix4(ctx.root.matrixWorld), '0, 0');
    },
  });
  const { THREE, root } = ctx;
  const mine = resultCard(THREE, true, 0);
  root.add(mine);
  const others = Array.from({ length: 10 }, (_, j) => { const c = resultCard(THREE, false, j + 1); root.add(c); return c; });
  const myTag = label(tags, '', '');
  const p1 = label(tags, 'is-plain', 'PAGE 1 OF GOOGLE');
  const p2 = label(tags, 'is-plain', 'PAGE 2 AND BEYOND · almost nobody looks here');
  ctx.refresh();
  return { setProgress(p) { progress = reduced ? 1 : p; ctx.refresh(); }, destroy: ctx.destroy };
}

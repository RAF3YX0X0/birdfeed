// 3D sales funnel: five glossy tiers with "people" pouring in at the top.
// Some drop out at each tier; the ones that reach the bottom loop back up the
// outside as referrals. The active stage's tier lifts and glows.
import { THREE, createRenderer, studioEnvironment, onScreen, softwareGL } from './kit.js';

const TOP = 3;
const BOT = -3;
const GAP = 0.2;
const radiusAt = (y) => 0.6 + ((y - BOT) / (TOP - BOT)) * 2.7; // narrow at the bottom
// Share of people who continue past each tier (a visual rhythm, not real rates).
const KEEP = [0.62, 0.58, 0.56, 0.7];

export function mountFunnel({ host, tagsHost, stages, gsap, reduced = false }) {
  const renderer = createRenderer({ maxDpr: 2 });
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-5, 9, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb9c4ff, 0.8);
  fill.position.set(6, -2, 4);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  // ---- tiers ---------------------------------------------------------------
  const N = stages.length;
  const layerH = (TOP - BOT - GAP * (N - 1)) / N;
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.28, clearcoat: 1 });
  const tiers = stages.map((s, i) => {
    const yTop = TOP - i * (layerH + GAP);
    const yBot = yTop - layerH;
    const color = new THREE.Color(s.color3d);
    const mat = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.2, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1,
      transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false,
      emissive: color, emissiveIntensity: 0,
    });
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(radiusAt(yTop), radiusAt(yBot), layerH, 96, 1, true), mat);
    shell.renderOrder = 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(yTop), 0.045, 12, 128), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = layerH / 2;
    const g = new THREE.Group();
    g.position.y = (yTop + yBot) / 2;
    g.add(shell, rim);
    root.add(g);
    return { g, mat, color, yTop, yBot, yMid: (yTop + yBot) / 2, r: radiusAt((yTop + yBot) / 2), focus: 0, lift: 0 };
  });

  // ---- people --------------------------------------------------------------
  const COUNT = reduced ? 0 : softwareGL() ? 70 : 160;
  const inst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.075, 14, 10),
    new THREE.MeshStandardMaterial({ roughness: 0.35 }),
    Math.max(1, COUNT)
  );
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  inst.count = COUNT;
  root.add(inst);
  const WHITE = new THREE.Color(0xffffff);
  const GREY = new THREE.Color(0xb8bac4);
  const LOYAL = new THREE.Color(stages[N - 1].color3d);
  const loopCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, BOT - 0.25, 0),
    new THREE.Vector3(3.9, BOT - 0.7, 0.6),
    new THREE.Vector3(3.9, TOP + 1.3, 0.6),
    new THREE.Vector3(0.9, TOP + 0.7, 0)
  );

  // Faint path showing the referral loop.
  const loopPath = new THREE.Mesh(
    new THREE.TubeGeometry(loopCurve, 80, 0.022, 8, false),
    new THREE.MeshBasicMaterial({ color: LOYAL, transparent: true, opacity: 0.35, depthWrite: false })
  );
  root.add(loopPath);

  const people = Array.from({ length: COUNT }, () => spawn({}, true));
  function spawn(p, initial) {
    p.state = 'fall';
    p.y = TOP + 0.2 + Math.random() * (initial ? 9 : 2.5);
    p.a = Math.random() * Math.PI * 2;
    p.rf = 0.2 + Math.random() * 0.62;
    p.speed = 0.85 + Math.random() * 0.55;
    p.spin = (0.5 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1);
    p.next = 0;
    p.life = 1;
    p.t = 0;
    p.pos = p.pos || new THREE.Vector3();
    p.vel = p.vel || new THREE.Vector3();
    p.col = p.col || new THREE.Color();
    return p;
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sv = new THREE.Vector3();
  let active = -1;

  function stepPeople(dt) {
    for (let i = 0; i < COUNT; i++) {
      const p = people[i];
      let scale = 1;
      if (p.state === 'fall') {
        p.y -= p.speed * dt;
        p.a += p.spin * dt;
        const yy = Math.min(p.y, TOP);
        const r = radiusAt(yy) * p.rf * (p.y > TOP ? 1.1 : 1);
        p.pos.set(Math.cos(p.a) * r, p.y, Math.sin(p.a) * r);
        // Crossing the bottom of a tier: continue, or drop out.
        if (p.next < N - 1 && p.y < tiers[p.next].yBot) {
          if (Math.random() < KEEP[p.next]) p.next++;
          else {
            p.state = 'drop';
            const out = Math.atan2(p.pos.z, p.pos.x);
            p.vel.set(Math.cos(out) * (1.3 + Math.random()), -0.3 - Math.random() * 0.5, Math.sin(out) * (1.3 + Math.random()));
          }
        }
        if (p.y < BOT) { p.state = 'loop'; p.t = 0; }
        const tier = tiers[Math.min(p.next, N - 1)];
        p.col.copy(tier.color).lerp(WHITE, 0.25);
        if (p.next === active && p.y <= TOP) scale = 1.35;
        if (p.y > TOP + 1.4) scale = 0; // still queued above the view
      } else if (p.state === 'drop') {
        p.vel.y -= 2.2 * dt;
        p.pos.addScaledVector(p.vel, dt);
        p.life -= dt * 1.1;
        scale = Math.max(0, p.life);
        p.col.copy(GREY);
        if (p.life <= 0) spawn(p, false);
      } else {
        // Loyal customers travel back up the outside: referrals re-enter the top.
        p.t += dt / 2.8;
        loopCurve.getPoint(Math.min(1, p.t), p.pos);
        p.col.copy(LOYAL);
        scale = active === N - 1 ? 1.5 : 1.15;
        if (p.t >= 1) { spawn(p, false); p.y = TOP + 0.4; }
      }
      sv.setScalar(scale);
      m.compose(p.pos, q, sv);
      inst.setMatrixAt(i, m);
      inst.setColorAt(i, p.col);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }

  // ---- labels beside each tier ---------------------------------------------
  const tagEls = stages.map((s, i) => {
    const el = document.createElement('span');
    el.className = 'fx-funnel__tag';
    el.style.setProperty('--c', s.color);
    el.innerHTML = `<i>${i + 1}</i>${s.key}`;
    tagsHost.appendChild(el);
    return el;
  });
  // Labels follow the funnel's tilt but not its spin, so they stay on the left.
  const proj = new THREE.Vector3();
  const tilt = new THREE.Matrix4();
  function placeTags(w, h) {
    tilt.makeRotationX(root.rotation.x);
    tiers.forEach((tr, i) => {
      proj.set(-(tr.r * (1 + tr.focus * 0.09) + 0.3), tr.yMid + tr.lift, 0).applyMatrix4(tilt).project(camera);
      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      tagEls[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-100%, -50%)`;
    });
  }

  // ---- layout ----------------------------------------------------------------
  let W = 1, H = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // Fit the funnel plus the referral loop, whatever the box shape.
    const half = Math.tan((camera.fov / 2) * (Math.PI / 180));
    // Narrow boxes (phones): step back and slide the funnel right so the
    // tier labels on its left stay on screen.
    const compact = W < 560;
    const dist = (Math.max(4.1 / half, 4.9 / (half * camera.aspect)) + 1) * (compact ? 1.22 : 1);
    camera.position.set(compact ? -1.5 : 0, dist * 0.2, dist);
    camera.lookAt(compact ? -1.5 : 0, 0.1, 0);
    camera.updateProjectionMatrix();
  }

  // ---- loop ------------------------------------------------------------------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let spinAngle = 0;
  let running = false;
  function tick(time, deltaTime) {
    if (time && !onScreen(host)) return; // frame-loop call while off-screen
    const dt = Math.min(deltaTime || 16, 50) / 1000;
    const f = 1 - Math.pow(0.9, dt * 60);
    pointer.sx += (pointer.x - pointer.sx) * f * 0.5;
    pointer.sy += (pointer.y - pointer.sy) * f * 0.5;
    if (!reduced) spinAngle += dt * 0.18;
    root.rotation.set(0.12 + pointer.sy * 0.08, spinAngle + pointer.sx * 0.25, 0);

    tiers.forEach((tr, i) => {
      const target = i === active ? 1 : 0;
      tr.focus += (target - tr.focus) * f;
      tr.lift = tr.focus * 0.18;
      tr.g.position.y = tr.yMid + tr.lift;
      const s = 1 + tr.focus * 0.09;
      tr.g.scale.set(s, 1, s);
      tr.mat.emissiveIntensity = tr.focus * 0.35;
      tr.mat.opacity = active < 0 ? 0.82 : 0.42 + 0.5 * tr.focus + (i < active ? 0.08 : 0);
    });
    if (COUNT) stepPeople(dt);
    root.updateMatrixWorld();
    placeTags(W, H);
    renderer.render(scene, camera);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick);
  }

  const io = new IntersectionObserver((list) => { const e = list[list.length - 1]; // latest state wins
    if (reduced) { if (e.isIntersecting) tick(0, 16); return; }
    setRunning(e.isIntersecting && !document.hidden);
  });
  io.observe(host);
  const ro = new ResizeObserver(() => { resize(); if (!running) tick(0, 16); });
  ro.observe(host);
  const onMove = (e) => {
    const r = host.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });
  resize();
  tick(0, 16);

  return {
    setActive(i) {
      active = i;
      tagEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
      if (!running) {
        // Reduced motion: jump straight to the highlighted state.
        tiers.forEach((tr, k) => { tr.focus = k === i ? 1 : 0; });
        tick(0, 16);
      }
    },
    destroy() {
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      renderer.dispose();
      renderer.domElement.remove();
      tagEls.forEach((el) => el.remove());
    },
  };
}

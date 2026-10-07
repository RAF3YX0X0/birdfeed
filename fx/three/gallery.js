// 3D helix gallery: portfolio pieces wrapped around a spiral that turns as the
// (pinned) section is scrolled, can be dragged/flung, and tracks the pointer.
import { THREE, createRenderer, onScreen } from './kit.js';

const BG = 0x0a0a0a;

function loadCardTexture(src, maxSide, cornerRatio) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * s);
      const h = Math.round(img.naturalHeight * s);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      const r = Math.round(h * cornerRatio);
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, r);
      ctx.clip();
      ctx.drawImage(img, 0, 0, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      resolve({ tex, aspect: w / h });
    };
    img.onerror = reject;
    img.src = src;
  });
}

function bentPlane(w, h, radius) {
  const g = new THREE.PlaneGeometry(w, h, 24, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = p.getX(i) / radius;
    p.setX(i, Math.sin(a) * radius);
    p.setZ(i, Math.cos(a) * radius - radius);
  }
  g.computeVertexNormals();
  return g;
}

export function mountGallery({ section, stage, images, gsap, reduced = false, onOpen }) {
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  const R = mobile ? 4.1 : 6.4;
  const H = mobile ? 2.5 : 3.0;
  const GAP = mobile ? 0.28 : 0.36;
  const RISE = H + (mobile ? 0.9 : 1.25);

  const renderer = createRenderer({ maxDpr: mobile ? 1.5 : 2 });
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, mobile ? 11 : 15, mobile ? 20 : 27);
  const camera = new THREE.PerspectiveCamera(mobile ? 46 : 36, 1, 0.1, 100);
  const camBase = new THREE.Vector3(0, mobile ? 0.9 : 1.4, mobile ? 12.5 : 17.2);
  camera.position.copy(camBase);

  const helix = new THREE.Group();
  helix.rotation.z = -0.06;
  scene.add(helix);

  // Lay the cards out along the spiral using each image's real aspect ratio.
  const cards = [];
  let theta = 0;
  images.forEach((img, i) => {
    const w = H * img.aspect;
    const half = (w / 2 + GAP / 2) / R;
    if (i > 0) theta += half;
    const pivot = new THREE.Group();
    pivot.rotation.y = theta;
    pivot.position.y = (-theta / (Math.PI * 2)) * RISE;
    helix.add(pivot);
    cards.push({ src: img.src, w, theta, pivot, mesh: null, front: null, hover: 0, appear: 0 });
    theta += half;
  });
  const PHI_MAX = cards.length ? cards[cards.length - 1].theta : 0;

  function addCardMesh(card, tex) {
    const geo = bentPlane(card.w, H, R);
    const front = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.FrontSide });
    const back = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.BackSide, color: 0x1c2030 });
    const mesh = new THREE.Mesh(geo, front);
    const backMesh = new THREE.Mesh(geo, back);
    mesh.position.z = R;
    backMesh.position.z = R;
    mesh.userData.card = card;
    card.pivot.add(mesh, backMesh);
    card.mesh = mesh;
    card.front = front;
    card.pivot.scale.setScalar(0.0001);
    gsap.to(card, { appear: 1, duration: reduced ? 0 : 1.1, ease: 'expo.out', delay: Math.random() * 0.25 });
  }

  const maxSide = mobile ? 520 : 760;
  images.forEach((img, i) => {
    loadCardTexture(img.src, maxSide, 0.045)
      .then(({ tex }) => { addCardMesh(cards[i], tex); requestRender(); })
      .catch(() => {});
  });

  // ---- state ---------------------------------------------------------------
  const st = {
    progress: 0,
    drag: 0,
    dragVel: 0,
    phi: 0,
    phiVel: 0,
    idle: 0,
    running: false,
    visible: false,
    dragging: false,
    moved: 0,
    hovered: null,
    destroyed: false,
  };
  const pointer = { nx: 0, ny: 0, sx: 0, sy: 0, ndc: new THREE.Vector2(9, 9) };
  const raycaster = new THREE.Raycaster();

  function resize() {
    const r = stage.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = r.width / Math.max(1, r.height);
    // Keep the ring filling the width on narrow/tall screens.
    camera.position.z = camBase.z * Math.max(1, 1.25 / Math.max(0.6, camera.aspect)) * (mobile ? 0.62 : 1);
    camera.updateProjectionMatrix();
    requestRender();
  }

  function tick(time, deltaTime) {
    if (st.destroyed) return;
    if (time && !onScreen(section)) return; // frame-loop call while off-screen
    const dt = Math.min(deltaTime || 16, 50) / 1000;

    if (!st.dragging && !reduced) {
      st.drag += st.dragVel;
      st.dragVel *= 0.94;
      st.idle += dt * 0.05; // slow ambient turn
    }
    const target = THREE.MathUtils.clamp(st.progress * PHI_MAX + st.drag + st.idle, -0.6, PHI_MAX + 0.6);
    const prev = st.phi;
    st.phi += (target - st.phi) * (reduced ? 1 : 0.075);
    st.phiVel = st.phi - prev;

    helix.rotation.y = -st.phi;
    helix.position.y = (st.phi / (Math.PI * 2)) * RISE;
    helix.rotation.z = -0.06 + THREE.MathUtils.clamp(st.phiVel * 3, -0.12, 0.12);

    pointer.sx += (pointer.nx - pointer.sx) * 0.05;
    pointer.sy += (pointer.ny - pointer.sy) * 0.05;
    camera.position.x = pointer.sx * 1.4;
    camera.position.y = camBase.y - pointer.sy * 0.8;
    camera.lookAt(0, mobile ? 0.35 : 0.6, 0); // aim above centre so the ring sits below the title

    // Hover picking.
    let hit = null;
    if (!st.dragging && pointer.ndc.x < 2) {
      raycaster.setFromCamera(pointer.ndc, camera);
      const meshes = cards.filter((c) => c.mesh).map((c) => c.mesh);
      const res = raycaster.intersectObjects(meshes, false)[0];
      hit = res ? res.object.userData.card : null;
    }
    if (hit !== st.hovered) {
      st.hovered = hit;
      section.classList.toggle('is-over-card', !!hit);
    }

    for (const c of cards) {
      if (!c.mesh) continue;
      // Brightness by how squarely the card faces the camera.
      const facing = Math.cos(c.theta - st.phi);
      const b = 0.28 + 0.72 * THREE.MathUtils.smoothstep(facing, -0.3, 0.95);
      c.hover += ((st.hovered === c ? 1 : 0) - c.hover) * 0.12;
      c.front.color.setScalar(Math.min(1, b + c.hover * 0.25));
      const s = Math.max(0.0001, c.appear) * (1 + c.hover * 0.07);
      c.pivot.scale.setScalar(s);
      c.mesh.position.z = R + c.hover * 0.35;
    }

    renderer.render(scene, camera);
  }

  let renderQueued = false;
  function requestRender() {
    if (st.running || renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; tick(0, 16); });
  }

  function setRunning(on) {
    if (on === st.running || st.destroyed) return;
    st.running = on;
    on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick);
  }

  // ---- input ---------------------------------------------------------------
  let lastX = 0;
  function localNdc(e) {
    const r = stage.getBoundingClientRect();
    pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.nx = pointer.ndc.x;
    pointer.ny = -pointer.ndc.y;
  }
  function onDown(e) {
    if (e.button !== 0) return;
    st.dragging = true;
    st.moved = 0;
    lastX = e.clientX;
    st.dragVel = 0;
    section.classList.add('is-dragging');
    section.setPointerCapture && section.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    localNdc(e);
    if (!st.dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    st.moved += Math.abs(dx);
    const d = -dx * (mobile ? 0.009 : 0.0055);
    st.drag += d;
    st.dragVel = d;
  }
  function onUp(e) {
    if (!st.dragging) return;
    st.dragging = false;
    section.classList.remove('is-dragging');
    if (st.moved < 6 && st.hovered && onOpen) onOpen(st.hovered.src);
  }
  function onLeave() {
    pointer.ndc.set(9, 9);
    pointer.nx = pointer.ny = 0;
  }
  if (!reduced) {
    section.addEventListener('pointerdown', onDown);
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerup', onUp);
    section.addEventListener('pointercancel', onUp);
    section.addEventListener('pointerleave', onLeave);
  }

  const io = new IntersectionObserver((list) => { const e = list[list.length - 1]; // latest state wins
    st.visible = e.isIntersecting;
    setRunning(st.visible && !document.hidden && !reduced);
    if (st.visible) requestRender();
  });
  io.observe(section);
  const onVis = () => setRunning(st.visible && !document.hidden && !reduced);
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  return {
    setProgress(p) {
      st.progress = p;
      requestRender();
    },
    destroy() {
      st.destroyed = true;
      setRunning(false);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { o.material.map && o.material.map.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

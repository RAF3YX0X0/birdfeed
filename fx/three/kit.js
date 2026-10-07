// Shared Three.js building blocks for the FX 3D components.
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

export { THREE };

export const COLORS = {
  blue: 0x0066ff,
  lilac: 0x4d94ff,
  coral: 0x0066ff,
  pearl: 0xf6f5f2,
  ink: 0x16181f,
};

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

// True when WebGL runs on the CPU (no usable GPU: blocked drivers, VMs, some
// low-end PCs). Scenes then render at 1x with lighter content.
let software = null;
export function softwareGL() {
  if (software !== null) return software;
  software = false;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    software = /swiftshader|llvmpipe|software|basic render/i.test(name);
    gl && gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext();
  } catch (e) {}
  return software;
}

// Cheap per-frame check so a scene never renders off-screen, even if an
// IntersectionObserver notification arrives late on a busy main thread.
export function onScreen(el, margin = 80) {
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < window.innerHeight + margin && r.width > 0;
}

export function createRenderer({ alpha = true, maxDpr = 2 } = {}) {
  const soft = softwareGL();
  const renderer = new THREE.WebGLRenderer({ alpha, antialias: !soft, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, soft ? 1 : maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral tone mapping keeps the brand blue close to #0066FF.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

export function studioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  pmrem.dispose();
  return env;
}

export function glossy(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.24,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    ...extra,
  });
}

// ---------------------------------------------------------------------------
// Geometry: "inflated" extrusions give the soft 3D-emoji look.
// ---------------------------------------------------------------------------

function inflate(shape, { depth, bevel, thickness = bevel }) {
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: thickness,
    bevelSize: bevel,
    bevelSegments: 10,
    curveSegments: 40,
    steps: 1,
  });
}

// Centre a geometry and scale it so its largest dimension is `size`.
function normalize(geo, size = 1) {
  geo.center();
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  const s = size / Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  geo.scale(s, s, s);
  geo.computeVertexNormals();
  return geo;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = inflate(s, { depth: 2.2, bevel: 2.6, thickness: 3.2 });
  g.rotateZ(Math.PI);
  return normalize(g);
}

function starGeometry() {
  const s = new THREE.Shape();
  const outer = 0.5, inner = 0.24;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  return normalize(inflate(s, { depth: 0.06, bevel: 0.07, thickness: 0.11 }));
}

function bubbleShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r * 0.35);
  s.lineTo(x - 0.1, y - 0.26); // tail tip
  s.lineTo(x + r * 0.9, y);
  return s;
}

function triangleShape(size) {
  const s = new THREE.Shape();
  const h = size * 0.9;
  s.moveTo(-size * 0.36, -h / 2);
  s.lineTo(size * 0.5, 0);
  s.lineTo(-size * 0.36, h / 2);
  s.closePath();
  return s;
}

// Each factory returns an Object3D whose largest dimension is ~1 unit.
const FACTORIES = {
  heart: (m) => new THREE.Mesh(heartGeometry(), m.coral),
  star: (m) => new THREE.Mesh(starGeometry(), m.blue),
  play(m) {
    const g = new THREE.Group();
    const base = inflate(roundedRect(1.3, 0.94, 0.3), { depth: 0.12, bevel: 0.1, thickness: 0.14 });
    base.center();
    g.add(new THREE.Mesh(base, m.blue));
    const tri = inflate(triangleShape(0.42), { depth: 0.02, bevel: 0.05, thickness: 0.06 });
    tri.center();
    const t = new THREE.Mesh(tri, m.pearl);
    t.position.set(0.03, 0, 0.2);
    g.add(t);
    g.scale.setScalar(1 / 1.5);
    return g;
  },
  bubble(m) {
    const g = new THREE.Group();
    const body = inflate(bubbleShape(1.24, 0.92, 0.34), { depth: 0.12, bevel: 0.1, thickness: 0.14 });
    body.center();
    g.add(new THREE.Mesh(body, m.pearl));
    const dot = new THREE.SphereGeometry(0.075, 24, 16);
    for (let i = -1; i <= 1; i++) {
      const d = new THREE.Mesh(dot, m.blue);
      d.position.set(i * 0.27 + 0.04, 0.06, 0.2);
      d.scale.z = 0.6;
      g.add(d);
    }
    g.scale.setScalar(1 / 1.45);
    return g;
  },
  sphere: (m) => new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), m.ink),
  pearl: (m) => new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), m.pearl),
  ring: (m) => new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.14, 32, 96), m.lilac),
  capsule(m) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 12, 32), m.blue);
    mesh.scale.setScalar(1 / 0.9);
    return mesh;
  },
};

export function createMaterials() {
  return {
    blue: glossy(COLORS.blue),
    lilac: glossy(COLORS.lilac, { roughness: 0.3 }),
    coral: glossy(COLORS.coral),
    pearl: glossy(COLORS.pearl, { roughness: 0.32 }),
    ink: glossy(COLORS.ink, { roughness: 0.18 }),
  };
}

export function createIcon(kind, materials) {
  const f = FACTORIES[kind] || FACTORIES.sphere;
  return f(materials);
}

export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
  });
}

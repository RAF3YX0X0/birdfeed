// The sales funnel drawing, in SVG: five matte tiers (cone sections with an
// elliptical top, shaded like a turned solid) stacked with clean gaps over a
// soft shadow. The active tier lifts and turns blue; tiers already passed
// keep a faint blue tint. It's drawn the moment the section exists, with no
// WebGL and nothing to download (it replaced a Three.js version that took
// seconds to appear on a first visit).

const NS = 'http://www.w3.org/2000/svg';
const W = 560;
const H = 470;
const CX = 330;
const TOP = 46;
const BOTTOM = 400;
const R_TOP = 196;
const R_BOTTOM = 50;
const GAP = 13;
const K = 0.21; // ellipse height / width (how far we look down on it)
const rAt = (y) => R_BOTTOM + ((R_TOP - R_BOTTOM) * (BOTTOM - y)) / (BOTTOM - TOP);

let uid = 0;

export function mountFunnelSVG({ host, tagsHost, stages, reduced = false }) {
  const id = `fxfn${uid++}`;
  const N = stages.length;
  const layerH = (BOTTOM - TOP - GAP * (N - 1)) / N;
  const tiers = stages.map((s, i) => {
    const yT = TOP + i * (layerH + GAP);
    const yB = yT + layerH;
    return { yT, yB, rT: rAt(yT), rB: rAt(yB) };
  });
  const side = ({ yT, yB, rT, rB }) =>
    `M${CX - rT} ${yT}L${CX - rB} ${yB}A${rB} ${rB * K} 0 0 0 ${CX + rB} ${yB}L${CX + rT} ${yT}A${rT} ${rT * K} 0 0 1 ${CX - rT} ${yT}Z`;
  const f = (n) => n.toFixed(1);

  host.innerHTML = `<svg class="fx-fn" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="presentation">
    <defs>
      <linearGradient id="${id}s" x1="0" x2="1">
        <stop offset="0" stop-color="#CFCFC9"/><stop offset=".32" stop-color="#F8F8F4"/><stop offset=".62" stop-color="#E9E9E4"/><stop offset="1" stop-color="#C8C8C2"/>
      </linearGradient>
      <linearGradient id="${id}b" x1="0" x2="1">
        <stop offset="0" stop-color="#0018B8"/><stop offset=".32" stop-color="#1A75FF"/><stop offset=".62" stop-color="#0066FF"/><stop offset="1" stop-color="#0015A0"/>
      </linearGradient>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF1F5"/>
      </linearGradient>
      <linearGradient id="${id}lb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7C92FF"/><stop offset="1" stop-color="#4F68FF"/>
      </linearGradient>
      <radialGradient id="${id}sh"><stop offset="0" stop-color="#0A0A0A" stop-opacity=".22"/><stop offset="1" stop-color="#0A0A0A" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="fx-fn__shadow" cx="${CX}" cy="${BOTTOM + 34}" rx="${R_BOTTOM * 2.6}" ry="${R_BOTTOM * 0.5}" fill="url(#${id}sh)"/>
    <g class="fx-fn__body">
      ${tiers.map((t, i) => ({ t, i })).reverse().map(({ t, i }) => `<g class="fx-fn__tier" data-i="${i}">
        <path d="${side(t)}" fill="url(#${id}s)"/>
        <path class="fx-fn__tint" d="${side(t)}" fill="url(#${id}b)"/>
        <path class="fx-fn__on" d="${side(t)}" fill="url(#${id}b)"/>
        <ellipse cx="${CX}" cy="${f(t.yT)}" rx="${f(t.rT)}" ry="${f(t.rT * K)}" fill="url(#${id}l)"/>
        <ellipse class="fx-fn__on" cx="${CX}" cy="${f(t.yT)}" rx="${f(t.rT)}" ry="${f(t.rT * K)}" fill="url(#${id}lb)"/>
        <path class="fx-fn__rim" d="M${f(CX - t.rT)} ${f(t.yT)}A${f(t.rT)} ${f(t.rT * K)} 0 0 0 ${f(CX + t.rT)} ${f(t.yT)}" fill="none"/>
      </g>`).join('')}
    </g>
  </svg>`;
  const svg = host.firstElementChild;
  // Drawn bottom tier first, so each tier covers the back of the one below.
  const groups = [...svg.querySelectorAll('.fx-fn__tier')].sort((a, b) => a.dataset.i - b.dataset.i);
  if (reduced) svg.classList.add('is-still');

  // Labels: HTML pills to the left of each tier, placed from the drawing.
  const tags = stages.map((s, i) => {
    const el = document.createElement('span');
    el.className = 'fx-funnel__tag';
    el.style.setProperty('--c', s.color);
    el.innerHTML = `<i>${i + 1}</i>${s.key}`;
    tagsHost.appendChild(el);
    return el;
  });
  function layout() {
    // Narrow boxes: widen the view on the left so the labels fit beside it.
    const narrow = host.clientWidth < 480;
    svg.setAttribute('viewBox', narrow ? `-150 0 ${W + 150} ${H}` : `0 0 ${W} ${H}`);
    const box = tagsHost.getBoundingClientRect();
    const m = svg.getScreenCTM();
    if (!m || !box.width) return;
    const pt = svg.createSVGPoint();
    tiers.forEach((t, i) => {
      const yMid = (t.yT + t.yB) / 2 + 4;
      pt.x = CX - rAt(yMid) - 16;
      pt.y = yMid;
      const p = pt.matrixTransform(m);
      tags[i].style.transform = `translate(${f(p.x - box.left)}px, ${f(p.y - box.top)}px) translate(-100%, -50%)`;
    });
  }
  const ro = new ResizeObserver(layout);
  ro.observe(host);
  layout();

  return {
    setActive(i) {
      groups.forEach((g, k) => { g.classList.toggle('is-on', k === i); g.classList.toggle('is-past', k < i); });
      tags.forEach((el, k) => el.classList.toggle('is-active', k === i));
    },
    layout,
  };
}

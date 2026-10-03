// Shared shell for the page "explainer" sections (SEO climb, tracking path,
// hook curve, follower growth, call steps, white-label layers, globe, local
// reach): heading, a 3D scene next to a panel with a big stat and steps, and a
// note. Desktop pins the section while scrolling drives progress 0 → 1;
// phones / unpinned play it by itself once in view. Without WebGL the panel
// stands alone.
import { allowSticky } from './funnel.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * def: {
 *   key, eyebrow, title (HTML), lede, note,
 *   steps: [{ title, text }],
 *   pin: viewport heights of scroll while pinned (default 2),
 *   autoplay: seconds to play through when unpinned (default 8),
 *   scene: () => import('./three/ex-….js')   (module exports mount(opts)),
 *   sceneOpts: {}, stat(p) => [big, small]   (optional)
 * }
 */
export function mountExplainer({ anchor, position = 'before', def, gsap, lenis, reduced, narrow }) {
  const N = def.steps.length;
  const sec = document.createElement('section');
  sec.className = `fx-ex fx-ex--${def.key}`;
  sec.setAttribute('aria-labelledby', `fx-ex-${def.key}`);
  sec.innerHTML = `
    <div class="fx-ex__pin">
      <div class="fx-ex__head">
        <p class="fx-ex__eyebrow">${def.eyebrow}</p>
        <h2 class="fx-ex__title" id="fx-ex-${def.key}">${def.title}</h2>
        <p class="fx-ex__lede">${def.lede}</p>
      </div>
      <div class="fx-ex__body">
        <div class="fx-ex__viz" aria-hidden="true"><div class="fx-ex__canvas"></div><div class="fx-ex__tags"></div></div>
        <div class="fx-ex__panel">
          ${def.stat ? '<p class="fx-ex__stat" aria-live="polite"><b></b><span></span></p>' : ''}
          <ol class="fx-ex__steps">
            ${def.steps.map((s, i) => `<li><button type="button"><i>${i + 1}</i><span><b>${s.title}</b><em>${s.text}</em></span></button></li>`).join('')}
          </ol>
        </div>
      </div>
      ${def.note ? `<p class="fx-ex__note">${def.note}</p>` : ''}
    </div>`;
  if (position === 'after') anchor.after(sec);
  else anchor.parentNode.insertBefore(sec, anchor);

  const pinned = !reduced && !narrow && window.innerHeight >= 680 && allowSticky(sec);
  sec.classList.toggle('is-pinned', pinned);
  sec.style.setProperty('--fx-ex-pin', `${(def.pin || 2) * 100}vh`);
  const items = [...sec.querySelectorAll('.fx-ex__steps li')];
  const statB = sec.querySelector('.fx-ex__stat b');
  const statS = sec.querySelector('.fx-ex__stat span');

  let scene = null;
  let progress = reduced ? 1 : 0;
  let active = -1;
  function apply(p) {
    progress = p;
    const i = Math.min(N - 1, Math.floor(p * N * 0.9999));
    if (i !== active) {
      active = i;
      items.forEach((li, k) => { li.classList.toggle('is-active', k === i); li.classList.toggle('is-past', k < i); });
    }
    if (def.stat) {
      const [big, small] = def.stat(p);
      if (statB.textContent !== big) statB.textContent = big;
      if (statS.textContent !== small) statS.textContent = small;
    }
    if (scene) scene.setProgress(p);
  }

  const span = () => Math.max(1, sec.offsetHeight - window.innerHeight);
  if (pinned) {
    const onScroll = () => apply(clamp(-sec.getBoundingClientRect().top / span(), 0, 1));
    lenis ? lenis.on('scroll', onScroll) : window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    apply(progress);
  }
  items.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    const target = (i + 0.5) / N;
    if (!pinned) return apply(target);
    const y = sec.getBoundingClientRect().top + window.scrollY + target * span();
    lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  // Entrance, autoplay (unpinned) and lazy 3D once in view. The timer backs up
  // the observer, whose callbacks can starve on a busy main thread.
  const parts = sec.querySelectorAll('.fx-ex__head > *, .fx-ex__viz, .fx-ex__panel');
  if (!reduced) gsap.set(parts, { opacity: 0, y: 36, rotationX: -25, transformPerspective: 900, transformOrigin: '50% 100%' });
  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    clearInterval(backup);
    io.disconnect();
    if (!reduced) gsap.to(parts, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' });
    if (!pinned && !reduced) {
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: def.autoplay || 8, ease: 'none', delay: 0.5, onUpdate: () => apply(o.p) });
    }
    try {
      const [kit, mod] = await Promise.all([import('./three/kit.js'), def.scene()]);
      if (!kit.webglAvailable()) return;
      scene = mod.mount({ host: sec.querySelector('.fx-ex__canvas'), tags: sec.querySelector('.fx-ex__tags'), gsap, reduced, ...(def.sceneOpts || {}) });
      sec.classList.add('is-3d');
      scene.setProgress(progress);
    } catch (err) {
      console.warn(`[fx] ${def.key} 3D unavailable`, err);
    }
  };
  const io = new IntersectionObserver((list) => { if (list[list.length - 1].isIntersecting) start(); }, { rootMargin: '0px 0px -20% 0px' });
  io.observe(sec);
  const backup = setInterval(() => {
    const r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.8 && r.bottom > 0) start();
  }, 250);
  return sec;
}

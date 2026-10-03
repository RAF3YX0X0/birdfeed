// Homepage "How it works" (markup: partials/home-hiw.html, styles: hiw.css).
//
// A sticky stage inside a tall wrapper; scroll progress t (0 → 3) walks the
// three steps. The app window in the panel swaps screens in 3D (the old one
// tips up and back, the new one rises into place), and each screen plays its
// little story as you scroll through its third: services get picked and the
// total adds up, the onboarding checklist ticks off, posts get approved and
// published.

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

export function setupHowItWorks({ section, gsap: G, lenis, reduced, finePointer }) {
  const root = document.documentElement;
  const pin = section.querySelector('.hw__pin');
  const stage = section.querySelector('.hw__stage');
  const panel = section.querySelector('.hw__panel');
  const list = section.querySelector('.hw__list');
  const steps = [...section.querySelectorAll('.hw-step')];
  const rail = section.querySelector('.hw__rail i');
  const screens = [...section.querySelectorAll('.hw-screen')];
  const chipK = section.querySelector('.hw-chip__k');
  const chipV = section.querySelector('.hw-chip__v');

  const svcs = [...screens[0].querySelectorAll('.hw-svc')];
  const total = screens[0].querySelector('.hw-total');
  const price = (row) => parseFloat(row.querySelector('em').textContent.replace(/[^\d.]/g, '')) || 0;
  const items = [...screens[1].querySelectorAll('.hw-item')];
  const count = screens[1].querySelector('.hw-check__count');
  const bar = screens[1].querySelector('.hw-check__bar i');
  const posts = [...screens[2].querySelectorAll('.hw-post em')];
  const toast = screens[2].querySelector('.hw-toast');
  const LABELS = ['Awaiting', 'Approved', 'Published'];

  const state = { key: '', step: -1, svc: '', done: -1, posts: '', toast: null, chip: '' };

  // Each screen's own story, for local progress lp (0 → 1).
  function story0(lp) {
    const on = svcs.map((row) => row.hasAttribute('data-at') && lp >= parseFloat(row.getAttribute('data-at')));
    const k = on.join();
    if (k === state.svc) return;
    state.svc = k;
    let sum = 0;
    svcs.forEach((row, i) => { row.classList.toggle('is-on', on[i]); if (on[i]) sum += price(row); });
    total.textContent = `$${sum}/mo`;
  }
  function story1(lp) {
    const n = Math.min(4, 1 + Math.floor(clamp(lp) * 3.6));
    if (n === state.done) return;
    state.done = n;
    items.forEach((it, i) => {
      it.classList.toggle('is-done', i < n);
      it.querySelector('em').textContent = i < n ? 'Done' : 'To do';
    });
    count.textContent = `${n} / 4`;
    bar.style.width = `${n * 25}%`;
  }
  function story2(lp) {
    const s = posts.map((_, i) => (lp >= 0.72 ? 2 : lp >= 0.1 + i * 0.18 ? 1 : 0));
    const k = s.join();
    if (k !== state.posts) {
      const before = state.posts ? state.posts.split(',').map(Number) : [];
      state.posts = k;
      posts.forEach((em, i) => {
        if (String(s[i]) === em.getAttribute('data-s')) return;
        em.setAttribute('data-s', s[i]);
        em.textContent = LABELS[s[i]];
        if (before.length && !reduced) {
          em.classList.add('is-bump');
          setTimeout(() => em.classList.remove('is-bump'), 260);
        }
      });
    }
    const t = lp >= 0.78;
    if (t !== state.toast) { state.toast = t; toast.classList.toggle('is-on', t); }
  }
  function chip(step) {
    const v = step === 0 ? `${total.textContent} plan` : step === 1 ? `${state.done} of 4 done` : state.toast ? 'Published' : 'Ready for review';
    const k = `${step}|${v}`;
    if (k === state.chip) return;
    state.chip = k;
    chipK.textContent = `Step ${step + 1} of 3`;
    chipV.textContent = v;
  }

  if (reduced) {
    // Finished states, all visible.
    story0(1); story1(1); story2(1);
    steps.forEach((s) => s.classList.add('is-active'));
    return;
  }

  // Heading flip-up, and the panel/steps rise into place as the section arrives.
  const head = section.querySelectorAll('.sx-eyebrow, .sx-title, .sx-sub');
  G.set(head, { opacity: 0, y: 40, rotationX: -50, transformPerspective: 900, transformOrigin: '50% 100%' });
  G.to(head, {
    opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    onComplete: () => G.set(head, { clearProps: 'transform,opacity' }),
  });
  G.fromTo(panel, { y: 140, rotationX: 22, scale: 0.92, transformPerspective: 1400, transformOrigin: '50% 100%' }, {
    y: 0, rotationX: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top bottom', end: 'top top', scrub: true },
  });
  G.fromTo(list, { x: -50, opacity: 0 }, {
    x: 0, opacity: 1, ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top 85%', end: 'top 20%', scrub: true },
  });

  // Pointer lean on the window (desktop).
  const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  if (finePointer) {
    panel.addEventListener('pointermove', (e) => {
      const r = panel.getBoundingClientRect();
      lean.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      lean.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    panel.addEventListener('pointerleave', () => { lean.tx = 0; lean.ty = 0; });
  }

  let m = null;
  const measure = () => {
    const top = pin.getBoundingClientRect().top + window.scrollY;
    m = { top, range: Math.max(1, pin.offsetHeight - stage.offsetHeight) };
    state.key = '';
  };
  measure();
  window.addEventListener('resize', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

  // Clicking a step scrolls to it.
  steps.forEach((li, i) => li.querySelector('button').addEventListener('click', () => {
    const y = m.top + m.range * ((i + 0.45) / 3);
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }));

  function render() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const pinned = y >= m.top - 1 && y <= m.top + m.range;
    if (pinned !== root.classList.contains('hw-on')) root.classList.toggle('hw-on', pinned);
    if (y + vh < m.top - vh * 0.5 || y > m.top + m.range + vh) return;

    lean.x += (lean.tx - lean.x) * 0.08;
    lean.y += (lean.ty - lean.y) * 0.08;
    const t = clamp((y - m.top) / m.range) * 3;
    const key = `${t.toFixed(4)}|${lean.x.toFixed(3)}|${lean.y.toFixed(3)}`;
    if (key === state.key) return;
    state.key = key;

    const step = Math.min(2, Math.floor(t));
    if (step !== state.step) {
      state.step = step;
      steps.forEach((li, i) => {
        li.classList.toggle('is-active', i === step);
        li.classList.toggle('is-past', i < step);
      });
    }
    rail.style.transform = `scaleY(${(t / 3).toFixed(4)})`;

    // Screen swap: around each boundary b the old screen tips away and the new
    // one rises in.
    const swap = (b) => smooth((t - (b - 0.14)) / 0.28);
    const ry = -7 + lean.x * 6;
    const rx = 5 - lean.y * 5;
    screens.forEach((s, i) => {
      const enter = i === 0 ? 1 : swap(i);
      const leave = i === screens.length - 1 ? 0 : swap(i + 1);
      let ty = 0, tz = 0, tilt = 0, op = 1;
      if (leave > 0) { ty = -leave * 34; tz = -leave * 280; tilt = leave * 24; op = 1 - leave; }
      else { ty = (1 - enter) * 46; tz = -(1 - enter) * 220; tilt = -(1 - enter) * 18; op = enter; }
      s.style.transform = `translate(-50%, -50%) translate3d(0, ${ty.toFixed(2)}%, ${tz.toFixed(1)}px) rotateX(${(rx + tilt).toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      s.style.opacity = op.toFixed(3);
      s.style.visibility = op < 0.01 ? 'hidden' : '';
    });

    story0(clamp(t / 0.8));
    story1(clamp((t - 1) / 0.8));
    story2(clamp((t - 2) / 0.8));
    chip(step);
  }
  render();
  G.ticker.add(render);
}

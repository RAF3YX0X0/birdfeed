// Homepage "How it works" (markup: partials/home-hiw.html, styles: hiw.css).
//
// A winding trail: an SVG path is laid through the three steps' dots (curving
// across between them) and draws itself with the scroll, a glowing point at
// its head. When it reaches a dot, the dot lights up and its step comes in —
// the text on one side, a small live demo on the other — and the demo plays
// its story as you keep scrolling: services get picked and the total adds up,
// the onboarding checklist ticks off, posts get approved and published.

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function setupHowItWorks({ section, gsap: G, reduced }) {
  const trail = section.querySelector('.hw-trail');
  if (!trail) return;
  const svg = trail.querySelector('.hw-trail__svg');
  const track = svg.querySelector('.hw-trail__track');
  const line = svg.querySelector('.hw-trail__line');
  const head = svg.querySelector('.hw-trail__head');
  const glow = svg.querySelector('.hw-trail__glow');
  const rows = [...section.querySelectorAll('.hw-row')];
  const dots = rows.map((r) => r.querySelector('.hw-row__dot'));
  const screens = rows.map((r) => r.querySelector('.hw-screen'));

  // ---- The three demos' stories (lp: 0 → 1) ------------------------------------------------
  const svcs = [...screens[0].querySelectorAll('.hw-svc')];
  const total = screens[0].querySelector('.hw-total');
  const price = (row) => parseFloat(row.querySelector('em').textContent.replace(/[^\d.]/g, '')) || 0;
  const items = [...screens[1].querySelectorAll('.hw-item')];
  const count = screens[1].querySelector('.hw-check__count');
  const bar = screens[1].querySelector('.hw-check__bar i');
  const posts = [...screens[2].querySelectorAll('.hw-post em')];
  const toast = screens[2].querySelector('.hw-toast');
  const LABELS = ['Awaiting', 'Approved', 'Published'];
  const state = { svc: '', done: -1, posts: '', toast: null, on: '', p: -1 };

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
      const before = state.posts ? state.posts.split(',') : [];
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
  const stories = [story0, story1, story2];

  // ---- The path ------------------------------------------------------------------------------
  // Through the dots' centres, starting at the top middle and ending at the
  // bottom middle; each stretch leaves and arrives vertically, so it swings
  // across in an S between the steps.
  let m = null;
  function measure() {
    const box = trail.getBoundingClientRect();
    const w = trail.offsetWidth;
    const h = trail.offsetHeight;
    const pts = dots.map((d) => {
      const r = d.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    });
    const narrow = w < 700;
    const start = { x: narrow ? pts[0].x : w / 2, y: 0 };
    const end = { x: narrow ? pts[pts.length - 1].x : w / 2, y: h };
    const all = [start, ...pts, end];
    let d = `M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
    for (let i = 1; i < all.length; i++) {
      const a = all[i - 1];
      const b = all[i];
      const k = (b.y - a.y) * 0.55;
      d += ` C ${a.x.toFixed(1)} ${(a.y + k).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - k).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    track.setAttribute('d', d);
    line.setAttribute('d', d);
    const len = line.getTotalLength();
    line.style.strokeDasharray = `${len} ${len}`;
    // Where along the path each dot sits (as a share of its length).
    const N = 600;
    const samples = Array.from({ length: N + 1 }, (_, i) => line.getPointAtLength((len * i) / N));
    const at = pts.map((p) => {
      let best = 0, bd = Infinity;
      samples.forEach((s, i) => { const dd = (s.x - p.x) ** 2 + (s.y - p.y) ** 2; if (dd < bd) { bd = dd; best = i; } });
      return best / N;
    });
    m = { len, at };
    state.p = -1;
  }

  // ---- Scroll: draw the path, light the dots, bring the steps in, play the demos -----------------
  const shown = rows.map(() => false);
  function reveal(i) {
    if (shown[i]) return;
    shown[i] = true;
    const row = rows[i];
    if (reduced || !G) return; // nothing was hidden
    G.to(row.querySelector('.hw-row__txt'), { opacity: 1, x: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform,opacity' });
    G.to(row.querySelector('.hw-row__demo'), { opacity: 1, x: 0, y: 0, rotationY: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', delay: 0.08, clearProps: 'transform,opacity' });
  }
  function update(p) {
    if (!m) return;
    if (Math.abs(p - state.p) < 0.0004) return;
    state.p = p;
    const drawn = m.len * p;
    line.style.strokeDashoffset = (m.len - drawn).toFixed(1);
    const pt = line.getPointAtLength(Math.max(0.01, drawn));
    head.setAttribute('cx', pt.x.toFixed(1));
    head.setAttribute('cy', pt.y.toFixed(1));
    glow.setAttribute('cx', pt.x.toFixed(1));
    glow.setAttribute('cy', pt.y.toFixed(1));
    trail.classList.toggle('is-live', p > 0.002 && p < 0.998);
    const on = m.at.map((a) => p >= a - 0.004);
    const k = on.join();
    if (k !== state.on) {
      state.on = k;
      rows.forEach((r, i) => { r.classList.toggle('is-on', on[i]); if (on[i]) reveal(i); });
    }
    // Each demo plays over the stretch after its dot.
    m.at.forEach((a, i) => stories[i](clamp((p - a) / 0.16)));
  }

  if (reduced || !G || !window.ScrollTrigger) {
    measure();
    update(1);
    return;
  }

  // Steps start hidden, offset towards their side; they come in when their dot lights.
  rows.forEach((row) => {
    const side = row.dataset.side === 'r' ? 1 : -1;
    G.set(row.querySelector('.hw-row__txt'), { opacity: 0, x: side * 40 });
    G.set(row.querySelector('.hw-row__demo'), { opacity: 0, x: -side * 50, y: 30, rotationY: -side * 14, rotationX: 8, transformPerspective: 1200 });
  });
  const head1 = section.querySelectorAll('.sx-eyebrow, .sx-title, .sx-sub');
  G.set(head1, { opacity: 0, y: 40 });
  G.to(head1, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity', scrollTrigger: { trigger: section, start: 'top 78%', once: true } });

  measure();
  update(0);
  const st = window.ScrollTrigger.create({
    trigger: trail, start: 'top 72%', end: 'bottom 72%', scrub: 0.6,
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => { measure(); update(self.progress); },
  });
  let timer = 0;
  const remeasure = () => { clearTimeout(timer); timer = setTimeout(() => { measure(); update(st.progress); }, 120); };
  window.addEventListener('resize', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(trail);
}

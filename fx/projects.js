// "Selected work" stack (markup: partials/home-projects.html, styles:
// projects.css). Each .pj-card is sticky; as the next one slides up, the cards
// beneath it sink back, tilt and dim, like the gallery's depth dimming. The
// card that has arrived gets .is-seen (chips, bars, chart and fans animate in,
// stats count up) and its videos play.

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function setupProjects({ section, gsap: G, reduced }) {
  const root = document.documentElement;
  const cards = [...section.querySelectorAll('.pj-card')];
  if (!cards.length) return;
  const parts = cards.map((card) => ({
    card,
    inner: card.querySelector('.pj-card__in'),
    shade: card.querySelector('.pj-card__shade'),
    media: card.querySelector('.pj-card__media'),
    videos: [...card.querySelectorAll('video')],
    stats: [...card.querySelectorAll('.pj-card__stats b, .pj-chip b')],
    top: 0,
    seen: false,
    playing: false,
  }));

  if (reduced) {
    parts.forEach((p) => p.card.classList.add('is-seen'));
    return;
  }

  // Section heading: the same 3D flip-up as the other landing-page headings.
  const head = section.querySelectorAll('.pj__eyebrow, .pj__title, .pj__sub');
  G.set(head, { opacity: 0, y: 40, rotationX: -50, transformPerspective: 900, transformOrigin: '50% 100%' });
  G.to(head, {
    opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: section, start: 'top 75%', once: true },
    onComplete: () => G.set(head, { clearProps: 'transform,opacity' }),
  });

  const measure = () => parts.forEach((p) => { p.top = parseFloat(getComputedStyle(p.card).top) || 0; });
  measure();
  window.addEventListener('resize', measure);

  function setPlaying(p, on) {
    if (p.playing === on) return;
    p.playing = on;
    p.videos.forEach((v) => {
      if (on) {
        v.preload = 'auto';
        const r = v.play();
        if (r && r.catch) r.catch(() => {});
      } else v.pause();
    });
  }

  function countUp(p) {
    p.stats.forEach((b) => {
      const text = b.textContent;
      const m = text.match(/^([+~]?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
      if (!m || /→/.test(text)) return;
      const dec = (m[2].split('.')[1] || '').length;
      const commas = m[2].includes(',');
      const value = parseFloat(m[2].replace(/,/g, ''));
      const o = { v: 0 };
      G.to(o, {
        v: value, duration: 1.4, ease: 'power3.out',
        onUpdate: () => {
          const n = commas ? Number(o.v.toFixed(dec)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : o.v.toFixed(dec);
          b.textContent = m[1] + n + m[3];
        },
        onComplete: () => { b.textContent = text; },
      });
    });
  }

  let lastKey = '';
  function render() {
    const vh = window.innerHeight;
    const box = section.getBoundingClientRect();
    const on = box.top < vh * 0.6 && box.bottom > vh * 0.4;
    if (on !== root.classList.contains('pj-on')) root.classList.toggle('pj-on', on);
    if (box.bottom < -50 || box.top > vh + 50) {
      parts.forEach((p) => setPlaying(p, false));
      return;
    }
    // How far each card has travelled from the bottom of the screen to its
    // sticky spot (0 → 1).
    const arrive = parts.map((p) => {
      const t = p.card.getBoundingClientRect().top;
      return clamp((vh - t) / Math.max(1, vh - p.top));
    });
    const key = arrive.map((a) => a.toFixed(4)).join();
    if (key === lastKey) return;
    lastKey = key;

    let covered = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const a = arrive[i];
      const e = easeOut(a);
      const c = Math.min(covered, 3);
      const s = 1 - 0.05 * c;
      const tilt = (1 - e) * 12 - Math.min(c, 1) * 4;
      p.inner.style.transform = `translate3d(0, ${((1 - e) * 60).toFixed(1)}px, 0) rotateX(${tilt.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      p.shade.style.opacity = Math.min(0.2, c * 0.09).toFixed(3);
      p.media.style.setProperty('--enter', e.toFixed(3));
      if (!p.seen && a > 0.6) {
        p.seen = true;
        p.card.classList.add('is-seen');
        countUp(p);
      }
      // Play while it's the card on top (or arriving), not once buried.
      setPlaying(p, a > 0.25 && covered < 0.6);
      covered += a;
    }
  }
  render();
  G.ticker.add(render);
}

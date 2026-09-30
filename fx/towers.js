// "What it really costs" — 3D cost towers for the Compare page. Generic
// categories only (no named competitors); prices are the ranges the site
// already states on the homepage's "Every other way costs more" section.

const OPTIONS = [
  { name: 'Do it yourself', price: '$0', min: 0, max: 0, ghost: true, ghostHeight: 2600, catch: 'Costs your nights and weekends', color: '#8A8B95', color3d: '#A1A1AA' },
  { name: 'AI tools', price: '$30–150', min: 30, max: 150, catch: 'Generic, off-brand content', color: '#7A8BFF', color3d: '#C7D0FF' },
  { name: 'Freelancer', price: '$500–2,500', min: 500, max: 2500, catch: 'Flaky, single-skill', color: '#5E73FF', color3d: '#9DAEFF' },
  { name: 'Boutique agency', price: '$1,500–5,000', min: 1500, max: 5000, catch: 'Locked-in contracts', color: '#3B5BFF', color3d: '#6F86FF' },
  { name: 'In-house hire', price: '$4,500+', min: 4500, max: 6000, catch: 'Costly to hire and manage', color: '#2A45E0', color3d: '#3B5BFF' },
  { name: 'Feedbird', price: 'from $99', min: 99, max: 99, brand: true, catch: 'A real team, no contracts', color: '#E8435F', color3d: '#FF5C7A' },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function setupTowers({ anchor, gsap, lenis, reduced }) {
  const sec = document.createElement('section');
  sec.className = 'fx-towers';
  sec.setAttribute('aria-labelledby', 'fx-towers-title');
  sec.innerHTML = `
    <div class="fx-towers__wrap">
      <div class="fx-towers__head">
        <p class="fx-towers__eyebrow">// every option, side by side</p>
        <h2 class="fx-towers__title" id="fx-towers-title">What it <em>really costs.</em></h2>
        <p class="fx-towers__lede">The monthly cost of getting your social media done each way, and the catch that comes with it.</p>
      </div>
      <div class="fx-towers__viz">
        <div class="fx-towers__canvas" aria-hidden="true"></div>
        <div class="fx-towers__tags" aria-hidden="true"></div>
        <table class="fx-towers__table">
          <caption>Monthly cost by option</caption>
          <thead><tr><th scope="col">Option</th><th scope="col">Monthly cost</th><th scope="col">The catch</th></tr></thead>
          <tbody>${OPTIONS.map((o) => `<tr${o.brand ? ' class="is-brand"' : ''} style="--c:${o.color}"><th scope="row">${o.name}</th><td>${o.price}${o.ghost ? ' + your time' : ''}</td><td>${o.catch}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <p class="fx-towers__note">Typical monthly prices; solid part = starting price, lighter part = the rest of the range. The “do it yourself” tower is your time, not money.</p>
    </div>`;
  anchor.parentNode.insertBefore(sec, anchor);

  let towers = null;
  // Progress: 0 as the section enters from the bottom, 1 by the time it is centred.
  function onScroll() {
    if (!towers) return;
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    towers.setProgress(clamp((vh - r.top) / (vh * 0.9), 0, 1));
  }
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });

  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    clearInterval(backup);
    io.disconnect();
    try {
      const [kit, mod] = await Promise.all([import('./three/kit.js'), import('./three/towers3d.js')]);
      if (!kit.webglAvailable()) return; // the table stays visible instead
      towers = mod.mountTowers({
        host: sec.querySelector('.fx-towers__canvas'),
        tagsHost: sec.querySelector('.fx-towers__tags'),
        options: OPTIONS,
        maxValue: 6000,
        gsap,
        reduced,
      });
      sec.classList.add('is-3d');
      onScroll();
    } catch (err) {
      console.warn('[fx] towers 3D unavailable', err);
    }
  };
  const io = new IntersectionObserver((list) => { if (list[list.length - 1].isIntersecting) start(); }, { rootMargin: '60% 0px' });
  io.observe(sec);
  const backup = setInterval(() => {
    const r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight * 1.6 && r.bottom > 0) start();
  }, 300);
  return sec;
}

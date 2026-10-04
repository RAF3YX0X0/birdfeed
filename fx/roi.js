// "Your social media, in numbers" — an ROI estimator. Pick a business type,
// a monthly budget and what a new customer is worth; 3D bars show roughly how
// many people that could reach, engage, bring to your page and turn into
// customers. Every figure is an illustrative estimate from the assumptions
// listed in the section, never a promise.

// Per business type: people reached per $1 a month, share who engage, share of
// those who visit your page, share of visitors who buy, default customer value.
const PROFILES = [
  { id: 'restaurant', label: 'Restaurant / café', reach: 50, engage: 0.1, visit: 0.25, buy: 0.08, value: 35 },
  { id: 'salon', label: 'Salon / beauty', reach: 40, engage: 0.1, visit: 0.25, buy: 0.07, value: 70 },
  { id: 'gym', label: 'Gym / fitness', reach: 45, engage: 0.09, visit: 0.22, buy: 0.07, value: 50 },
  { id: 'clinic', label: 'Dental / medical', reach: 30, engage: 0.06, visit: 0.25, buy: 0.04, value: 250 },
  { id: 'home', label: 'Home services', reach: 30, engage: 0.07, visit: 0.25, buy: 0.03, value: 300 },
  { id: 'shop', label: 'Online store', reach: 60, engage: 0.08, visit: 0.3, buy: 0.03, value: 55 },
  { id: 'realestate', label: 'Real estate', reach: 35, engage: 0.07, visit: 0.2, buy: 0.003, value: 3000 },
  { id: 'pro', label: 'Other / services', reach: 35, engage: 0.07, visit: 0.22, buy: 0.05, value: 150 },
];

const BARS = [
  { label: 'people reached', color: '#7088FF', color3d: '#B8C4FF' },
  { label: 'engage', color: '#3352FF', color3d: '#7088FF' },
  { label: 'visit your page', color: '#0029FF', color3d: '#3352FF' },
  { label: 'new customers', color: '#0A0B10', color3d: '#3A3B42' },
];

const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const round = (n) => (n >= 100 ? Math.round(n / 10) * 10 : Math.round(n));

export function estimate(profile, budget, value) {
  const reached = budget * profile.reach;
  const engaged = reached * profile.engage;
  const visits = engaged * profile.visit;
  const customers = visits * profile.buy;
  const revenue = customers * value;
  return { reached, engaged, visits, customers, revenue, multiple: revenue / budget };
}

export function setupROI({ anchor, gsap, reduced }) {
  const sec = document.createElement('section');
  sec.className = 'fx-roi';
  sec.setAttribute('aria-labelledby', 'fx-roi-title');
  sec.innerHTML = `
    <div class="fx-roi__wrap">
      <div class="fx-roi__head">
        <p class="fx-roi__eyebrow">// what could it do for you?</p>
        <h2 class="fx-roi__title" id="fx-roi-title">Your social media, <em>in numbers.</em></h2>
        <p class="fx-roi__lede">Pick your type of business and a monthly budget to get a rough idea of what a month of social media could bring in.</p>
      </div>
      <div class="fx-roi__body">
        <form class="fx-roi__panel" onsubmit="return false">
          <fieldset class="fx-roi__field">
            <legend>Your business</legend>
            <div class="fx-roi__chips">
              ${PROFILES.map((p, i) => `<label class="fx-roi__chip"><input type="radio" name="fx-roi-biz" value="${p.id}"${i === 0 ? ' checked' : ''}><span>${p.label}</span></label>`).join('')}
            </div>
          </fieldset>
          <div class="fx-roi__field">
            <label for="fx-roi-budget">Monthly budget <output id="fx-roi-budget-out" for="fx-roi-budget"></output></label>
            <input type="range" id="fx-roi-budget" min="99" max="2000" step="1" value="249">
          </div>
          <div class="fx-roi__field">
            <label for="fx-roi-value">What a new customer spends with you <output id="fx-roi-value-out" for="fx-roi-value"></output></label>
            <input type="range" id="fx-roi-value" min="0" max="1000" step="1">
          </div>
          <div class="fx-roi__result" aria-live="polite">
            <div><b data-k="customers">0</b><span>new customers a month</span></div>
            <div><b data-k="revenue">$0</b><span>in new revenue a month</span></div>
            <div><b data-k="multiple">0×</b><span>your monthly budget</span></div>
          </div>
        </form>
        <div class="fx-roi__viz" aria-hidden="true">
          <div class="fx-roi__fallback">${BARS.map((b) => `<span style="--c:${b.color3d}"><i></i><em>${b.label}</em></span>`).join('')}</div>
          <div class="fx-roi__canvas"></div>
          <div class="fx-roi__tags"></div>
        </div>
      </div>
      <details class="fx-roi__how">
        <summary>How we estimate this</summary>
        <p data-k="assumptions"></p>
        <p>These are rough, illustrative estimates based on typical ranges for small businesses, not a promise of results. Real numbers depend on your area, offer, content and competition.</p>
      </details>
    </div>`;
  anchor.parentNode.insertBefore(sec, anchor);

  const $ = (s) => sec.querySelector(s);
  const budget = $('#fx-roi-budget');
  const value = $('#fx-roi-value');
  const out = {
    budget: $('#fx-roi-budget-out'),
    value: $('#fx-roi-value-out'),
    customers: $('[data-k="customers"]'),
    revenue: $('[data-k="revenue"]'),
    multiple: $('[data-k="multiple"]'),
    assumptions: $('[data-k="assumptions"]'),
  };
  const fallbackBars = [...sec.querySelectorAll('.fx-roi__fallback i')];

  // The customer-value slider is logarithmic ($10 … $10,000) so small and
  // large tickets are both easy to set.
  const V_MIN = 10, V_MAX = 10000;
  const toValue = (pos) => Math.round(V_MIN * Math.pow(V_MAX / V_MIN, pos / 1000));
  const toPos = (val) => Math.round((Math.log(val / V_MIN) / Math.log(V_MAX / V_MIN)) * 1000);

  let bars = null;
  let profile = PROFILES[0];
  value.value = toPos(profile.value);
  const shown = { customers: 0, revenue: 0, multiple: 0 };

  function update() {
    const b = +budget.value;
    const v = toValue(+value.value);
    out.budget.textContent = money(b);
    out.value.textContent = money(v);
    const e = estimate(profile, b, v);
    const targets = { customers: e.customers, revenue: e.revenue, multiple: e.multiple };
    gsap.to(shown, {
      ...targets, duration: reduced ? 0 : 0.6, ease: 'power3.out', overwrite: true,
      onUpdate: () => {
        out.customers.textContent = shown.customers < 10 ? shown.customers.toFixed(1).replace(/\.0$/, '') : Math.round(shown.customers).toLocaleString('en-US');
        out.revenue.textContent = money(shown.revenue);
        out.multiple.textContent = shown.multiple.toFixed(1) + '×';
      },
    });
    const vals = [e.reached, e.engaged, e.visits, e.customers].map(round);
    if (bars) bars.set(vals);
    const ref = Math.log10(200000);
    fallbackBars.forEach((el, i) => { el.style.height = Math.max(4, (Math.log10(vals[i] + 1) / ref) * 100) + '%'; });
    out.assumptions.textContent =
      `For a ${profile.label.toLowerCase()}: about ${profile.reach} people reached per $1 a month, ` +
      `${Math.round(profile.engage * 100)}% of them engage, ${Math.round(profile.visit * 100)}% of those visit your page, ` +
      `and ${+(profile.buy * 100).toFixed(1)}% of visitors become customers, each spending the amount you set.`;
  }

  sec.querySelectorAll('input[name="fx-roi-biz"]').forEach((r) => r.addEventListener('change', () => {
    profile = PROFILES.find((p) => p.id === r.value);
    value.value = toPos(profile.value); // reset to that business's typical value
    update();
  }));
  budget.addEventListener('input', update);
  value.addEventListener('input', update);
  update();

  // Entrance + lazy 3D (timer backup for starved observers, as elsewhere).
  const parts = sec.querySelectorAll('.fx-roi__head > *, .fx-roi__panel, .fx-roi__viz');
  if (!reduced) gsap.set(parts, { opacity: 0, y: 40, rotationX: -25, transformPerspective: 900, transformOrigin: '50% 100%' });
  let entered = false;
  const enter = () => {
    if (entered) return;
    entered = true;
    clearInterval(backup);
    io.disconnect();
    if (!reduced) gsap.to(parts, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' });
    loadBars();
  };
  const io = new IntersectionObserver((list) => { if (list[list.length - 1].isIntersecting) enter(); }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(sec);
  const backup = setInterval(() => {
    const r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85 && r.bottom > 0) enter();
  }, 250);

  async function loadBars() {
    try {
      const [kit, mod] = await Promise.all([import('./three/kit.js'), import('./three/bars3d.js')]);
      if (!kit.webglAvailable()) return;
      bars = mod.mountBars({ host: $('.fx-roi__canvas'), tagsHost: $('.fx-roi__tags'), bars: BARS, gsap, reduced });
      sec.classList.add('is-3d');
      update();
    } catch (err) {
      console.warn('[fx] ROI 3D unavailable', err);
    }
  }
  return sec;
}

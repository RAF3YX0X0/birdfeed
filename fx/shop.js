// The homepage shop (markup: scripts/build-home.js, styles: shop.css).
//   - Filters (industry, service, price, billing) and sorting; the grid
//     re-lays itself out with the cards gliding to their new places (FLIP),
//     new ones tipping up into view in 3D.
//   - Picking an industry shows a "Built for" banner linking to its page and
//     flips the visual products over to work made for that industry.
//   - "Add to plan" adds the service to the plan builder further down the
//     page (plan.js); buttons show what's in the plan, whoever changed it.

import { connectPlan } from './plan.js';

export function setupShop({ gsap: G, lenis, reduced }) {
  const sec = document.querySelector('.hm-shop');
  if (!sec) return;
  const grid = sec.querySelector('.hm-shop__grid');
  const cards = [...grid.querySelectorAll('.sp')];
  const data = JSON.parse((sec.querySelector('#hm-shop-data') || {}).textContent || '{}');
  const sort = sec.querySelector('.hm-shop__sort select');
  const chips = sec.querySelector('.hm-shop__chips');
  const count = sec.querySelector('.hm-shop__count b');
  const none = sec.querySelector('.hm-shop__none');
  const forEl = sec.querySelector('.hm-shop__for');
  const labelOf = (input) => input.closest('label').querySelector('.sf__l').textContent;
  const anim = !reduced && G;

  // ---- Filtering ------------------------------------------------------------------------------
  const state = () => {
    const pick = (k) => [...sec.querySelectorAll(`input[name="sf-${k}"]:checked`)];
    return { ind: (pick('ind')[0] || { value: 'all' }).value, cat: pick('cat'), pr: pick('pr'), bill: pick('bill') };
  };
  let lastInd = 'all';
  function apply() {
    const s = state();
    const want = (k, el) => !s[k].length || s[k].some((i) => i.value === el.dataset[k]);
    const show = cards.filter((c) => want('cat', c) && want('pr', c) && want('bill', c));
    const by = sort.value;
    const order = [...show].sort((a, b) => (by === 'low' ? a.dataset.price - b.dataset.price : by === 'high' ? b.dataset.price - a.dataset.price : a.dataset.order - b.dataset.order));
    // FLIP: where each card is now, then where it lands.
    const before = new Map(cards.filter((c) => !c.hidden).map((c) => [c, c.getBoundingClientRect()]));
    cards.forEach((c) => { c.hidden = !show.includes(c); c.style.order = String(order.indexOf(c)); });
    if (anim) {
      show.forEach((c, i) => {
        const a = before.get(c);
        const b = c.getBoundingClientRect();
        if (a) {
          const dx = a.left - b.left;
          const dy = a.top - b.top;
          if (dx || dy) G.fromTo(c, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.75, ease: 'expo.out', clearProps: 'transform' });
        } else {
          G.fromTo(c, { opacity: 0, y: 40, rotationX: -24, scale: 0.94, transformPerspective: 1200, transformOrigin: '50% 0%' }, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.8, ease: 'expo.out', delay: 0.04 * i, clearProps: 'transform,opacity' });
        }
      });
    }
    count.textContent = String(show.length);
    count.nextSibling.textContent = show.length === 1 ? ' service' : ' services';
    none.hidden = show.length > 0;
    // Active filters as removable chips.
    const active = [...s.cat, ...s.pr, ...s.bill];
    const indInput = sec.querySelector(`input[name="sf-ind"][value="${s.ind}"]`);
    chips.innerHTML = [
      ...(s.ind !== 'all' && indInput ? [`<button type="button" data-chip="ind">${labelOf(indInput)}<i aria-hidden="true">×</i></button>`] : []),
      ...active.map((i) => `<button type="button" data-chip="${i.name}:${i.value}">${labelOf(i)}<i aria-hidden="true">×</i></button>`),
    ].join('');
    sec.querySelectorAll('.sf__clear').forEach((b) => { if (b.closest('.hm-shop__side')) b.hidden = !active.length && s.ind === 'all'; });
    if (s.ind !== lastInd) industry(s.ind);
    lastInd = s.ind;
  }

  // ---- An industry: the banner, and its work on the visual products ----------------------------
  function industry(key) {
    const d = data[key] || data.all;
    const swap = { ...(data.all || {}).swap, ...Object.fromEntries(Object.entries(d.swap || {}).filter(([, v]) => v)) };
    grid.querySelectorAll('[data-shot]').forEach((el) => {
      const v = swap[el.dataset.shot];
      if (!v) return;
      if (el.tagName === 'IMG') {
        if (el.getAttribute('src') === v) return;
        if (anim) {
          G.to(el, { rotationY: 90, opacity: 0.4, duration: 0.22, ease: 'power2.in', transformPerspective: 800, onComplete: () => {
            el.src = v;
            G.to(el, { rotationY: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
          } });
        } else el.src = v;
      } else el.textContent = v;
    });
    if (key === 'all' || !d.label) { forEl.hidden = true; return; }
    forEl.querySelector('img').src = d.img || '';
    forEl.querySelector('b').textContent = d.label;
    forEl.querySelector('small').textContent = d.line || '';
    const link = forEl.querySelector('a');
    link.href = d.href;
    link.firstChild.textContent = `How we work with ${d.label.toLowerCase()} `;
    forEl.hidden = false;
    if (anim) G.fromTo(forEl, { opacity: 0, y: -14, rotationX: 30, transformPerspective: 900, transformOrigin: '50% 0%' }, { opacity: 1, y: 0, rotationX: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform,opacity' });
  }

  sec.addEventListener('change', (e) => { if (e.target.matches('input, select')) apply(); });
  sec.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      if (chip.dataset.chip === 'ind') sec.querySelector('input[name="sf-ind"][value="all"]').checked = true;
      else { const [name, value] = chip.dataset.chip.split(':'); const i = sec.querySelector(`input[name="${name}"][value="${value}"]`); if (i) i.checked = false; }
      apply();
      return;
    }
    if (e.target.closest('.sf__clear')) {
      sec.querySelectorAll('.hm-shop__side input[type="checkbox"]').forEach((i) => { i.checked = false; });
      sec.querySelector('input[name="sf-ind"][value="all"]').checked = true;
      apply();
    }
  });

  // ---- Add to plan ------------------------------------------------------------------------------
  const plan = connectPlan({ lenis });
  if (plan) {
    plan.onChange((names) => {
      sec.querySelectorAll('[data-plan-add]').forEach((b) => {
        const on = names.includes(b.dataset.planAdd);
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${b.dataset.planAdd} ${on ? 'from' : 'to'} your plan`);
      });
    });
    sec.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-plan-add]');
      if (!b) return;
      b.classList.add('is-busy');
      const was = b.classList.contains('is-on');
      const on = await plan.toggle(b.dataset.planAdd);
      b.classList.remove('is-busy');
      if (on && !was) { pop(b); toast(`${b.dataset.planAdd} added to your plan`, plan); } else if (!on && was) toast(`${b.dataset.planAdd} removed from your plan`, plan);
    });
  }

  // ---- Entrance ------------------------------------------------------------------------------------
  if (anim) {
    const head = sec.querySelectorAll('.hm-shop__head > *, .hm-shop__side, .hm-shop__bar');
    G.set(head, { opacity: 0, y: 26 });
    G.set(cards, { opacity: 0, y: 50, rotationX: -18, transformPerspective: 1200, transformOrigin: '50% 0%' });
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((x) => x.isIntersecting)) return;
      io.disconnect();
      G.to(head, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity' });
      G.to(cards, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.15, clearProps: 'transform,opacity' });
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(sec);
  }
  apply();

  // The card's product shot hops when its service goes in.
  function pop(btn) {
    const ps = btn.closest('.sp') && btn.closest('.sp').querySelector('.ps');
    if (!ps || !anim) return;
    G.fromTo(ps, { y: 0, rotationX: 0 }, { y: -10, rotationX: 10, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, transformPerspective: 800, clearProps: 'transform' });
  }
}

// "Added to your plan · View plan" (View plan glides to the builder).
let toastEl = null;
let toastT = 0;
function toast(text, plan) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'hm-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.innerHTML = '<span class="hm-toast__ic"><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="hm-toast__t"></span><button type="button">View plan</button>';
    toastEl.querySelector('button').addEventListener('click', () => { toastEl.classList.remove('is-on'); plan.goTo(); });
    document.body.appendChild(toastEl);
  }
  toastEl.querySelector('.hm-toast__t').textContent = text;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3400);
}

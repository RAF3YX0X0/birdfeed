// Homepage portfolio store (markup: partials/home-portfolio.html, styles:
// portfolio.css, data: portfolio-data.js). Same browsing as the cloned
// section — format tabs, industry → sub-industry filters, featured mix, load
// more — laid out like a shop, with 3D tile hover, animated result swaps and
// a quick-view dialog. Every piece of work names the service that made it
// (from the format tabs' data-svc*), and on the homepage the quick view can
// add that service to the plan builder (plan.js).

import { connectPlan } from './plan.js';

const PAGE = 12;
const FORMAT_LABEL = { posts: 'post', videos: 'video', ugc: 'UGC video' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plural = (n, w) => `${n.toLocaleString('en-US')} ${w}${n === 1 ? '' : 's'}`;

export function setupPortfolio({ section, gsap: G, lenis, reduced, finePointer, home }) {
  const formatBtns = [...section.querySelectorAll('.pf-format')];
  // The service behind each format: { name, price, href }.
  const SVC = Object.fromEntries(formatBtns.map((b) => [b.dataset.format, { name: b.dataset.svc, price: b.dataset.svcPrice, href: b.dataset.svcHref }]));
  const plan = home ? connectPlan({ lenis }) : null;
  const inds = section.querySelector('.pf-inds');
  const side = section.querySelector('.pf__side');
  const grid = section.querySelector('.pf__grid');
  const count = section.querySelector('.pf__count');
  const pills = section.querySelector('.pf__pills');
  const more = section.querySelector('.pf__more');
  const shown = section.querySelector('.pf__shown');
  const progress = section.querySelector('.pf__progress i');
  const loadBtn = section.querySelector('.pf__load');
  const viewBtns = [...section.querySelectorAll('.pf-viewbtn')];
  const qv = section.querySelector('.pf-qv');

  const st = { format: 'posts', ind: 'Featured', sub: 'All', limit: PAGE };
  let D = null;        // data, once loaded
  let list = [];       // current filtered items
  let seen = false;    // section has come into view (first reveal played)

  // ---- data -------------------------------------------------------------------
  function prepare(data) {
    const posts = data.posts.map((p) => ({ kind: 'posts', img: p.img, r: p.r, ind: p.ind, sub: p.sub || '', c: p.c || '', f: !!p.f }));
    // Featured: the hand-picked ones, then the rest dealt out one industry at a time.
    const byInd = {};
    posts.filter((p) => !p.f).forEach((p) => (byInd[p.ind] = byInd[p.ind] || []).push(p));
    const piles = Object.values(byInd);
    const mixed = posts.filter((p) => p.f);
    for (let i = 0; piles.some((pl) => i < pl.length); i++) piles.forEach((pl) => i < pl.length && mixed.push(pl[i]));
    // A picture for each industry in the sidebar: its first featured post, or its first post.
    const thumbs = {};
    data.industries.forEach((ind) => {
      const p = posts.find((x) => x.ind === ind && x.f) || posts.find((x) => x.ind === ind);
      if (p) thumbs[ind] = p.img;
    });
    return {
      industries: data.industries,
      thumbs,
      posts,
      featured: mixed,
      videos: data.videos.map((v) => ({ kind: 'videos', src: v.src, poster: v.poster, ind: v.ind, sub: '', c: '', ad: !!v.ad })),
      ugc: data.ugc.map((u) => ({ kind: 'ugc', src: u.src, poster: u.poster, ind: '', sub: '', c: '' })),
    };
  }

  function filtered() {
    if (st.format === 'ugc') return D.ugc;
    if (st.format === 'videos') return st.ind === 'All' ? D.videos : D.videos.filter((v) => v.ind === st.ind);
    if (st.ind === 'Featured') return D.featured;
    let l = st.ind === 'All' ? D.posts : D.posts.filter((p) => p.ind === st.ind);
    if (st.ind !== 'All' && st.sub !== 'All') l = l.filter((p) => p.sub === st.sub);
    return l;
  }

  // ---- sidebar ------------------------------------------------------------------
  function renderSide() {
    formatBtns.forEach((b) => {
      const f = b.dataset.format;
      b.setAttribute('aria-selected', String(f === st.format));
      b.tabIndex = f === st.format ? 0 : -1;
      b.querySelector('.pf-n').textContent = D[f].length;
    });
    section.classList.toggle('is-ugc', st.format === 'ugc');
    if (st.format === 'ugc') { inds.innerHTML = ''; return; }

    const src = st.format === 'videos' ? D.videos : D.posts;
    const n = (ind) => src.filter((p) => p.ind === ind).length;
    const rows = [];
    // Top-level rows get a picture (Featured a star, All a swatch); sub-industries don't.
    const pic = (key) => (key === 'Featured' ? '<span class="pf-ind__pic is-star" aria-hidden="true">★</span>'
      : key === 'All' ? '<span class="pf-ind__pic is-all" aria-hidden="true"></span>'
        : D.thumbs[key] ? `<img class="pf-ind__pic" src="${esc(D.thumbs[key])}" alt="" loading="lazy" decoding="async">` : '<span class="pf-ind__pic is-all" aria-hidden="true"></span>');
    const row = (key, label, num, pressed, cls = '') =>
      `<button type="button" class="pf-ind${cls}" data-ind="${esc(key)}" aria-pressed="${pressed}">${cls ? '' : pic(key)}<span class="pf-ind__l">${esc(label)}</span>${num == null ? '' : `<em class="pf-n">${num}</em>`}</button>`;
    if (st.format === 'posts') rows.push(`<li>${row('Featured', 'Featured', null, st.ind === 'Featured')}</li>`);
    rows.push(`<li>${row('All', 'All', src.length, st.ind === 'All')}</li>`);
    D.industries.forEach((ind) => {
      const c = n(ind);
      if (!c) return;
      let subs = '';
      if (st.format === 'posts' && st.ind === ind) {
        const counts = {};
        D.posts.filter((p) => p.ind === ind && p.sub).forEach((p) => (counts[p.sub] = (counts[p.sub] || 0) + 1));
        const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        if (names.length > 1) {
          subs = `<ul class="pf-subs">${[`<li>${row('sub:All', `All ${ind}`, c, st.sub === 'All', ' is-sub')}</li>`]
            .concat(names.map((s) => `<li>${row('sub:' + s, s, counts[s], st.sub === s, ' is-sub')}</li>`)).join('')}</ul>`;
        }
      }
      rows.push(`<li>${row(ind, ind, c, st.ind === ind)}${subs}</li>`);
    });
    inds.innerHTML = rows.join('');
    // Phones (a sideways row of chips): keep the chosen industry in view.
    const on = inds.querySelector('.pf-ind[aria-pressed="true"]:not(.is-sub)');
    if (on && inds.scrollWidth > inds.clientWidth) inds.scrollLeft = Math.max(0, on.offsetLeft - inds.offsetLeft - 12);
  }

  function renderBar() {
    const what = st.format === 'posts' ? 'post' : st.format === 'videos' ? 'video' : 'UGC video';
    count.innerHTML = `<b>${list.length.toLocaleString('en-US')}</b> ${what}${list.length === 1 ? '' : 's'}`;
    const p = [];
    if (st.format !== 'ugc' && st.ind !== 'All' && st.ind !== 'Featured') p.push(`<button type="button" class="pf-pill" data-clear="ind">${esc(st.ind)}<i aria-hidden="true">×</i><span class="fx-sr"> (remove filter)</span></button>`);
    if (st.format === 'posts' && st.sub !== 'All') p.push(`<button type="button" class="pf-pill" data-clear="sub">${esc(st.sub)}<i aria-hidden="true">×</i><span class="fx-sr"> (remove filter)</span></button>`);
    pills.innerHTML = p.join('');
    const n = Math.min(st.limit, list.length);
    more.hidden = list.length <= PAGE;
    shown.textContent = `Showing ${n} of ${list.length}`;
    progress.style.width = `${list.length ? (n / list.length) * 100 : 0}%`;
    loadBtn.hidden = n >= list.length;
  }

  // ---- tiles ----------------------------------------------------------------------
  function tile(item, i) {
    const title = item.kind === 'ugc' ? 'Creator video' : item.sub || item.ind;
    const meta = item.kind === 'ugc' ? 'Filmed by a vetted creator' : item.sub ? item.ind : item.kind === 'posts' ? 'Feed post' : item.ad ? 'Video ad' : 'Video';
    const badge = item.kind === 'posts' ? (item.r > 1.1 ? 'Post · 4:5' : 'Post · 1:1') : item.kind === 'videos' ? (item.ad ? 'Video ad' : 'Video') : 'UGC';
    const media = item.kind === 'posts'
      ? `<img src="${esc(item.img)}" alt="" loading="lazy" decoding="async">`
      : `<video muted loop playsinline preload="none" poster="${esc(item.poster)}"><source src="${esc(item.src)}" type="video/mp4"></video><span class="pf-card__play" aria-hidden="true">▶</span>`;
    const svc = SVC[item.kind] || {};
    return `<article class="pf-card" data-i="${i}">
      <button type="button" class="pf-card__media" aria-label="Quick view: ${esc(title)} ${esc(FORMAT_LABEL[item.kind])}">${media}<span class="pf-card__badge">${badge}</span><span class="pf-card__qv">Quick view</span></button>
      <div class="pf-card__meta"><b>${esc(title)}</b><span>${esc(meta)}</span></div>
      ${svc.name ? `<a class="pf-card__svc" href="${esc(svc.href)}"><span>${esc(svc.name)}</span><em>from $${esc(svc.price)}/mo</em></a>` : ''}
    </article>`;
  }

  function animateIn(cards, delay = 0) {
    if (reduced || !cards.length) return;
    G.fromTo(cards, { opacity: 0, y: 50, z: -80, rotationX: -28, transformOrigin: '50% 100%' }, {
      opacity: 1, y: 0, z: 0, rotationX: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04, delay,
      clearProps: 'transform,opacity',
    });
  }

  function renderGrid(mode) {
    list = filtered();
    const from = mode === 'more' ? grid.children.length : 0;
    const items = list.slice(from, st.limit);
    const html = items.map((it, k) => tile(it, from + k)).join('');
    const put = () => {
      if (mode === 'more') grid.insertAdjacentHTML('beforeend', html);
      else grid.innerHTML = html || '<p class="pf__empty">Nothing here yet.</p>';
      const fresh = [...grid.children].slice(from).filter((n) => n.classList.contains('pf-card'));
      if (seen) animateIn(fresh);
      else if (!reduced) G.set(fresh, { opacity: 0 });
    };
    if (mode === 'swap' && !reduced && grid.children.length) {
      G.to([...grid.children], { opacity: 0, y: -14, scale: 0.97, duration: 0.18, ease: 'power2.in', stagger: 0.008, overwrite: true, onComplete: put });
    } else put();
    renderBar();
  }

  function update(change) {
    Object.assign(st, change, { limit: PAGE });
    renderSide();
    renderGrid('swap');
    // If the grid top has scrolled away, bring it back into view.
    const top = grid.getBoundingClientRect().top;
    if (top < 80) {
      const y = window.scrollY + top - 170;
      if (lenis) lenis.scrollTo(y, { duration: 0.8 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // ---- events -----------------------------------------------------------------------
  formatBtns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.format;
    if (f !== st.format) update({ format: f, ind: f === 'posts' ? 'Featured' : 'All', sub: 'All' });
  }));
  section.querySelector('.pf-formats').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = formatBtns.findIndex((b) => b.dataset.format === st.format);
    const next = formatBtns[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : formatBtns.length - 1)) % formatBtns.length];
    next.click();
    next.focus();
  });
  inds.addEventListener('click', (e) => {
    const b = e.target.closest('.pf-ind');
    if (!b) return;
    const key = b.dataset.ind;
    if (key.startsWith('sub:')) update({ sub: key.slice(4) });
    else if (key !== st.ind) update({ ind: key, sub: 'All' });
    const again = inds.querySelector(`[data-ind="${CSS.escape(key)}"]`);
    if (again) again.focus({ preventScroll: true });
  });
  pills.addEventListener('click', (e) => {
    const b = e.target.closest('.pf-pill');
    if (!b) return;
    if (b.dataset.clear === 'sub') update({ sub: 'All' });
    else update({ ind: st.format === 'posts' ? 'Featured' : 'All', sub: 'All' });
  });
  loadBtn.addEventListener('click', () => {
    st.limit += PAGE;
    renderGrid('more');
  });
  viewBtns.forEach((b) => b.addEventListener('click', () => {
    grid.dataset.cols = b.dataset.cols;
    viewBtns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  }));

  // 3D tilt + glare, and hover-to-play for videos (desktop).
  if (finePointer && !reduced) {
    let cur = null;
    const leave = () => {
      if (!cur) return;
      cur.classList.remove('is-tilting');
      const m = cur.querySelector('.pf-card__media');
      m.style.removeProperty('--rx'); m.style.removeProperty('--ry');
      const v = cur.querySelector('video');
      if (v) v.pause();
      cur = null;
    };
    grid.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.pf-card');
      if (card !== cur) {
        leave();
        cur = card;
        if (!card) return;
        card.classList.add('is-tilting');
        const v = card.querySelector('video');
        if (v) { v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      }
      const m = card.querySelector('.pf-card__media');
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      m.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
      m.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(2)}deg`);
      m.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      m.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    grid.addEventListener('pointerleave', leave);
  }

  // ---- quick view --------------------------------------------------------------------
  let at = 0;
  const qvMedia = qv.querySelector('.pf-qv__media');
  function fillQV() {
    const it = list[at];
    if (!it) return;
    const title = it.kind === 'ugc' ? 'Creator video' : it.sub || it.ind;
    qvMedia.innerHTML = it.kind === 'posts'
      ? `<img src="${esc(it.img)}" alt="${esc(title)} social post">`
      : `<video controls autoplay muted loop playsinline poster="${esc(it.poster)}"><source src="${esc(it.src)}" type="video/mp4"></video>`;
    qv.querySelector('.pf-qv__k').textContent = it.kind === 'ugc' ? 'UGC' : `${FORMAT_LABEL[it.kind]} · ${it.ind}`;
    qv.querySelector('.pf-qv__title').textContent = title;
    qv.querySelector('.pf-qv__cap').textContent = it.c;
    const facts = [['Format', it.kind === 'posts' ? (it.r > 1.1 ? 'Feed post, 4:5' : 'Feed post, 1:1') : it.kind === 'videos' ? (it.ad ? 'Video ad, 9:16' : 'Video, 9:16') : 'Creator video, 9:16']];
    if (it.ind) facts.push(['Industry', it.ind]);
    if (it.sub) facts.push(['Niche', it.sub]);
    facts.push(['Made by', it.kind === 'ugc' ? 'A vetted UGC creator' : 'Our creative team']);
    qv.querySelector('.pf-qv__facts').innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    qv.querySelector('.pf-qv__pos').textContent = `${at + 1} / ${list.length}`;
    // "Made with": the service, its price, and a way to get it.
    const svc = SVC[it.kind] || {};
    const name = qv.querySelector('.pf-qv__svc-name');
    name.textContent = svc.name || '';
    name.href = svc.href || '/pricing/';
    qv.querySelector('.pf-qv__svc-price').textContent = svc.price ? `from $${svc.price}/mo` : '';
    qv.querySelector('.pf-qv__ctas').innerHTML = (plan && svc.name
      ? `<button type="button" class="hx-btn hx-btn--blue pf-qv__add" data-svc="${esc(svc.name)}"><span class="pf-qv__add-t">Add to plan</span><span class="pf-qv__add-on">✓ In your plan</span></button><button type="button" class="pf-qv__view">View plan →</button>`
      : `<a class="hx-btn hx-btn--blue" href="${esc(svc.href || '/pricing/')}">Get content like this</a><a class="hx-btn hx-btn--white" href="/book-demo/">Book a demo</a>`);
    markAdded();
  }
  // The quick view's add button shows whether its service is already in the plan.
  function markAdded() {
    const b = qv.querySelector('.pf-qv__add');
    if (b && plan) b.classList.toggle('is-on', plan.read().includes(b.dataset.svc));
  }
  if (plan) {
    qv.addEventListener('click', async (e) => {
      const add = e.target.closest('.pf-qv__add');
      if (add) {
        add.classList.add('is-busy');
        await plan.toggle(add.dataset.svc);
        add.classList.remove('is-busy');
        markAdded();
        return;
      }
      if (e.target.closest('.pf-qv__view')) { qv.close(); plan.goTo(); }
    });
  }
  function openQV(i) {
    at = i;
    fillQV();
    if (!qv.open) {
      if (lenis) lenis.stop();
      qv.showModal();
    }
  }
  qv.addEventListener('close', () => {
    qvMedia.innerHTML = '';
    if (lenis) lenis.start();
  });
  qv.addEventListener('click', (e) => { if (e.target === qv) qv.close(); });
  qv.querySelector('.pf-qv__close').addEventListener('click', () => qv.close());
  const step = (d) => { at = (at + d + list.length) % list.length; fillQV(); };
  qv.querySelector('.pf-qv__prev').addEventListener('click', () => step(-1));
  qv.querySelector('.pf-qv__next').addEventListener('click', () => step(1));
  qv.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.pf-card__media');
    if (b) openQV(+b.closest('.pf-card').dataset.i);
  });

  // ---- entrance + lazy data ------------------------------------------------------------
  if (!reduced) {
    const head = section.querySelectorAll('.sx-eyebrow, .sx-title, .sx-sub');
    G.set(head, { opacity: 0, y: 40, rotationX: -50, transformPerspective: 900, transformOrigin: '50% 100%' });
    G.to(head, {
      opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      onComplete: () => G.set(head, { clearProps: 'transform,opacity' }),
    });
    G.from(side, {
      x: -40, opacity: 0, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity',
      scrollTrigger: { trigger: section.querySelector('.pf__shop'), start: 'top 80%', once: true },
    });
  }
  const reveal = () => {
    if (seen) return;
    seen = true;
    animateIn([...grid.querySelectorAll('.pf-card')], 0.15);
  };

  const io = new IntersectionObserver((entries) => {
    if (!entries[entries.length - 1].isIntersecting) return;
    io.disconnect();
    import('./portfolio-data.js').then(({ PORTFOLIO }) => {
      D = prepare(PORTFOLIO);
      renderSide();
      renderGrid('init');
      if (reduced) seen = true;
      else window.ScrollTrigger.create({ trigger: section.querySelector('.pf__shop'), start: 'top 85%', once: true, onEnter: reveal });
    }).catch((err) => console.warn('[fx] portfolio data unavailable', err));
  }, { rootMargin: '1200px 0px' });
  io.observe(section);
}

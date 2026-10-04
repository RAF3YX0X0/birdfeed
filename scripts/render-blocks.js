// Sections written for one industry or one service (industry pages are built
// from these by scripts/build-industries.js; service pages get the work and
// case study blocks via scripts/build-sections.js). Styles: fx/ind.css,
// motion: fx/ind.js. They use the rebuilt sections' frame (.nx, nx.css).
const ICONS = require('./social-icons.json');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SHIELD = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.5 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const icon = (name) => ICONS[Object.keys(ICONS).find((k) => name.startsWith(k))] || (/google/i.test(name) ? PIN : ICONS[/short/i.test(name) ? 'YouTube' : 'Instagram']);

function head({ eyebrow, title, lede, cls = '' }) {
  return `<header class="nx__head ${cls}">
      ${eyebrow ? `<span class="nx__eyebrow">${esc(eyebrow)}</span>` : ''}
      <h2 class="nx__title">${title}</h2>
      ${lede ? `<p class="nx__lede">${esc(lede)}</p>` : ''}
    </header>`;
}
const section = (cls, tone, inner, { split = false, id = '' } = {}) => `<section class="nx nx--${tone} ind ${cls}${split ? ' nx--split' : ''}"${id ? ` id="${id}"` : ''} data-fx-skip>
  <div class="nx__in">${inner}</div>
</section>`;

// ---- The hard part ---------------------------------------------------------------
function pains(d, items) {
  return section('ind-pains', 'light', `
    ${head({ eyebrow: `Why ${d.name} struggle`, title: `What makes social hard for <em>${esc(d.name)}.</em>` })}
    <ol class="ind-pains__list nx__body">${items.map((it, i) => `
      <li data-ind-item><span class="ind-pains__n">${pad(i + 1)}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></li>`).join('')}
    </ol>`);
}

// ---- An example month --------------------------------------------------------
function calendar(d) {
  const weeks = [0, 1, 2, 3].map((w) => d.cal.slice(w * 3, w * 3 + 3));
  return section('ind-cal', 'stone', `
    ${head({ eyebrow: 'An example month', title: `A month on your <em>feed.</em>`, lede: `What a month of posts could look like for a ${d.noun} like yours. We plan yours around your offers, your seasons and your goals; your plan sets how many posts you get.` })}
    <div class="ind-cal__grid nx__body">${weeks.map((posts, w) => `
      <div class="ind-cal__wk">
        <p class="ind-cal__wkname">Week ${w + 1}</p>
        <ol>${posts.map(([day, fmt, idea, why]) => `
          <li class="ind-post ind-post--${fmt.toLowerCase()}" data-ind-item tabindex="0">
            <span class="ind-post__top"><span class="ind-post__day">${esc(day)}</span><span class="ind-post__fmt">${esc(fmt)}</span></span>
            <h3>${esc(idea)}</h3>
            <p>${esc(why)}</p>
          </li>`).join('')}
        </ol>
      </div>`).join('')}
    </div>`);
}

// ---- Real work ------------------------------------------------------------------
// items: [{ img, c }] posts, or [{ src, poster }] videos.
function work(items, { title, lede, eyebrow = 'Our work', href = '/examples/', label = 'See every example', video = false }) {
  if (!items.length) return '';
  const card = (it) => (video
    ? `<figure class="ind-work__card is-video"><video muted loop playsinline preload="none" data-src="${esc(it.src)}" poster="${esc(it.poster)}"></video></figure>`
    : `<figure class="ind-work__card"><img src="${esc(it.img)}" alt="${esc(it.c || '')}" loading="lazy" decoding="async">${it.c ? `<figcaption>${esc(it.c)}</figcaption>` : ''}</figure>`);
  const rows = items.length >= 8 ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : [items];
  return section('ind-work', 'light', `
    ${head({ eyebrow, title, lede })}
    <div class="ind-work__rows nx__body${rows.length === 1 && items.length < 6 ? ' is-static' : ''}">${rows.map((row, r) => `
      <div class="ind-work__row${r ? ' is-rev' : ''}"><div class="ind-work__track">${[...row, ...(rows.length > 1 || items.length >= 6 ? row : [])].map(card).join('')}</div></div>`).join('')}
    </div>
    <p class="ind-work__more"><a class="nx__cta" href="${esc(href)}">${esc(label)} ${ARROW}</a></p>`);
}

// ---- Platforms ----------------------------------------------------------------------
function platforms(d) {
  return section('ind-plat', 'ink', `
    ${head({ eyebrow: `Where your ${d.people} are`, title: `The platforms that matter <em>for ${esc(d.name)}.</em>`, lede: 'Not everywhere at once: the channels that bring you customers, each with its own job.' })}
    <div class="ind-plat__grid nx__body">${d.platforms.map(([name, role, posts], i) => `
      <article class="ind-plat__card${i === 0 ? ' is-main' : ''}" data-ind-item>
        <div class="ind-plat__top"><span class="ind-plat__ico">${icon(name)}</span>${i === 0 ? '<span class="ind-plat__tag">Main channel</span>' : `<span class="ind-plat__n">${pad(i + 1)}</span>`}</div>
        <h3>${esc(name)}</h3>
        <p class="ind-plat__role">${esc(role)}</p>
        <ul>${posts.map((p) => `<li>${CHECK}<span>${esc(p)}</span></li>`).join('')}</ul>
      </article>`).join('')}
    </div>`);
}

// ---- The year ------------------------------------------------------------------------
function year(d) {
  return `<section class="nx nx--stone ind ind-year" data-fx-skip>
  <div class="ind-year__pin">
    <div class="nx__in">${head({ eyebrow: 'Your year on social', title: `Twelve months of <em>reasons to post.</em>`, lede: `The moments ${d.name} plan around. We build them into your calendar months ahead, so nothing is last-minute.`, cls: 'ind-year__head' })}</div>
    <div class="ind-year__view"><ol class="ind-year__track">${d.year.map(([moment, detail], i) => `
      <li class="ind-mo" style="--i:${i}"><span class="ind-mo__m">${MONTHS[i]}</span><span class="ind-mo__dot" aria-hidden="true"></span><b>${esc(moment)}</b><span class="ind-mo__d">${esc(detail)}</span></li>`).join('')}
    </ol></div>
  </div>
</section>`;
}

// ---- Rules ---------------------------------------------------------------------------
function rules(d) {
  return section('ind-rules', 'light', `
    <div class="nx__side">${head({ eyebrow: 'Done right', title: `The rules of <em>${esc(d.name)}.</em>`, lede: 'The sensitivities that come with your industry, built into how we plan, write and post. We follow your guidance and your professional body’s rules.' })}</div>
    <div class="nx__body"><div class="ind-rules__grid">${d.rules.map(([t, x]) => `
      <article class="ind-rules__card" data-ind-item><span class="ind-rules__ico">${SHIELD}</span><h3>${esc(t)}</h3><p>${esc(x)}</p></article>`).join('')}
    </div></div>`, { split: true });
}

// ---- What we measure ---------------------------------------------------------------
function track(d) {
  return section('ind-track', 'stone', `
    <div class="nx__side">${head({ eyebrow: 'What we measure', title: `Numbers that mean <em>business.</em>`, lede: `Likes are nice. These are the numbers that tell a ${d.noun} whether social is working, reported every month.` })}</div>
    <div class="nx__body"><ol class="ind-track__list">${d.track.map(([t, x], i) => `
      <li data-ind-item><span class="ind-track__n">${pad(i + 1)}</span><span><b>${esc(t)}</b><small>${esc(x)}</small></span><span class="ind-track__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></li>`).join('')}
    </ol></div>`, { split: true });
}

// ---- Case studies ----------------------------------------------------------------------
function cases(list, label) {
  if (!list.length) return '';
  return section('ind-cases', 'light', `
    ${head({ eyebrow: 'Case studies', title: `Results for <em>${esc(label)}.</em>`, lede: 'Real clients, real numbers. Read how each result was reached.' })}
    <div class="ind-cases__grid nx__body is-${Math.min(list.length, 4)}">${list.map((c, i) => `
      <a class="ind-case${i === 0 ? ' is-lead' : ''}" href="/case-studies/#${esc(c.slug)}" data-ind-item>
        <span class="ind-case__top"><span>${esc(c.client)}</span><span class="ind-case__go">${ARROW}</span></span>
        <b class="ind-case__stat">${esc(c.metrics[0].value)}</b>
        <span class="ind-case__label">${esc(c.metrics[0].label)}</span>
        <span class="ind-case__head">${esc(c.headline)}</span>
        <span class="ind-case__tags">${c.services.map((s) => `<i>${esc(s)}</i>`).join('')}<i>${esc(c.industry)}</i></span>
      </a>`).join('')}
    </div>`);
}

// ---- FAQ ------------------------------------------------------------------------------------
function faq({ eyebrow, title, lede, faqs }) {
  if (!faqs.length) return '';
  return section('ind-faq nx--faq', 'light', `
    <div class="nx__side">${head({ eyebrow, title, lede })}<aside class="nx-faq__aside"><b>Still have questions?</b><span>A 20-minute call with our team, no pressure.</span><a href="/book-demo/">Book a free demo ${ARROW}</a></aside></div>
    <div class="nx__body"><div class="nx-faq__list">${faqs.map((f, i) => `
      <details class="nx-faq__item"${i === 0 ? ' open' : ''}><summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary>${f.a ? `<div class="nx-faq__a"><p>${esc(f.a)}</p></div>` : ''}</details>`).join('')}
    </div></div>`, { split: true });
}

module.exports = { pains, calendar, work, platforms, year, rules, track, cases, faq, esc };

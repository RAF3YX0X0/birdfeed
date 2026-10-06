// Turns the section models from build-sections.js into the site's design
// (styles: fx/nx.css, motion: fx/sections.js).
const esc = (s) => String(s == null ? '' : s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Headline with the site's serif accent: the original's accent words if it
// had any, otherwise its last few words.
function title(html) {
  if (!html) return '';
  if (/<em>/.test(html)) return html;
  const parts = html.split(/<br\s*\/?>/i);
  const last = parts.pop().trim();
  const words = last.split(' ');
  const k = words.length > 5 ? 2 : words.length > 2 ? 1 : 0;
  const tail = k ? ` <em>${words.slice(-k).join(' ')}</em>` : '';
  return [...parts, (k ? words.slice(0, -k).join(' ') : last) + tail].join('<br>');
}

function head(m, cls = '') {
  if (!m.title && !m.eyebrow && !m.lede) return '';
  return `<header class="nx__head ${cls}">
      ${m.eyebrow ? `<span class="nx__eyebrow"><i></i>${esc(m.eyebrow)}</span>` : ''}
      ${m.title ? `<h2 class="nx__title">${title(m.title)}</h2>` : ''}
      ${m.lede ? m.lede.split('\n\n').map((p) => `<p class="nx__lede">${esc(p)}</p>`).join('') : ''}
      ${m.cta && !['catalog'].includes(m.kind) ? `<a class="nx__cta" href="${esc(m.cta.href)}">${esc(m.cta.label)} ${ARROW}</a>` : ''}
    </header>`;
}

const icon = (it) => (it.icon ? `<span class="nx-ico">${it.icon}</span>` : '');
const bullets = (b) => (b && b.length ? `<ul class="nx-bul">${b.map((x) => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>` : '');

const LAYOUTS = {
  bento(m) {
    const n = m.items.length;
    return `<div class="nx-bento nx-bento--${Math.min(n, 6)}">${m.items.map((it, i) => `
      <article class="nx-card${i === 0 && n !== 2 && n !== 4 ? ' nx-card--lead' : ''}${m.neg ? ' nx-card--neg' : ''}" data-nx-item>
        <div class="nx-card__top">${m.neg ? `<span class="nx-pains__x">${CROSS}</span>` : icon(it)}<span class="nx-card__n">${pad(i + 1)}</span></div>
        ${it.tag ? `<span class="nx-card__tag">${esc(it.tag)}</span>` : ''}
        ${it.stat ? `<b class="nx-card__stat">${esc(it.stat)}</b>` : ''}
        ${it.title ? `<h3>${esc(it.title)}</h3>` : ''}
        ${it.text ? `<p>${esc(it.text)}</p>` : ''}
        ${bullets(it.bullets)}
        ${it.href ? `<a class="nx-card__link" href="${esc(it.href)}">Learn more ${ARROW}</a>` : ''}
      </article>`).join('')}
    </div>`;
  },
  steps(m) {
    return `<div class="nx-steps" style="--n:${m.items.length}">
      <div class="nx-steps__line" aria-hidden="true"><i></i></div>
      <ol>${m.items.map((it, i) => `
        <li class="nx-step" data-nx-item>
          <span class="nx-step__dot">${pad(i + 1)}</span>
          ${it.tag || it.stat ? `<span class="nx-step__tag">${esc(it.tag || it.stat)}</span>` : ''}
          ${it.title ? `<h3>${esc(it.title)}</h3>` : ''}
          ${it.text ? `<p>${esc(it.text)}</p>` : ''}
          ${bullets(it.bullets)}
        </li>`).join('')}
      </ol>
    </div>`;
  },
  stats(m) {
    return `<dl class="nx-stats nx-stats--${Math.min(m.items.length, 6)}">${m.items.map((it) => `
      <div class="nx-stat" data-nx-item>
        <dd>${esc(it.stat)}</dd>
        <dt>${esc(it.title)}</dt>
        ${it.text ? `<p>${esc(it.text)}</p>` : ''}
      </div>`).join('')}
    </dl>`;
  },
  chips(m) {
    // Problems ("Sound familiar?"): a grid of cards with a muted cross.
    if (m.neg) return `<ul class="nx-pains">${m.items.map((it) => `<li data-nx-item><span class="nx-pains__x">${CROSS}</span><span>${it.title && it.text ? `<b>${esc(it.title)}</b> ${esc(it.text)}` : esc(it.title || it.text)}</span></li>`).join('')}</ul>`;
    const rich = m.items.some((it) => it.title && it.text);
    if (rich) {
      return `<ul class="nx-checks">${m.items.map((it) => `<li data-nx-item><span class="nx-checks__dot">${CHECK}</span><span><b>${esc(it.title)}</b>${it.text ? ` ${esc(it.text)}` : ''}</span></li>`).join('')}</ul>`;
    }
    return `<ul class="nx-chips">${m.items.map((it) => `<li data-nx-item>${CHECK}<span>${esc(it.title || it.text)}</span></li>`).join('')}</ul>`;
  },
  links(m) {
    return `<div class="nx-links">${m.items.map((it) => `
      <a class="nx-link" href="${esc(it.href)}" data-nx-item>
        ${icon(it)}
        <span><b>${esc(it.title)}</b>${it.text ? `<small>${esc(it.text)}</small>` : ''}</span>
        <span class="nx-link__go">${ARROW}</span>
      </a>`).join('')}
    </div>`;
  },
  gallery(m) {
    return `<div class="nx-gallery">${m.items.map((it) => `
      <figure class="nx-shot" data-nx-item>
        <img src="${esc(it.img)}" alt="${esc(it.title)}" loading="lazy" decoding="async">
        ${it.title || it.text ? `<figcaption><b>${esc(it.title)}</b>${it.text ? `<span>${esc(it.text)}</span>` : ''}</figcaption>` : ''}
      </figure>`).join('')}
    </div>`;
  },
  compare(m) {
    const cols = m.cols.length ? m.cols : m.rows[0].map((_, i) => (i === 0 ? '' : i === 1 ? 'With MadMarketing' : 'The alternative'));
    const us = Math.max(1, cols.findIndex((c, i) => i > 0 && /madmarketing|with us|^us$/i.test(c)));
    const cell = (v) => (v === true ? `<span class="nx-yes">${CHECK}</span>` : v === false ? `<span class="nx-no">${CROSS}</span>` : v === '' ? '<span class="nx-dash" aria-label="none">—</span>' : esc(v));
    return `<div class="nx-cmp" style="--cols:${cols.length}" role="table">
      <div class="nx-cmp__row nx-cmp__row--head" role="row">${cols.map((c, i) => `<span role="columnheader" class="${i === us ? 'is-us' : ''}">${i === us ? '<i class="nx-cmp__badge">Recommended</i>' : ''}${esc(c)}</span>`).join('')}</div>
      ${m.rows.map((r) => `<div class="nx-cmp__row" role="row" data-nx-item>${r.map((v, i) => `<span role="${i ? 'cell' : 'rowheader'}" class="${i === us ? 'is-us' : ''}">${cell(v)}</span>`).join('')}</div>`).join('')}
    </div>`;
  },
  faq(m) {
    return `<div class="nx-faq__list">${m.faqs.map((f, i) => `
      <details class="nx-faq__item" data-nx-item${i === 0 ? ' open' : ''}>
        <summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary>
        ${f.a ? `<div class="nx-faq__a"><p>${esc(f.a)}</p></div>` : ''}
      </details>`).join('')}
    </div>`;
  },
  statement(m) {
    return m.visual ? `<div class="nx-visual" data-nx-item>${m.visual}</div>` : '';
  },
  catalog(m) {
    return m.groups.map((g, gi) => `
      <div class="nx-cat" data-nx-item>
        <div class="nx-cat__head">
          <span class="nx-cat__n">${pad(gi + 1)}</span>
          <h3>${esc((g.label || '').replace(/^\d{2}\s*·\s*/, ''))}</h3>
          ${g.text ? `<p>${esc(g.text)}</p>` : ''}
          <div class="nx-cat__meta">${g.count ? `<span>${esc(g.count)}</span>` : ''}${g.href ? `<a href="${esc(g.href)}">See all ${ARROW}</a>` : ''}</div>
        </div>
        <div class="nx-cat__grid">${g.services.map((s) => `
          <a class="nx-svc${s.badge ? ' is-pop' : ''}" href="${esc(s.href)}">
            ${s.badge ? `<span class="nx-svc__badge">${esc(s.badge)}</span>` : ''}
            <span class="nx-svc__top">${s.icon ? `<span class="nx-ico">${s.icon}</span>` : ''}<span class="nx-svc__go">${ARROW}</span></span>
            <b class="nx-svc__name">${esc(s.name)}</b>
            <span class="nx-svc__text">${esc(s.text)}</span>
            <span class="nx-svc__price">${s.price ? `<small>from</small> <strong>${esc(s.price)}</strong>${esc(s.unit)}` : ''}${s.was ? ` <s>${esc(s.was)}</s>` : ''}${s.save ? ` <em>${esc(s.save)}</em>` : ''}</span>
          </a>`).join('')}
        </div>
      </div>`).join('');
  },
};

// Layouts that put the heading in a sticky column beside the content.
const SPLIT = new Set(['faq', 'checks']);
const TONES = ['light', 'stone', 'light', 'ink'];

function renderSection(m, i) {
  const kind = m.kind === 'chips' && m.items.some((it) => it.title && it.text) ? 'checks' : m.kind;
  // Rhythm: a dark band now and then (never for FAQs, comparisons or the catalogue).
  let tone = TONES[i % TONES.length];
  if (['faq', 'compare', 'catalog'].includes(kind) && tone === 'ink') tone = 'stone';
  const split = SPLIT.has(kind) || (kind === 'bento' && m.items.length >= 4 && m.items.length % 2 === 0) || (kind === 'statement' && m.visual);
  let body = LAYOUTS[m.kind](m);
  // A second group of items, in its own layout below the first.
  if (m.items2 && m.items2.length) body += `<div class="nx__more">${LAYOUTS[m.kind2]({ ...m, items: m.items2, neg: false })}</div>`;
  const faqAside = kind === 'faq' ? `<aside class="nx-faq__aside"><b>Still have questions?</b><span>A 30-minute call with our team, no pressure.</span><a href="/book-demo/">Book a free demo ${ARROW}</a></aside>` : '';
  return `<section class="nx nx--${kind} nx--${tone}${split ? ' nx--split' : ''}${!m.title ? ' nx--headless' : ''}" data-nx-for="${m.index}" data-nx-h="${esc(m.heading.slice(0, 60))}">
  <div class="nx__in">
    <div class="nx__side">${head(m)}${faqAside}</div>
    <div class="nx__body">${body}</div>
  </div>
</section>`;
}

module.exports = { renderSection };

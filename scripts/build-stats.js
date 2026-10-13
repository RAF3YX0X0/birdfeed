// Builds fx/partials/home-stats.html: the homepage's "results we've delivered"
// section, one tab per service, with the charts drawn from numbers rather than
// pasted in as screenshots.
//
// The numbers (and the rules that keep them honest) live in stats-data.js.
// Run: node scripts/build-stats.js, then build-fx.js and optimize-pages.js.

const fs = require('fs');
const path = require('path');
const { GROUPS } = require('./stats-data');

const OUT = path.join(__dirname, '..', 'fx', 'partials', 'home-stats.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const group = (n) => n.toLocaleString('en-US');

// A chart value as the export shows it: 14.45%, dh78.05, Rs 134,143, 183.
function show(v, fmt, unit) {
  if (fmt === 'pct') return `${v}%`;
  if (fmt === 'money') {
    const big = v >= 1000;
    const n = big ? group(Math.round(v)) : v.toFixed(2).replace(/\.00$/, '');
    return unit === 'Rs' ? `Rs ${n}` : `${unit}${n}`;
  }
  return group(v);
}

// Paired bars (before → after, or spend → sales). The taller bar is 100%.
function paired(c) {
  const max = Math.max(...c.rows.map(([, v]) => v));
  const bars = c.rows.map(([label, v], i) => {
    const h = Math.max(4, (v / max) * 100);
    const cls = c.kind === 'delta' ? (i === 0 ? ' st3-bar--was' : ' st3-bar--now') : ` st3-bar--s${i}`;
    return `<li class="st3-bar${cls}" style="--h:${h.toFixed(1)}%">
          <b class="st3-bar__v" data-to="${v}" data-fmt="${c.fmt}" data-unit="${esc(c.unit || '')}">${esc(show(v, c.fmt, c.unit))}</b>
          <i class="st3-bar__fill" aria-hidden="true"></i>
          <span class="st3-bar__l">${esc(label)}</span>
        </li>`;
  }).join('\n        ');
  // The change between the two, worked out from the same two numbers.
  let badge = '';
  if (c.kind === 'delta') {
    const [a, b] = c.rows.map(([, v]) => v);
    const up = b > a;
    const pct = Math.round(Math.abs(b - a) / a * 100);
    const times = a > 0 ? b / a : 0;
    const text = up ? (times >= 2 ? `${times.toFixed(1)}×` : `+${pct}%`) : `−${pct}%`;
    const good = (c.better === 'up') === up;
    badge = `<span class="st3-chart__badge${good ? ' is-good' : ''}">${esc(text)}</span>`;
  }
  return `<ul class="st3-bars st3-bars--v" role="img" aria-label="${esc(c.rows.map(([l, v]) => `${l}: ${show(v, c.fmt, c.unit)}`).join(', '))}">
        ${bars}
      </ul>${badge}`;
}

// Ranked horizontal bars.
function ranked(c) {
  const max = Math.max(...c.rows.map(([, v]) => v));
  const rows = c.rows.map(([label, v]) => `<li class="st3-row" style="--w:${((v / max) * 100).toFixed(1)}%">
          <span class="st3-row__l">${esc(label)}</span>
          <b class="st3-row__v" data-to="${v}" data-fmt="${c.fmt}" data-unit="${esc(c.unit || '')}">${esc(show(v, c.fmt, c.unit))}</b>
          <i class="st3-row__fill" aria-hidden="true"></i>
        </li>`).join('\n        ');
  return `<ul class="st3-bars st3-bars--h" role="img" aria-label="${esc(c.rows.map(([l, v]) => `${l}: ${show(v, c.fmt, c.unit)}`).join(', '))}">
        ${rows}
      </ul>`;
}

function chart(c) {
  return `<figure class="st3-chart st3-chart--${c.kind}">
      <figcaption class="st3-chart__head"><b>${esc(c.title)}</b><span>${esc(c.note)}</span></figcaption>
      ${c.kind === 'bars' ? ranked(c) : paired(c)}
      <p class="st3-chart__cap">${esc(c.caption)}</p>
      <p class="st3-chart__src">${esc(c.source)}</p>
    </figure>`;
}

function table(t) {
  const head = ['', ...t.cols].map((c) => `<th scope="col">${esc(c)}</th>`).join('');
  const rows = t.rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n          ');
  return `<div class="st3-table">
      <p class="st3-table__head"><b>${esc(t.title)}</b></p>
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p class="st3-chart__cap">${esc(t.note)}</p>
      <p class="st3-chart__src">${esc(t.source)}</p>
    </div>`;
}

function panel(g, i) {
  const stats = g.stats.map((s) => `<li class="st3-stat">
          <b>${esc(s.value)}</b>
          <span>${esc(s.label)}</span>
          <small>${esc(s.sub)}</small>
        </li>`).join('\n        ');
  const link = g.linkHref
    ? `<a class="st3-panel__link" href="${esc(g.linkHref)}">${esc(g.linkText)} <span aria-hidden="true">→</span></a>`
    : `<a class="st3-panel__link" href="${esc(g.href)}">More about ${esc(g.name)} <span aria-hidden="true">→</span></a>`;
  return `<div class="st3-panel" id="st3-p-${g.key}" role="tabpanel" aria-labelledby="st3-t-${g.key}" data-key="${g.key}"${i ? ' hidden' : ''}>
      <p class="st3-panel__lede">${esc(g.lede)}</p>
      <ul class="st3-stats">
        ${stats}
      </ul>
      <div class="st3-charts">
        ${g.charts.map(chart).join('\n        ')}
        ${g.table ? table(g.table) : ''}
      </div>
      ${link}
    </div>`;
}

const tabs = GROUPS.map((g, i) => `<button class="st3-tab" type="button" role="tab" id="st3-t-${g.key}" aria-controls="st3-p-${g.key}" aria-selected="${i ? 'false' : 'true'}" data-key="${g.key}"><span>${esc(g.tab)}</span></button>`).join('\n      ');

const html = `<section class="st3" aria-labelledby="st3-title" data-fx-skip>
  <div class="sx-head">
    <span class="sx-eyebrow"><i></i>Results we have delivered</span>
    <h2 class="sx-title" id="st3-title">Real accounts, <em>real numbers.</em></h2>
    <p class="sx-sub">Every figure below is read straight from a client’s own Google Ads, Analytics, Meta or store export. Where an account isn’t named, the client hasn’t cleared it for publication.</p>
  </div>
  <div class="st3__in">
    <div class="st3__tabs" role="tablist" aria-label="Results by service">
      ${tabs}
    </div>
    <div class="st3__panels">
      ${GROUPS.map(panel).join('\n      ')}
    </div>
  </div>
  <p class="st3__foot">Past results don’t guarantee future results: every account, budget and market is different.</p>
</section>
`;

fs.writeFileSync(OUT, html);
console.log(`home-stats.html: ${GROUPS.length} services, ${GROUPS.reduce((n, g) => n + g.charts.length, 0)} charts`);

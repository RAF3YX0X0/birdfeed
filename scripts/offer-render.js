// The plans, the custom plan, the free challenge and the add-ons as markup,
// with one stylesheet (class prefix pk-), so they look and read the same on
// the pricing page, the service pages, the homepage and the ad landing page.
// Everything comes from scripts/offer-data.js.
const O = require('./offer-data');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CHECK = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const CSS = `
.pk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch;margin:0;padding:13px 0 0;list-style:none;text-align:left}
.pk-card{position:relative;display:flex;flex-direction:column;box-sizing:border-box;padding:28px;border-radius:28px;background:#fff;color:#0A0A0A;box-shadow:0 0 0 1px #E5E7EB,0 30px 60px -44px rgba(20,30,70,.5);transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
.pk-card:hover{transform:translateY(-4px)}
.pk-card.is-rec{background:radial-gradient(90% 70% at 100% 0%,rgba(0,102,255,.55),rgba(0,102,255,0) 70%),#0A0A0A;color:#fff;box-shadow:0 40px 80px -40px rgba(0,102,255,.6)}
.pk-card__flag{position:absolute;top:-13px;left:28px;margin:0;padding:6px 12px;border-radius:999px;background:#0066FF;color:#fff;font-size:11.5px!important;line-height:1.2!important;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.pk-card__name{margin:0;font-size:22px!important;line-height:1.2!important;font-weight:600;letter-spacing:-.02em}
.pk-card__line{margin:6px 0 0;font-size:14.5px!important;line-height:1.5!important;color:#4B5563}
.pk-card.is-rec .pk-card__line{color:rgba(255,255,255,.72)}
.pk-card__price{display:flex;align-items:baseline;gap:8px;margin:22px 0 0}
.pk-card__price b{font-size:54px;font-weight:600;letter-spacing:-.04em;line-height:1}
.pk-card__price span{font-size:15px;color:#6B7280}
.pk-card.is-rec .pk-card__price span{color:rgba(255,255,255,.62)}
.pk-card__builds{margin:22px 0 0;font-size:12px!important;line-height:1.3!important;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0066FF}
.pk-card.is-rec .pk-card__builds{color:#66A3FF}
.pk-list{display:grid;gap:10px;margin:16px 0 0;padding:0;list-style:none}
.pk-card__builds+.pk-list{margin-top:12px}
.pk-list li{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.45}
.pk-list i{flex:none;display:grid;place-items:center;width:20px;height:20px;margin-top:1px;border-radius:50%;background:#EBF3FF;color:#0066FF}
.pk-card.is-rec .pk-list i{background:#0066FF;color:#fff}
.pk-card__cta{margin-top:auto;padding-top:26px}
.pk-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;width:100%;min-height:48px;padding:12px 22px;border-radius:999px;background:#F1F2F4;color:#0A0A0A;font-size:15px;font-weight:600;text-decoration:none;transition:background .2s ease,transform .3s cubic-bezier(.22,1,.36,1)}
.pk-btn:hover{background:#E5E7EB;transform:translateY(-2px)}
.pk-card.is-rec .pk-btn,.pk-btn--blue{background:#0066FF;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 10px 24px -10px rgba(0,102,255,.8)}
.pk-card.is-rec .pk-btn:hover,.pk-btn--blue:hover{background:#0052CC}
/* The custom plan: a band under the three. */
.pk-full{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr) auto;gap:clamp(20px,3vw,40px);align-items:center;box-sizing:border-box;margin-top:16px;padding:28px;border-radius:28px;background:#fff;color:#0A0A0A;box-shadow:0 0 0 1px #E5E7EB,0 30px 60px -44px rgba(20,30,70,.5);text-align:left}
.pk-full__price{display:block;margin-top:14px;font-size:30px;font-weight:600;letter-spacing:-.03em;line-height:1.1}
.pk-full .pk-list{margin:0}
.pk-full .pk-btn{width:auto;white-space:nowrap}
/* Compact: name, price, one line (service pages, the ad landing page). */
.pk--compact .pk-card{padding:22px}
.pk--compact .pk-card__price{margin-top:14px}
.pk--compact .pk-card__price b{font-size:40px}
.pk--compact .pk-card__line{margin-top:12px}
/* The free challenge. */
.pk-free{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:center;box-sizing:border-box;padding:clamp(26px,3.6vw,48px);border-radius:32px;background:radial-gradient(70% 90% at 90% 0%,rgba(0,102,255,.5),rgba(0,102,255,0) 65%),#0A0A0A;color:#fff;text-align:left}
.pk-free__k{display:block;font-size:12px!important;line-height:1.3!important;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#66A3FF}
.pk-free__t{display:block;margin:12px 0 0;font-size:clamp(26px,3vw,40px);font-weight:600;letter-spacing:-.03em;line-height:1.08}
.pk-free__p{display:block;margin:14px 0 0;font-size:16px;line-height:1.6;color:rgba(255,255,255,.74)}
.pk-free__terms{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none}
.pk-free__terms li{padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);font-size:13.5px;font-weight:600}
.pk-free .pk-btn{width:auto;margin-top:24px}
.pk-free .pk-list{margin:0;padding:24px;border-radius:24px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.pk-free .pk-list i{background:#0066FF;color:#fff}
.pk-free__note{display:block;grid-column:1/-1;font-size:12.5px;line-height:1.6;color:rgba(255,255,255,.5)}
/* Add-ons. */
.pk-addons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none;text-align:left}
.pk-addons li{display:flex;flex-direction:column;gap:6px;padding:18px 20px;border-radius:20px;background:#fff;box-shadow:0 0 0 1px #E5E7EB}
.pk-addons b{font-size:16px;font-weight:600;letter-spacing:-.01em}
.pk-addons span{font-size:13.5px;color:#6B7280}
@media (max-width:980px){.pk,.pk-addons{grid-template-columns:minmax(0,1fr)}.pk-full,.pk-free{grid-template-columns:minmax(0,1fr)}.pk-full .pk-btn{width:100%}}
@media (min-width:641px) and (max-width:980px){.pk-addons{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

const tick = (t) => `<li><i>${CHECK}</i><span>${esc(t)}</span></li>`;
const per = (p) => (p.price == null ? '<b>Custom quote</b>' : `<b>${O.money(p.price)}</b><span>/ month</span>`);

// The three monthly plans. compact: name, price and one line each.
// cta(plan) → [href, label].
function plans({ compact = false, cta = () => ['/book-demo/', 'Book a call'], headingTag = 'h3' } = {}) {
  return `<ul class="pk${compact ? ' pk--compact' : ''}" aria-label="Local SEO monthly plans">${O.PLANS.map((p) => {
    const [href, label] = cta(p);
    return `
  <li class="pk-card${p.recommended ? ' is-rec' : ''}">
    ${p.recommended ? '<span class="pk-card__flag">Recommended</span>' : ''}
    <${headingTag} class="pk-card__name">${esc(p.name)}</${headingTag}>
    ${compact ? '' : `<span class="pk-card__line">${esc(p.tagline)}</span>`}
    <span class="pk-card__price">${per(p)}</span>
    ${compact ? `<span class="pk-card__line">${esc(p.short)}</span>` : `${p.builds ? `<span class="pk-card__builds">Everything in ${esc(p.builds)}, plus</span>` : ''}
    <ul class="pk-list">${p.items.map(tick).join('')}</ul>`}
    <span class="pk-card__cta"><a class="pk-btn" href="${href}">${esc(label)}</a></span>
  </li>`;
  }).join('')}
</ul>`;
}

// MAD Full Growth: the custom, multi-channel plan.
function fullGrowth({ href = '/book-demo/', label = 'Request a quote', headingTag = 'h3' } = {}) {
  const p = O.FULL_GROWTH;
  return `<div class="pk-full">
  <div>
    <${headingTag} class="pk-card__name">${esc(p.name)}</${headingTag}>
    <span class="pk-card__line">${esc(p.tagline)}</span>
    <span class="pk-full__price">Custom quote</span>
  </div>
  <ul class="pk-list">${p.items.map(tick).join('')}</ul>
  <a class="pk-btn pk-btn--blue" href="${href}">${esc(label)} ${ARROW}</a>
</div>`;
}

// The free 30-day challenge.
function challenge({ href = '/free-local-seo/', label = 'Apply for the free 30-day challenge', headingTag = 'h2' } = {}) {
  const c = O.CHALLENGE;
  return `<div class="pk-free">
  <div>
    <span class="pk-free__k">Free entry offer</span>
    <${headingTag} class="pk-free__t">${esc(c.name)}</${headingTag}>
    <span class="pk-free__p">${esc(c.who)}</span>
    <ul class="pk-free__terms">${c.terms.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <a class="pk-btn pk-btn--blue" href="${href}">${esc(label)} ${ARROW}</a>
  </div>
  <ul class="pk-list" aria-label="What the trial includes">${c.items.map(tick).join('')}</ul>
  <span class="pk-free__note">${esc(c.note)}</span>
</div>`;
}

// The optional add-ons (names; their ranges only once approved).
function addons(only) {
  const list = O.ADDONS.filter(([n]) => !only || only.includes(n));
  return `<ul class="pk-addons">${list.map(([n, range, unit]) => `<li><b>${esc(n)}</b>${O.SHOW_ADDON_PRICES ? `<span>${esc(range)} ${esc(unit)}</span>` : ''}</li>`).join('')}</ul>`;
}

module.exports = { CSS, plans, fullGrowth, challenge, addons, esc, CHECK, ARROW };

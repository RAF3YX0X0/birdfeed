// Builds the About page around its own story, in the homepage's language and
// with 3D motion throughout. Writes:
//   - fx/partials/heroes/about.html: the hero (the statement, and a 3D stack
//     of the layers the service is built from),
//   - fx/partials/industry/about.top.html: rules hiding the page's original
//     sections, then "where it started" (text that lights up as
//     you read), the four alternatives (a fanned 3D deck that MadMarketing's
//     card rises out of) and the economics (a 3D ring of six cards),
//   - fx/partials/industry/about.bottom.html, after the 3D globe (fx.js keeps
//     placing it in the page's island): the principles, the reviews, the FAQ
//     and a closing call to action.
// The words and figures are the page's own. Styles in fx/about.css, motion in
// fx/about.js.
//
//   node server.js &
//   NODE_PATH=<dir with puppeteer-core> node scripts/build-about.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { extract } = require('./build-sections.js');
const B = require('./render-blocks.js');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const esc = B.esc;
const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svg = (d, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
};

// ---- Hero: the statement, and the layers it's built on ---------------------------------------
function hero() {
  const layers = [
    ['people', 'Specialists', '200+ vetted creatives'],
    ['book', 'Playbooks', 'Refined across 100+ accounts'],
    ['bolt', 'Technology', 'Tooling for the busywork'],
    ['star', 'Your brand', 'From $99/mo, month to month'],
  ];
  return `<section class="abx" aria-labelledby="abx-title">
  <div class="abx__bg" aria-hidden="true"><i></i><i></i></div>
  <div class="abx__in">
    <div class="abx__copy">
      <span class="sx-eyebrow"><i></i>Our story</span>
      <h1 class="abx__title" id="abx-title"><span class="abx__line"><span>We made professional</span></span> <span class="abx__line"><span>marketing <em>affordable.</em></span></span></h1>
      <p class="abx__sub"><b>The industry hasn’t caught up.</b> Great marketing used to mean agency retainers or in-house teams. Most businesses couldn’t afford either. We built the infrastructure to change that.</p>
      <div class="abx__ctas"><a class="hx-btn hx-btn--blue" href="/book-demo/">Book a demo</a><a class="hx-btn hx-btn--white" href="/pricing/">See pricing</a></div>
      <p class="abx__trust"><span class="abx__stars" aria-hidden="true">★★★★★</span>4.6/5 from 800+ reviews · 100+ businesses served</p>
    </div>
    <div class="abx__stage" aria-hidden="true">
      <div class="abx-stack">${layers.map(([ic, name, line], i) => `
        <div class="abx-layer${i === layers.length - 1 ? ' is-top' : ''}" style="--i:${i}"><div class="abx-layer__face"><span class="abx-layer__ic">${svg(I[ic], 22)}</span><span class="abx-layer__txt"><b>${name}</b><small>${line}</small></span><span class="abx-layer__n">0${i + 1}</span></div><span class="abx-layer__edge"></span></div>`).join('')}
        <span class="abx-stack__shadow"></span>
      </div>
    </div>
  </div>
</section>`;
}

// ---- Where it started: text that lights up as you read ----------------------------------------
function story() {
  const paras = [
    'The founders ran a fast-growing ecommerce brand and needed marketing across every channel. What they found was an industry built to charge as much as the market would bear, agencies quoting $1,500–$3,000 per service.',
    'Freelancers were unreliable; in-house was too expensive. None of it worked, so they built their own system: specialized talent, repeatable processes, real playbooks.',
    'When it started producing agency-quality output at a fraction of the price, the question became obvious: why isn’t this available to everyone? That question became MadMarketing, a model designed for the businesses the industry had written off.',
  ];
  const words = (t) => t.split(/\s+/).map((w) => `<span class="abx-w">${esc(w)}</span>`).join(' ');
  return `<section class="nx nx--light abx-story" data-fx-skip>
  <div class="nx__in">
    <div class="abx-story__side"><span class="nx__eyebrow">Where it started</span><h2 class="nx__title">We built this to solve a problem <em>we lived through.</em></h2><span class="abx-story__year" aria-hidden="true">100+</span></div>
    <div class="abx-story__text">${paras.map((t) => `<p>${words(t)}</p>`).join('')}</div>
  </div>
</section>`;
}

// ---- The four alternatives: a fanned deck, then MadMarketing rises out of it -----------------------
function alternatives() {
  const cards = [
    ['Do it yourself', '10–20', 'hours a week', '10–20 hours a week on marketing instead of the business. Execution is inconsistent. Most burn out within six months.', 'Unsustainable'],
    ['Hire freelancers', '?', 'who shows up', 'Good freelancers are hard to keep. When they disappear, the work stops. No continuity, no coordination.', 'No continuity'],
    ['Use AI tools', '≈', 'like everyone else', 'Generic output that looks like everyone else’s. You still need to brief, edit, and notice when it drifts off-brand.', 'Generic'],
    ['Hire a traditional agency', '$5k–8k', 'multi-channel, per month', '$1,500–$3,000 per service. Multi-channel runs $5k–$8k minimum. Built for enterprise, never made sense for everyone else.', 'Built for a different tier'],
  ];
  return `<section class="nx nx--light abx-alts" data-fx-skip>
  <div class="abx-alts__pin">
    <div class="nx__in abx-alts__stage">
      <header class="nx__head"><span class="nx__eyebrow">The structural problem</span><h2 class="nx__title">Four alternatives. None of them <em>built to actually work.</em></h2><p class="nx__lede">The industry offered small businesses four options. Every one had a structural flaw that made sustainable marketing nearly impossible.</p></header>
      <div class="abx-deck">${cards.map(([k, big, unit, text, tag], i) => `
        <article class="abx-card" style="--i:${i}"><span class="abx-card__k">${esc(k)}</span><b class="abx-card__big">${esc(big)}</b><small class="abx-card__unit">${esc(unit)}</small><p>${esc(text)}</p><span class="abx-card__tag">${esc(tag)}</span></article>`).join('')}
        <article class="abx-card abx-card--us"><span class="abx-card__k">MadMarketing</span><b class="abx-card__big">The infrastructure that <em>didn’t exist.</em></b><p>15+ services, 200+ vetted specialists, one platform. Pricing starts at $99/month and scales with your needs, no long-term contracts. Designed from the start for the businesses the industry had written off as too small to serve well.</p><span class="abx-card__chips"><i>15+ services</i><i>200+ specialists</i><i>From $99/mo</i><i>No long-term contracts</i></span></article>
      </div>
    </div>
  </div>
</section>`;
}

// ---- How the economics work: a ring of six cards that turns with the scroll -------------------------
function economics() {
  const items = [
    ['Deep specialization, not generalists', 'Every specialist is vetted for one discipline. Specialization produces better work faster, that’s what makes the price work.'],
    ['Systems built through iteration', '100+ accounts across every industry build real institutional knowledge. Your account benefits from all of it.'],
    ['Infrastructure with no dead weight', 'No downtown offices, no account-management layers. What you pay funds the specialists doing the work, nothing else.'],
    ['Repeatable playbooks', 'Refined across tens of thousands of campaigns, then applied to your brand so quality never depends on a single person.'],
    ['Technology where it helps', 'Tooling speeds up the busywork so specialists spend their time on judgment and craft, not formatting and exports.'],
    ['Flat, honest pricing', 'One monthly rate per service. No ad-spend percentage, no surprise invoices, no upsell pressure on every call.'],
  ];
  return `<section class="nx nx--light abx-eco" data-fx-skip>
  <div class="abx-eco__pin">
    <div class="nx__in abx-eco__stage">
      <div class="abx-eco__side">
        <span class="nx__eyebrow">How we did it</span>
        <h2 class="nx__title">How we made the economics <em>work.</em></h2>
        <p class="nx__lede">Agency pricing isn’t high because the work costs that much. It’s high because of how agencies are built. We took the whole thing apart and rebuilt it around output.</p>
        <p class="abx-eco__count" aria-hidden="true"><b>01</b><span>/ 06</span></p>
      </div>
      <div class="abx-ring"><div class="abx-ring__track">${items.map(([t, d], i) => `
        <article class="abx-face" style="--i:${i}"><span class="abx-face__n">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}
      </div></div>
    </div>
  </div>
</section>`;
}

// ---- The principles -------------------------------------------------------------------------------
function principles() {
  const items = [
    ['Access is the product', 'Great marketing shouldn’t require a $5k/mo budget. Every product and pricing decision runs through one filter: does this make it more accessible?'],
    ['Honest over impressive', 'If something isn’t working, we say so and fix it. If a channel is wrong for your business, we tell you. Transparency is the baseline.'],
    ['Consistency is the mechanism', 'Marketing works through sustained presence, not bursts. Our infrastructure is built around repeatability and compounding, not one-off impact.'],
    ['People are the product', 'Every piece of work is produced by a real specialist. Technology helps them work faster, it doesn’t replace the judgment or craft that makes it work.'],
  ];
  return `<section class="nx nx--light abx-prin" data-fx-skip>
  <div class="nx__in">
    <header class="nx__head"><span class="nx__eyebrow">What we believe</span><h2 class="nx__title">The principles <em>behind the work.</em></h2></header>
    <div class="abx-prin__grid">${items.map(([t, d], i) => `
      <article class="abx-pr${i === 0 ? ' is-lead' : ''}"><span class="abx-pr__n">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}
    </div>
  </div>
</section>`;
}

function homeSection(cls) {
  const src = fs.readFileSync(path.join(ROOT, 'fx', 'partials', 'home-bottom.html'), 'utf8');
  const a = src.indexOf(`<section class="${cls}"`);
  let depth = 0;
  let i = a;
  const re = /<\/?section\b/g;
  re.lastIndex = a;
  let m;
  while ((m = re.exec(src))) {
    depth += m[0] === '<section' ? 1 : -1;
    if (depth === 0) { i = src.indexOf('>', m.index) + 1; break; }
  }
  return src.slice(a, i);
}

(async () => {
  const bundles = fs.readdirSync(path.join(ROOT, '_astro')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(ROOT, '_astro', f), 'utf8')).join('\n');
  const answer = (q) => {
    for (const open of ['`', '"']) {
      const key = `q:${open}${q}${open},a:${open}`;
      const i = bundles.indexOf(key);
      if (i !== -1) return bundles.slice(i + key.length, bundles.indexOf(open, i + key.length)).replace(/\\(.)/g, '$1');
    }
    return '';
  };
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const p = await b.newPage();
  await p.setJavaScriptEnabled(false);
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://localhost:3000/about/', { waitUntil: 'load', timeout: 60000 });
  const models = await p.evaluate(extract, 'astro-island[component-export="AboutUs"]');
  await b.close();

  const hide = models.map((m) => `${m.path} { display: none !important; }`);
  const fq = models.find((m) => m.kind === 'faq');
  const faqs = fq ? fq.faqs.map((f) => { const q = f.q.replace(/^\d{1,2}\s*/, ''); return { q, a: answer(q) }; }) : [];
  const ct = homeSection('ct').replace(/(<h2 class="ct__title"[^>]*>)[\s\S]*?(<\/h2>)/, '$1Stop managing your marketing and <em>start growing.</em>$2');

  fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'heroes', 'about.html'), hero() + '\n');
  fs.mkdirSync(path.join(ROOT, 'fx', 'partials', 'industry'), { recursive: true });
  // (No separate numbers band: the globe walks through the same figures.)
  fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'industry', 'about.top.html'), [`<style>${hide.join('\n')}</style>`, story(), alternatives(), economics()].join('\n') + '\n');
  fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'industry', 'about.bottom.html'), [
    principles(),
    homeSection('rv'),
    fq ? B.faq({ eyebrow: fq.eyebrow || 'No surprises', title: fq.title || 'Questions, <em>answered.</em>', lede: fq.lede, faqs }) : '',
    ct,
  ].join('\n') + '\n');
  console.log(`about: hid ${hide.length} original sections, ${faqs.length} FAQs (${faqs.filter((f) => f.a).length} answered)`);
})();

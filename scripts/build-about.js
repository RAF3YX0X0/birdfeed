// Builds the About page around its own story, in the homepage's language and
// with 3D motion throughout. Writes:
//   - fx/partials/heroes/about.html: the hero (the statement, and a 3D stack
//     of the layers the service is built from),
//   - fx/partials/industry/about.top.html: rules hiding the page's original
//     sections, then "who we are" (text that lights up as you read), four
//     commitments (a fanned 3D deck that MADMarketing's card rises out of)
//     and the six service families (a 3D ring of six cards),
//   - fx/partials/industry/about.bottom.html, after the 3D globe (fx.js keeps
//     placing it in the page's island): the MAD Method, the clients, the FAQ
//     and a closing call to action.
// The words are MADMarketing's own: the client's homepage copy, the MAD
// Method, and their services and rules (scripts/offer-data.js). Styles in
// fx/about.css, motion in fx/about.js.
//
//   node server.js &
//   NODE_PATH=<dir with puppeteer-core> node scripts/build-about.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { extract } = require('./build-sections.js');
const O = require('./offer-data');

// Answers about the offer, from the client's services and pricing
// (scripts/offer-data.js). The cloned page's own answers described another
// company's prices, services and terms; the rest of its answers still apply.
const PLAN_LINE = O.PLANS.map((p) => `${p.name} is ${O.money(p.price)} a month`).join(', ');
const ABOUT_ANSWERS = {
  'How much does MadMarketing cost?': `Our local SEO plans are priced per month: ${PLAN_LINE}. Everything beyond local SEO, from paid ads and social media to websites and automation, is quoted to your scope as ${O.FULL_GROWTH.name}. Eligible local businesses can start with the free 30-day challenge.`,
  'What services do you offer?': `Six families of services: ${O.FAMILIES.map((f) => `${f.name} (${f.services.map(([n]) => n).join(', ')})`).join('; ')}. Start with the one you need and add more when it makes business sense.`,
  'Which social channels do you support?': 'We set your channels in your channel strategy, from Instagram, Facebook and TikTok to LinkedIn, YouTube and your Google Business Profile.',
  'Is there a contract?': 'Each monthly plan starts with a written agreement that sets out billing, cancellation, service levels and deliverables, so you know the terms before you start. The free 30-day challenge never turns into a paid subscription without your explicit approval.',
  "What if I don't like the content?": 'You review the work before anything goes live, and your feedback goes into revisions. What each plan includes is set out in your written agreement.',
  'How do I get started, and how fast will I see content?': 'Book a 30-minute call, or, if you’re a local business with a verified Google Business Profile, apply for the free 30-day challenge. After the call we send you a scope and a quote, and once you approve it in writing, we start onboarding and agree the timeline for your first deliverables with you.',
  'How do I communicate with my team?': 'With your account team, by email and on calls. Your agreement sets out who does what and how often we report to you.',
  'Who is MadMarketing, and where are you based?': 'MADMarketing is a full-service digital marketing agency headquartered in St. Louis, Missouri, leading with local SEO and Google Maps visibility for US local businesses. Every marketer and creative on your account is vetted by our team.',
  'Is the content made by AI?': 'No. The work is made by real people on our team. Where we use AI-assisted tools, such as for drafting or workflow support, a person reviews the output, with privacy safeguards.',
  'What is your refund policy?': 'Billing, cancellation and refunds are set out in your written agreement before you pay anything, and our Refund & Cancellation Policy explains how it works. The free 30-day challenge has no agency fee and needs no credit card.',
};
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
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
};

// ---- Hero: the statement, and the layers the work is built on (the MAD Method) -------------
function hero() {
  const layers = [
    ['search', 'Market Intelligence', 'Research before direction'],
    ['star', 'Attention & Authority', 'Visibility and credibility'],
    ['chart', 'Data-Driven Growth', 'Measured, explained, refined'],
    ['pin', 'Your business', 'Easier to find, easier to choose'],
  ];
  const marks = ['M', 'A', 'D', '✓'];
  return `<section class="abx" aria-labelledby="abx-title">
  <div class="abx__bg" aria-hidden="true"><i></i><i></i></div>
  <div class="abx__in">
    <div class="abx__copy">
      <span class="sx-eyebrow"><i></i>About MADMarketing</span>
      <h1 class="abx__title" id="abx-title"><span class="abx__line"><span>Think MAD.</span></span> <span class="abx__line"><span>Grow <em>beyond ordinary.</em></span></span></h1>
      <p class="abx__sub"><b>Your next customer is already searching.</b> MADMarketing is a full-service digital marketing agency in St. Louis, leading with local SEO and Google Maps visibility for US local businesses, and helping them turn online attention into real opportunities.</p>
      <div class="abx__ctas"><a class="hx-btn hx-btn--blue" href="/free-local-seo/">Try 30 Days of Local SEO, Free</a><a class="hx-btn hx-btn--white" href="/services/">Explore our services</a></div>
      <p class="abx__trust">100+ businesses served · 10 client case studies</p>
    </div>
    <div class="abx__stage" aria-hidden="true">
      <div class="abx-stack">${layers.map(([ic, name, line], i) => `
        <div class="abx-layer${i === layers.length - 1 ? ' is-top' : ''}" style="--i:${i}"><div class="abx-layer__face"><span class="abx-layer__ic">${svg(I[ic], 22)}</span><span class="abx-layer__txt"><b>${name}</b><small>${line}</small></span><span class="abx-layer__n">${marks[i]}</span></div><span class="abx-layer__edge"></span></div>`).join('')}
        <span class="abx-stack__shadow"></span>
      </div>
    </div>
  </div>
</section>`;
}

// ---- Who we are: text that lights up as you read ------------------------------------------------
function story() {
  const paras = [
    'MADMarketing is a full-service digital marketing agency headquartered in St. Louis, Missouri. We lead with local SEO and Google Maps visibility, because that’s where customers who are ready to buy are already looking.',
    'A good-looking website or a busy social feed isn’t the finish line. What matters is whether the right people discover your business, understand why you’re different, and take action. So we connect search visibility, paid acquisition, persuasive creative and measurement into one practical growth system.',
    'We care about qualified traffic, calls, booked appointments, lead quality and conversion rates, not vanity metrics. And every report says what was done, what changed and what comes next.',
  ];
  const words = (t) => t.split(/\s+/).map((w) => `<span class="abx-w">${esc(w)}</span>`).join(' ');
  return `<section class="nx nx--light abx-story" data-fx-skip>
  <div class="nx__in">
    <div class="abx-story__side"><span class="nx__eyebrow">Who we are</span><h2 class="nx__title">Marketing should move your business <em>forward.</em></h2><span class="abx-story__year" aria-hidden="true">100+</span></div>
    <div class="abx-story__text">${paras.map((t) => `<p>${words(t)}</p>`).join('')}</div>
  </div>
</section>`;
}

// ---- How we work with you: four commitments (the client's commercial rules), a fanned
// deck that MADMarketing's card rises out of ------------------------------------------------------
function alternatives() {
  const cards = [
    ['Your accounts', 'Yours', 'always', 'You own your business profiles and advertising accounts. We work through role-based access and never ask for your passwords.', 'Ownership'],
    ['Our agreements', 'Written', 'before you pay', 'Every plan starts with a written agreement that sets out billing, cancellation, service levels and deliverables.', 'Clarity'],
    ['Our promises', 'Honest', 'no guaranteed rankings', 'We don’t promise Google positions, AI mentions, traffic, ROAS or leads. We guarantee the agreed work and transparent reporting.', 'Transparency'],
    ['Your free trial', '$0', 'agency fee, 30 days', 'The 30-day challenge needs no credit card and never turns into a paid subscription without your explicit approval.', 'No surprises'],
  ];
  return `<section class="nx nx--light abx-alts" data-fx-skip>
  <div class="abx-alts__pin">
    <div class="nx__in abx-alts__stage">
      <header class="nx__head"><span class="nx__eyebrow">How we work with you</span><h2 class="nx__title">Four commitments, <em>on every account.</em></h2><p class="nx__lede">The rules we work by, whichever service you start with.</p></header>
      <div class="abx-deck">${cards.map(([k, big, unit, text, tag], i) => `
        <article class="abx-card" style="--i:${i}"><span class="abx-card__k">${esc(k)}</span><b class="abx-card__big">${esc(big)}</b><small class="abx-card__unit">${esc(unit)}</small><p>${esc(text)}</p><span class="abx-card__tag">${esc(tag)}</span></article>`).join('')}
        <article class="abx-card abx-card--us"><span class="abx-card__k">MADMarketing</span><b class="abx-card__big">One partner. <em>Multiple ways to grow.</em></b><p>Start with local SEO and Google Maps visibility. When your search foundations are strong, the same team supports the next chapter: paid search, social advertising, creative content, landing pages, automation and ongoing SEO.</p><span class="abx-card__chips"><i>Six service families</i><i>Local SEO from ${O.money(O.FROM)}/mo</i><i>Free 30-day challenge</i><i>St. Louis, MO</i></span></article>
      </div>
    </div>
  </div>
</section>`;
}

// ---- What we do: the six service families on a ring that turns with the scroll ------------------
function economics() {
  const items = O.FAMILIES.map((f) => [f.name, `${f.tag}: ${f.services.map(([n]) => n).join(', ')}.`]);
  return `<section class="nx nx--light abx-eco" data-fx-skip>
  <div class="abx-eco__pin">
    <div class="nx__in abx-eco__stage">
      <div class="abx-eco__side">
        <span class="nx__eyebrow">What we do</span>
        <h2 class="nx__title">Six ways we help you <em>grow.</em></h2>
        <p class="nx__lede">Local SEO and Google Maps visibility come first. The rest is there when it makes business sense, under one partner. <a href="/services/">See every service</a>.</p>
        <p class="abx-eco__count" aria-hidden="true"><b>01</b><span>/ 0${items.length}</span></p>
      </div>
      <div class="abx-ring"><div class="abx-ring__track">${items.map(([t, d], i) => `
        <article class="abx-face" style="--i:${i}"><span class="abx-face__n">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}
      </div></div>
    </div>
  </div>
</section>`;
}

// ---- The MAD Method, and the standard behind it ---------------------------------------------------
function principles() {
  const items = [
    ['M', 'Market Intelligence', 'We study search behavior, customer needs, competitors, and opportunities before choosing a direction.'],
    ['A', 'Attention & Authority', 'We build visibility and credibility through search, content, advertising, and brand experiences.'],
    ['D', 'Data-Driven Growth', 'We measure meaningful actions, explain performance, and refine the work that matters.'],
    ['✓', 'Ethical by default', 'Genuine reviews only, legitimate link outreach, permission-based messages, and case studies only with our clients’ authorization.'],
  ];
  return `<section class="nx nx--light abx-prin" data-fx-skip>
  <div class="nx__in">
    <header class="nx__head"><span class="nx__eyebrow">How we work</span><h2 class="nx__title">The MAD Method, <em>and the standard behind it.</em></h2></header>
    <div class="abx-prin__grid">${items.map(([n, t, d], i) => `
      <article class="abx-pr${i === 0 ? ' is-lead' : ''}"><span class="abx-pr__n">${n}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}
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
  const faqs = fq ? fq.faqs.map((f) => { const q = f.q.replace(/^\d{1,2}\s*/, ''); return { q, a: ABOUT_ANSWERS[q] || answer(q) }; }) : [];
  const ct = homeSection('ct').replace(/(<h2 class="ct__title"[^>]*>)[\s\S]*?(<\/h2>)/, '$1Your business deserves to be <em>easier to find.</em>$2');

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

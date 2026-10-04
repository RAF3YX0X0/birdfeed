// Builds the industry pages (social-media-management-for-*): every section is
// about that industry. From each page's original (server markup) it keeps the
// industry's own pain points, FAQs (answers from the bundles) and closing
// headline; the rest comes from scripts/industry-content.js and the real
// portfolio and case studies. Writes fx/partials/industry/<slug>.top.html
// (before the page's React island: a <style> hiding every original section
// except the pricing builder, then the new sections) and .bottom.html (after
// it); inject-fx.js puts them in. The funnel (fx/funnel.js) and the pricing
// builder stay in the island, between the two.
//
//   node server.js &
//   NODE_PATH=<dir with puppeteer-core> node scripts/build-industries.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { extract } = require('./build-sections.js');
const B = require('./render-blocks.js');
const CONTENT = require('./industry-content.js');
const ANSWERS = require('./industry-faq.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'fx', 'partials', 'industry');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// FAQ answers live in the bundles' data as {q:`…`,a:`…`}.
const bundles = fs.readdirSync(path.join(ROOT, '_astro')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(ROOT, '_astro', f), 'utf8')).join('\n');
function answer(q) {
  for (const open of ['`', '"']) {
    const key = `q:${open}${q}${open},a:${open}`;
    const i = bundles.indexOf(key);
    if (i !== -1) return bundles.slice(i + key.length, bundles.indexOf(open, i + key.length)).replace(/\\(.)/g, '$1');
  }
  return '';
}

// The homepage's closing call to action, with this page's headline.
function cta(heading) {
  const src = fs.readFileSync(path.join(ROOT, 'fx', 'partials', 'home-bottom.html'), 'utf8');
  const a = src.indexOf('<section class="ct"');
  const html = src.slice(a, src.indexOf('</section>', a) + '</section>'.length);
  if (!heading) return html;
  const words = heading.replace(/\s+/g, ' ').trim().split(' ');
  const k = words.length > 5 ? 3 : 2;
  const title = `${B.esc(words.slice(0, -k).join(' '))} <em>${B.esc(words.slice(-k).join(' '))}</em>`;
  return html.replace(/(<h2 class="ct__title"[^>]*>)[\s\S]*?(<\/h2>)/, `$1${title}$2`);
}

(async () => {
  const { PORTFOLIO } = await import(require('url').pathToFileURL(path.join(ROOT, 'fx', 'portfolio-data.js')).href);
  const CASES = JSON.parse(fs.readFileSync(path.join(ROOT, 'fx', 'cases.json'), 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const p = await b.newPage();
  await p.setJavaScriptEnabled(false);
  await p.setViewport({ width: 1440, height: 900 });

  for (const [slug, d] of Object.entries(CONTENT)) {
    await p.goto(`http://localhost:3000/${slug}/`, { waitUntil: 'load', timeout: 60000 });
    const models = await p.evaluate(extract);
    const pains = (models.find((m) => !m.skip && m.kind === 'bento' && m.items.length >= 2 && m.items.every((it) => it.title && it.text)) || { items: [] }).items.slice(0, 3);
    const fq = models.find((m) => !m.skip && m.kind === 'faq');
    const ctaHead = (models.filter((m) => m.skip === 'shared' && /ready|let.s|fill|handled/i.test(m.heading)).pop() || {}).heading;
    const hide = models.filter((m) => m.skip !== 'builder').map((m) => `${m.path} { display: none !important; }`);

    // Real work for this industry.
    const posts = PORTFOLIO.posts
      .filter((x) => x.ind === d.work.ind && (!d.work.subs || !d.work.subs.length || d.work.subs.includes(x.sub)))
      .filter((x) => { const id = x.img.split('/').pop().replace(/\.\w+$/, ''); return (!d.work.only || d.work.only.includes(id)) && (!d.work.not || !d.work.not.includes(id)); })
      .sort((a, z) => (z.f || 0) - (a.f || 0))
      .slice(0, 14);
    const caseList = d.cases ? d.cases.slugs.map((s) => CASES.find((c) => c.slug === s)).filter(Boolean) : [];

    const top = [
      `<style>${hide.join('\n')}</style>`,
      pains.length ? B.pains(d, pains) : '',
      B.calendar(d),
      B.work(posts, { title: `Made for <em>${B.esc(d.name)}.</em>`, lede: `Real posts our team has made for ${d.name}.` }),
      B.platforms(d),
    ].join('\n');
    const bottom = [
      B.year(d),
      B.rules(d),
      B.track(d),
      caseList.length ? B.cases(caseList, d.cases.label) : '',
      fq ? B.faq({ eyebrow: fq.eyebrow, title: fq.title || 'Questions, <em>answered.</em>', lede: fq.lede, faqs: fq.faqs.map((f) => { const q = f.q.replace(/^\d{1,2}\s*/, ''); return { q, a: answer(q) || answer(f.q) || ANSWERS[q] || '' }; }) }) : '',
      cta(ctaHead),
    ].join('\n');
    fs.writeFileSync(path.join(OUT, `${slug}.top.html`), top);
    fs.writeFileSync(path.join(OUT, `${slug}.bottom.html`), bottom);
    console.log(slug.replace('social-media-management-for-', '').padEnd(16), `pains ${pains.length}, work ${posts.length}, cases ${caseList.length}, faqs ${fq ? fq.faqs.length : 0}, hidden ${hide.length}, cta "${ctaHead || ''}"`);
  }
  await b.close();
})();

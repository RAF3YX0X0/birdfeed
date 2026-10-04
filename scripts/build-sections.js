// Rebuilds the cloned sections of the service, category, industry and
// services pages in the site's design. Their markup belongs to React, so it
// isn't edited: each section is read from the page's server markup (JS off,
// exactly what React hydrates), turned into a small content model (label,
// heading, intro, items with icon / title / text / figure / link, comparison
// rows, FAQs, and any custom visual, which is kept as is), and written out in
// one of a few new layouts to fx/partials/sections/<slug>.html:
//   - a <style> that hides the originals while JavaScript runs,
//   - a <template id="fx-nx"> with the rebuilt sections, which fx/sections.js
//     swaps in once React has hydrated the page (inject-fx.js embeds both).
// Sections we built ourselves (hero, funnel, 3D explainers, the rebuilt
// shared sections, the pricing builder) and interactive ones are left alone.
//
//   node server.js &
//   NODE_PATH=<dir with puppeteer-core> node scripts/build-sections.js [slug...]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'fx', 'partials', 'sections');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ISLANDS = /component-export="(ServicePage|CategoryPage|IndustryPage|AllServices)"/;

// Runs in the page (server markup): every top-level section of the page's
// island, modelled. `skip` says why a section is left as it is.
function extract() {
  const island = document.querySelector('astro-island[component-export$="Page"], astro-island[component-export="AllServices"]');
  if (!island) return null;
  const SHARED = [/publishing everywhere your customers/i, /receive full deliverables/i, /truly great content/i, /not happy with your first batch/i, /every other way costs more/i, /real businesses\.?\s*real results/i, /real results, in their/i, /ready to get social media off your plate|let.s fill your calendar|fill your calendar with booked jobs/i];
  const CTA_CARD = '.ccta-card, .fbe-cta-card, .sbcta, .pro-cta-card, .rs-cta-card';
  const all = [...island.querySelectorAll('section')].filter((s) => !s.parentElement.closest('section'));
  // Text without the CSS of <style> tags inside sections.
  const T = (n) => { if (!n) return ''; const c = n.cloneNode(true); c.querySelectorAll('style, script').forEach((x) => x.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
  const words = (s) => (s ? s.split(' ').filter(Boolean).length : 0);
  const leaves = (root) => [root, ...root.querySelectorAll('*')].filter((e) => !['SCRIPT', 'STYLE', 'svg', 'path'].includes(e.tagName) && e.closest('svg') === null && !e.closest('[aria-hidden="true"]') && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()));
  const cs = (e) => getComputedStyle(e);
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs(e).visibility !== 'hidden'; };
  // Heading HTML: accent words (serif / coloured spans) become <em>.
  const headHTML = (h) => {
    const c = h.cloneNode(true);
    c.querySelectorAll('span').forEach((sp) => {
      const st = sp.getAttribute('style') || '';
      const accent = /serif|italic|color:\s*(#3B5BFF|#0029FF|rgb\(0,\s*41)/i.test(st) || sp.hasAttribute('data-fx-accent');
      if (accent) { const em = document.createElement('em'); em.textContent = sp.textContent; sp.replaceWith(em); } else sp.replaceWith(...sp.childNodes);
    });
    c.querySelectorAll('*:not(em):not(br)').forEach((x) => x.replaceWith(...x.childNodes));
    return c.innerHTML.replace(/<!--.*?-->/g, '').replace(/\s+/g, ' ').trim();
  };
  const svgHTML = (svg) => {
    if (!svg) return '';
    const c = svg.cloneNode(true);
    c.removeAttribute('class');
    c.removeAttribute('style');
    c.setAttribute('aria-hidden', 'true');
    return c.outerHTML;
  };
  // Check / cross in a comparison cell.
  const mark = (cell) => {
    const t = T(cell);
    if (t && !/^[✓✔✗✕×—–-]$/.test(t)) return t;
    if (/^[✓✔]$/.test(t)) return true;
    if (/^[✗✕×]$/.test(t)) return false;
    const svg = cell.querySelector('svg');
    if (!svg) return t || '';
    const d = [...svg.querySelectorAll('path, polyline, line')].map((p) => p.getAttribute('d') || p.getAttribute('points') || 'x').join(' ');
    if (/[lL]\s*-?\d|polyline|^m?\s*[\d.]+\s+1[0-9]/i.test(d) && /5 12|m5 12|M20 6|m4 12|9 17|M5 13/i.test(d)) return true;
    const col = cs(svg).color + cs(cell).color + (svg.getAttribute('stroke') || '');
    if (/220,\s*38|225,\s*29|190,\s*18|#E11D48|#DC2626|#EF4444|rgb\(1[3-9]\d,\s*1[3-9]\d/i.test(col) || svg.querySelectorAll('line').length === 2 || /M18 6|m18 6|6 6l12 12|M6 6/i.test(d)) return false;
    return true;
  };

  // CSS path to a section. The last step counts only original sections, so it
  // still holds once our sections are inserted beside them at runtime.
  const OURS = '.nx, .tr, .hw, .pf, .gx, .cx, .pj, .rv, .ct, [class^="fx-"], [class*=" fx-"]';
  const pathOf = (el) => {
    const parts = [];
    for (let n = el.parentElement; n && n !== island; n = n.parentElement) parts.unshift(`${n.tagName.toLowerCase()}:nth-child(${[...n.parentElement.children].indexOf(n) + 1})`);
    const k = [...el.parentElement.children].filter((c) => c.tagName === 'SECTION').indexOf(el) + 1;
    return `astro-island[component-export="${island.getAttribute('component-export')}"] > ${[...parts, `section:nth-child(${k} of section:not(${OURS}))`].join(' > ')}`;
  };
  return all.map((s, index) => {
    const base = { index, path: pathOf(s), heading: T(s.querySelector('h1, h2')).slice(0, 120) };
    if (cs(s).display === 'none' || !vis(s)) return { ...base, skip: 'hidden' };
    const html = s.outerHTML;
    if (SHARED.some((re) => re.test(T(s.querySelector('h2')) || T(s).slice(0, 300))) || s.matches(CTA_CARD) || s.querySelector(CTA_CARD)) return { ...base, skip: 'shared' };
    if (s.querySelector('.sh-builder-grid')) return { ...base, skip: 'builder' };
    if (s.querySelector('h1')) return { ...base, skip: 'hero' };
    if (s.querySelector('input, select, textarea, iframe, [role="tab"], [role="tablist"]')) return { ...base, skip: 'interactive' };

    const h2 = s.querySelector('h2');
    const m = { ...base, kind: '', eyebrow: '', title: h2 ? headHTML(h2) : '', lede: '', items: [], rows: [], cols: [], faqs: [], groups: [], visual: '', cta: null, note: '' };
    const eb = leaves(s).find((e) => /^\s*\/\/\s*\S/.test(e.textContent) && T(e).length < 60);
    if (eb) m.eyebrow = T(eb).replace(/^\/\/\s*/, '');

    // Service catalogue (the services page): priced service cards, grouped
    // under "01 · Category" headers.
    const priced = [...s.querySelectorAll('a[href]')].filter((a) => /\$\s?\d/.test(T(a)) && a.querySelector('p'));
    if (priced.length >= 3) {
      m.kind = 'catalog';
      const byGroup = new Map();
      priced.forEach((a) => {
        let g = a.parentElement;
        while (g && g !== s && !leaves(g).some((e) => /^\d{2}\s*·/.test(T(e)))) g = g.parentElement;
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g).push(a);
      });
      for (const [g, cards] of byGroup) {
        const lab = g && g !== s ? leaves(g).find((e) => /^\d{2}\s*·/.test(T(e))) : null;
        const p = g && lab ? [...g.querySelectorAll('p')].find((x) => !cards.some((c) => c.contains(x))) : null;
        const all = g && lab ? [...g.querySelectorAll('a[href]')].find((x) => !cards.includes(x) && !cards.some((c) => c.contains(x))) : null;
        const count = g && lab ? leaves(g).find((e) => /^\d+\s+services?$/i.test(T(e))) : null;
        m.groups.push({
          label: lab ? T(lab) : '',
          text: p ? T(p) : '',
          count: count ? T(count) : '',
          href: all ? all.getAttribute('href') : '',
          services: cards.map((a) => {
            const L = leaves(a);
            const badge = L.find((e) => /popular|new|best/i.test(T(e)) && T(e).length < 20);
            const name = L.find((e) => e !== badge && parseFloat(cs(e).fontWeight) >= 600 && !/\$|save|from|\/mo/i.test(T(e)));
            const price = L.find((e) => /^\$[\d,]+$/.test(T(e)));
            const unit = price && price.nextElementSibling ? T(price.nextElementSibling) : '';
            const save = L.find((e) => /^save\s+\d+%$/i.test(T(e)));
            const was = a.querySelector('s, del');
            return { href: a.getAttribute('href'), badge: badge ? T(badge) : '', name: name ? T(name) : '', text: T(a.querySelector('p')), price: price ? T(price) : '', unit, save: save ? T(save) : '', was: was ? T(was) : '', icon: svgHTML(a.querySelector('svg')) };
          }),
        });
      }
      return m;
    }

    // FAQ: question buttons (answers come from the bundles, see below).
    const qs = [...s.querySelectorAll('button')].map((b) => T(b)).filter((q) => /\?\s*[+−-]?$/.test(q) || q.length > 12);
    if (/question|faq|answered/i.test(m.heading) && qs.length >= 2) {
      m.kind = 'faq';
      m.faqs = qs.map((q) => ({ q: q.replace(/\s*[+−–-]\s*$/, '').trim() }));
      const p = [...s.querySelectorAll('p')].find((x) => !x.closest('button') && words(T(x)) > 5 && !m.faqs.some((f) => T(x).includes(f.q)));
      if (p && !h2.parentElement.contains(p)) { /* first answer (open) */ } else if (p) m.lede = T(p);
      return m;
    }
    if (s.querySelector('button:not([aria-label])')) {
      const btns = [...s.querySelectorAll('button')].filter((b) => T(b));
      if (btns.length) return { ...base, skip: 'interactive' };
    }

    // The section's repeated items: the largest group of same-shaped siblings.
    let best = null;
    const found = [];
    s.querySelectorAll('*').forEach((el) => {
      if (el.closest('svg') || (h2 && (h2.contains(el) || el.contains(h2)))) return;
      const kids = [...el.children].filter((c) => !['SCRIPT', 'STYLE', 'BR'].includes(c.tagName) && vis(c));
      if (kids.length < 2) return;
      const sig = (c) => c.tagName + '>' + [...c.children].filter((x) => x.tagName !== 'STYLE').map((x) => x.tagName).join(',');
      const groups = {};
      kids.forEach((c) => { (groups[sig(c)] = groups[sig(c)] || []).push(c); });
      const [, members] = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0];
      const textual = members.filter((c) => words(T(c)) >= (members.length >= 4 ? 1 : 2) || c.querySelector('img'));
      if (textual.length < 2) return;
      const score = textual.length * 10 + Math.min(200, words(T(el)));
      found.push({ score, el, members: textual });
      if (!best || score > best.score) best = { score, el, members: textual };
    });
    const apart = (g) => g !== best && !g.el.contains(best.el) && !best.el.contains(g.el) && !g.members.some((x) => best.members.some((b) => b.contains(x) || x.contains(b)));
    // (Not a row of links: those are the section's buttons.)
    const linksOnly = (g) => g.members.every((x) => x.matches('a') || (x.querySelector('a') && words(T(x.querySelector('a'))) >= words(T(x)) - 1));
    const second = best ? found.filter((g) => apart(g) && !linksOnly(g) && words(T(g.el)) >= 15 && g.members.length >= 2 && g.members.every((x) => words(T(x)) >= 3)).sort((a, b) => b.score - a.score)[0] : null;

    // Intro: the first paragraph (or text block) outside the items.
    const inItems = (e) => (best && best.members.some((c) => c.contains(e))) || (second && second.members.some((c) => c.contains(e)));
    const after = (e) => !h2 || (h2.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
    // Intro paragraphs (up to three) outside the items; else the first text block.
    const paras = [...s.querySelectorAll('p')].filter((e) => !inItems(e) && (!h2 || !h2.contains(e)) && words(T(e)) >= 7 && after(e) && !e.closest('h3') && (!h2 || h2.parentElement.contains(e)));
    const lede = paras.length ? null : [...s.querySelectorAll('p, div, span')].find((e) => !inItems(e) && (!h2 || !h2.contains(e)) && e !== eb && !e.querySelector('p, div, h3, h2') && words(T(e)) >= 7 && after(e));
    if (paras.length) m.lede = paras.slice(0, 3).map(T).join('\n\n');
    else if (lede) m.lede = T(lede);

    // Button / link outside the items.
    const a = [...s.querySelectorAll('a[href]')].find((x) => !inItems(x) && T(x).length > 2 && T(x).length < 40);
    if (a) m.cta = { label: T(a).replace(/[→↗›]/g, '').trim(), href: a.getAttribute('href') };

    // Comparison: rows of 3+ cells, or a "vs" heading.
    // Rows of 3+ short cells, all the same width, read as a comparison too.
    const cellsOf = (r) => [...r.children].filter((c) => c.tagName !== 'STYLE');
    const sameCells = best && best.members.length >= 3 && best.members.every((r) => cellsOf(r).length >= 3 && cellsOf(r).length === cellsOf(best.members[0]).length && cellsOf(r).every((c) => words(T(c)) <= 12))
      && !best.members.some((r) => r.matches('a') || r.querySelector('a'))
      && (/madmarketing|with us|diy|agency|freelanc/i.test(T(best.el)) || best.members.some((r) => cellsOf(r).some((c) => !T(c) && c.querySelector('svg'))));
    const isCompare = /\bvs\.?\b|versus|alternatives|yourself|difference between|beats/i.test(m.heading) || sameCells;
    if (best && isCompare) {
      const rows = best.members.map((r) => [...r.children].filter((c) => c.tagName !== 'STYLE'));
      if (rows.every((r) => r.length >= 2)) {
        m.kind = 'compare';
        // A header row just before the rows (same number of cells), if any.
        const prev = best.members[0].previousElementSibling || best.el.previousElementSibling;
        const headRow = prev && cellsOf(prev).length === rows[0].length ? cellsOf(prev).map(T) : null;
        const first = rows[0].map(mark);
        if (headRow) m.cols = headRow;
        else if (first.every((x) => typeof x === 'string')) { m.cols = first; rows.shift(); }
        m.rows = rows.map((r) => r.map(mark));
        return m;
      }
    }

    const modelItem = (it) => {
        const item = { title: '', text: '', stat: '', icon: '', img: '', href: '', bullets: [], tag: '' };
        const L = leaves(it);
        const h = it.querySelector('h3, h4, h5, strong, b');
        const big = L.find((e) => parseFloat(cs(e).fontSize) >= 26 && T(e).length <= 14 && /[\d$%×x+]/.test(T(e)));
        if (big) item.stat = T(big);
        const titleEl = h || L.find((e) => e !== big && parseFloat(cs(e).fontWeight) >= 600 && T(e).length > 2 && T(e).length < 90 && words(T(e)) <= 14 && parseFloat(cs(e).fontSize) >= 13);
        if (titleEl) item.title = T(titleEl);
        item.bullets = [...it.querySelectorAll('li')].map(T).filter(Boolean);
        // Or a run of 3+ short lines with a check icon each, written as divs.
        let bulletBox = null;
        if (!item.bullets.length) {
          bulletBox = [...it.querySelectorAll('div, ul')].find((d) => d.children.length >= 3 && [...d.children].every((c) => c.querySelector('svg') && words(T(c)) >= 2 && words(T(c)) <= 16));
          if (bulletBox) item.bullets = [...bulletBox.children].map(T);
        }
        const rest = L.filter((e) => e !== big && e !== titleEl && !(titleEl && titleEl.contains(e)) && !e.closest('li') && !(bulletBox && bulletBox.contains(e)) && (!big || !big.contains(e)));
        const tagEl = rest.find((e) => (/uppercase/.test(cs(e).textTransform) || /^(step|day|days|week|weeks|month|months|phase|stage)\b/i.test(T(e))) && T(e).length < 30);
        if (tagEl) item.tag = T(tagEl);
        // Body text from the item's paragraphs; without any, its longest line
        // (decorative bits of mockups, like initials or "!", are left out).
        const ps = [...it.querySelectorAll('p')].filter((p) => p !== titleEl && !(titleEl && titleEl.contains(p)) && !p.closest('li') && words(T(p)) >= 3);
        const lines = rest.filter((e) => e !== tagEl && parseFloat(cs(e).fontSize) >= 12).map(T).filter((t) => t && t !== item.title).sort((x, y) => y.length - x.length);
        item.text = (ps.length ? ps.map(T) : lines.filter((t) => words(t) >= 4).slice(0, 1)).join(' ').replace(/\s+/g, ' ').trim();
        // A short label ("Businesses served") when there's no sentence.
        if (!item.text && lines.length) item.text = lines[0];
        // Red icons mark a problem ("Sound familiar?"), not a benefit.
        item.neg = [...it.querySelectorAll('svg')].some((x) => /#C0392B|#DC2626|#E11D48|#EF4444|#B91C1C|rgb\((1[89]\d|2[0-5]\d),\s*([0-6]?\d),\s*([0-6]?\d)\)/i.test((x.getAttribute('stroke') || '') + (x.getAttribute('fill') || '') + cs(x).color));
        if (big && !item.title) { const lab = rest.find((e) => e !== tagEl && words(T(e)) >= 1 && words(T(e)) <= 8); if (lab) item.title = T(lab); }
        if (!item.title && words(item.text) <= 12) { item.title = item.text; item.text = ''; }
        const svg = [...it.querySelectorAll('svg')].find((x) => { const r = x.getBoundingClientRect(); return r.width <= 56 && r.width >= 10; });
        item.icon = svgHTML(svg);
        const img = it.querySelector('img');
        if (img) item.img = img.getAttribute('src');
        const link = it.closest('a[href]') || it.querySelector('a[href]');
        if (link) item.href = link.getAttribute('href');
        return item;
    };
    const useful = (it) => it.title || it.text || it.img;
    if (best) m.items = best.members.map(modelItem).filter(useful);
    // A second, separate group of items (e.g. team roles, then the process).
    if (second) {
      m.items2 = second.members.map(modelItem).filter(useful);
      m.kind2 = m.items2.filter((it) => /^\d{1,2}$|^(step|day|week|month)/i.test(it.tag || it.stat || '')).length >= 2 || /^\s*\d\s/.test(T(second.members[0])) ? 'steps' : 'bento';
      // A leading "1", "2"… is the step number, not the title.
      if (m.kind2 === 'steps') m.items2.forEach((it) => { if (/^\d{1,2}$/.test(it.stat)) it.stat = ''; if (/^\d{1,2}$/.test(it.title)) { it.title = it.text; it.text = ''; } });
    }

    // Second reading for sections built as blocks (an h3 with its label,
    // paragraphs and bullets) rather than as repeated cards; whichever
    // reading keeps more of the original's words wins.
    const h3s = [...s.querySelectorAll('h3')].filter((h) => !(h2 && h2.contains(h)));
    if (h3s.length >= 2) {
      const itemWords = (list) => words(list.map((it) => `${it.tag} ${it.stat} ${it.title} ${it.text} ${it.bullets.join(' ')}`).join(' '));
      const blocks = h3s.map((h) => {
        const item = { title: T(h), text: '', stat: '', icon: '', img: '', href: '', bullets: [], tag: '', neg: false };
        // Its block: the h3's parent, or higher while that holds only this h3.
        let box = h.parentElement;
        while (box.parentElement && box.parentElement !== s && box.parentElement.querySelectorAll('h3').length === 1) box = box.parentElement;
        const prev = h.previousElementSibling;
        if (prev && words(T(prev)) <= 8 && !prev.querySelector('h3')) item.tag = T(prev);
        const paras = [...box.querySelectorAll('p')].filter((p) => !p.closest('li'));
        item.text = paras.map(T).join(' ');
        const bul = [...box.querySelectorAll('div, ul')].find((d) => d.children.length >= 3 && [...d.children].every((c) => c.tagName !== 'P' && words(T(c)) >= 2 && words(T(c)) <= 18 && !c.querySelector('p, h3')));
        if (bul) item.bullets = [...bul.children].map(T);
        item.icon = svgHTML([...box.querySelectorAll('svg')].find((x) => { const r = x.getBoundingClientRect(); return r.width >= 14 && r.width <= 56 && !(bul && bul.contains(x)); }));
        return item;
      });
      if (itemWords(blocks) > itemWords(m.items) * 1.15) {
        m.items = blocks;
        if (second && h3s.some((h) => second.members.some((x) => x.contains(h)))) delete m.items2;
      }
    }
    // Drop the second group if it's empty or the first already says it.
    if (m.items2) {
      const said = m.items.map((it) => `${it.title} ${it.text} ${it.bullets.join(' ')}`).join(' ');
      const repeats = m.items2.filter((it) => (it.title || it.text) && said.includes(it.title || it.text)).length;
      if (m.items2.length < 2 || repeats >= m.items2.length / 2) { delete m.items2; delete m.kind2; }
    }

    // A custom visual (chart, mockup, map) worth keeping: a big block that
    // isn't the items and isn't text.
    const visual = [...s.querySelectorAll('div, svg, figure')].find((e) => {
      if ((best && (best.el.contains(e) || e.contains(best.el))) || (h2 && (e.contains(h2) || h2.contains(e)))) return false;
      const r = e.getBoundingClientRect();
      return r.height >= 180 && r.width >= 260 && words(T(e)) <= 40 && (e.querySelector('svg, img') || e.querySelectorAll('span').length > 6);
    });
    if (visual && (!m.items.length || m.items.length <= 4)) {
      const c = visual.cloneNode(true);
      c.querySelectorAll('script, style').forEach((x) => x.remove());
      m.visual = c.outerHTML.replace(/<!--.*?-->/g, '');
    }

    const titled = m.items.filter((it) => it.title).length;
    const avgWords = m.items.reduce((n, it) => n + words(it.text), 0) / Math.max(1, m.items.length);
    const short = m.items.every((it) => words(`${it.stat} ${it.title} ${it.text}`) <= 9);
    if (!m.items.length) m.kind = 'statement';
    else if (!h2 && m.items.length >= 2 && m.items.length <= 6 && short) {
      // A heading-less strip of figures ("20,000+ / Businesses served").
      m.kind = 'stats';
      m.items.forEach((it) => { if (!it.stat) { it.stat = it.title; it.title = it.text; it.text = ''; } else if (!it.title) { it.title = it.text; it.text = ''; } });
    }
    else if (m.kind) { /* set above */ }
    else if (m.items.every((it) => it.img) && m.items.length >= 3) m.kind = 'gallery';
    else if (m.items.filter((it) => it.stat).length >= Math.max(2, m.items.length - 1) && avgWords < 14) m.kind = 'stats';
    else if (/step|stage|week|day|sprint|signup|kickoff|how it works|process|from .* to|brief us|subscribe/i.test(m.heading) || m.items.filter((it) => /^(step|day|week|month)\s*\d|^0?\d\b/i.test(it.tag || it.stat || '')).length >= 2) m.kind = 'steps';
    else if (m.items.every((it) => it.href)) m.kind = 'links';
    else if (m.items.length >= 6 && avgWords < 6) m.kind = 'chips';
    else if (titled < m.items.length / 2 && avgWords < 22) m.kind = 'chips';
    else m.kind = 'bento';
    // A list of problems: most items carry the original's red icon.
    m.neg = m.items.length >= 2 && m.items.filter((it) => it.neg).length >= m.items.length / 2;

    // Safety net: if the rebuilt version would drop much of the original's
    // words (content we couldn't read), keep the original section.
    const kept = [m.eyebrow, m.title.replace(/<[^>]+>/g, ' '), m.lede, m.cta ? m.cta.label : '', ...[...m.items, ...(m.items2 || [])].map((it) => `${it.tag} ${it.stat} ${it.title} ${it.text} ${it.bullets.join(' ')}`)].join(' ');
    const visualWords = m.visual ? words(m.visual.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')) : 0;
    const coverage = (words(kept) + visualWords) / Math.max(1, words(T(s)));
    m.coverage = Math.round(coverage * 100);
    if (coverage < 0.58) return { ...base, skip: `lossy ${m.coverage}%`, wouldBe: m.kind };
    return m;
  });
}

module.exports = { extract };

if (require.main === module) {
  (async () => {
    const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
    const slugs = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory() && fs.existsSync(path.join(ROOT, e.name, 'index.html')))
      .map((e) => e.name).filter((s) => ISLANDS.test(fs.readFileSync(path.join(ROOT, s, 'index.html'), 'utf8')))
      .filter((s) => !only.length || only.includes(s));
    const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
    const p = await b.newPage();
    await p.setJavaScriptEnabled(false);
    await p.setViewport({ width: 1440, height: 900 });
    const models = {};
    for (const slug of slugs) {
      await p.goto(`http://localhost:3000/${slug}/`, { waitUntil: 'load', timeout: 60000 });
      models[slug] = await p.evaluate(extract);
    }
    await b.close();
    fs.writeFileSync(path.join(ROOT, 'fx', 'partials', 'sections.models.json'), JSON.stringify(models, null, 1));

    // FAQ answers: only the open one is in the markup; the rest are in the
    // bundles' data as {q:`…`,a:`…`}.
    const bundles = fs.readdirSync(path.join(ROOT, '_astro')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(ROOT, '_astro', f), 'utf8')).join('\n');
    const answer = (q) => {
      for (const open of ['`', '"']) {
        const key = `q:${open}${q}${open},a:${open}`;
        const i = bundles.indexOf(key);
        if (i !== -1) {
          const start = i + key.length;
          return bundles.slice(start, bundles.indexOf(open, start)).replace(/\\n/g, ' ').replace(/\\(.)/g, '$1');
        }
      }
      return '';
    };

    const { renderSection } = require('./render-sections.js');
    fs.mkdirSync(OUT, { recursive: true });
    for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));
    let built = 0;
    let kept = 0;
    for (const [slug, secs] of Object.entries(models)) {
      if (!secs) continue;
      const todo = secs.filter((m) => !m.skip);
      kept += secs.filter((m) => m.skip && /lossy|interactive/.test(m.skip)).length;
      if (!todo.length) continue;
      todo.filter((m) => m.kind === 'faq').forEach((m) => m.faqs.forEach((f) => { f.a = answer(f.q); }));
      // One rule per section: a browser that can't read one selector skips
      // just that rule (the original then shows until the swap).
      const html = `<style>${todo.map((m) => `html.fx:not(.fx-nx-off) ${m.path} { display: none !important; }`).join('\n')}</style>
<template id="fx-nx">
${todo.map(renderSection).join('\n')}
</template>`;
      fs.writeFileSync(path.join(OUT, slug.replace(/\//g, '__') + '.html'), html);
      built += todo.length;
    }
    console.log(`${slugs.length} pages: ${built} sections rebuilt, ${kept} kept as they were (couldn't be read fully, or interactive)`);
  })();
}

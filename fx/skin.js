// Design-system skin for the cloned React pages (styles in chrome.css):
//   - the mono "// label" eyebrows become the dotted pills used on the homepage,
//   - section headings without an accent get their last words in the serif
//     italic, like every heading on the homepage,
//   - FAQ sections are marked so their accordion can be restyled as cards.
//
// Changing text React rendered before it has hydrated would cause a mismatch,
// so React-owned nodes are only touched once React has claimed them; our own
// FX sections (funnels, explainers…) can be done straight away.

const OURS = '.fx-funnel, .fx-roi, .fx-towers, .fx-cal, .fx-ex, .fx-gallery';
const reactOwned = (el) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));
// Islands whose component code is missing from this build never hydrate, so
// their markup is final and safe to touch right away.
const frozen = new WeakSet();
const safe = (el) => {
  const island = el.closest('astro-island');
  return el.closest(OURS) || !island || frozen.has(island) || reactOwned(el);
};

function eyebrows(root) {
  root.querySelectorAll('div, p, span').forEach((el) => {
    // Text only (React may split "// {label}" across several text nodes, with
    // <!-- --> comments between them).
    if (el.hasAttribute('data-fx-eyebrow') || el.children.length || !el.firstChild) return;
    const nodes = [...el.childNodes].filter((n) => n.nodeType !== 8);
    if (nodes.some((n) => n.nodeType !== 3) || !/^\s*\/\/\s*\S/.test(el.textContent)) return;
    if (!/mono/i.test(getComputedStyle(el).fontFamily)) return;
    if (!safe(el)) return; // not hydrated yet: try again later
    // Strip the leading "//" and the space after it, node by node.
    let strip = true;
    for (const n of nodes) {
      if (!strip) break;
      const v = n.nodeValue.replace(/^\s*(\/\/)?\s*/, '');
      strip = v === '';
      n.nodeValue = v;
    }
    el.setAttribute('data-fx-eyebrow', '');
  });
}

// "Every video is built in one of<br>five proven formats." → the last line
// (if short) or its last two words go in an <em> styled as the serif accent.
function accents(root) {
  root.querySelectorAll('astro-island section h2').forEach((h2) => {
    if (h2.hasAttribute('data-fx-accented') || h2.closest('[data-fx-skip], [data-fx-replaced]')) return;
    if ([...h2.children].some((c) => c.tagName !== 'BR')) return; // already has an accent, or markup we don't know
    if (!safe(h2)) return;
    h2.setAttribute('data-fx-accented', '');
    const texts = [...h2.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
    const last = texts[texts.length - 1];
    if (!last) return;
    const m = last.nodeValue.match(/^(\s*)(.*?)(\s*)$/s);
    const words = m[2].split(/\s+/);
    if (texts.length === 1 && words.length < 2) return; // a single word: leave it
    const k = texts.length > 1 && words.length <= 3 ? words.length : Math.min(2, words.length - 1);
    const em = document.createElement('em');
    em.setAttribute('data-fx-accent', '');
    em.textContent = words.slice(-k).join(' ');
    last.nodeValue = m[1] + words.slice(0, -k).join(' ') + (words.length > k ? ' ' : '');
    last.parentNode.insertBefore(em, last.nextSibling);
  });
}

function faqs(root) {
  root.querySelectorAll('astro-island section h2').forEach((h2) => {
    if (!/frequently asked|questions, answered|common questions/i.test(h2.textContent)) return;
    const sec = h2.closest('section');
    if (!sec || sec.hasAttribute('data-fx-faq') || !sec.querySelector('button')) return;
    if (!safe(sec)) return;
    sec.setAttribute('data-fx-faq', '');
  });
}

function mark(root) {
  eyebrows(root);
  accents(root);
  faqs(root);
}

// Runs now, after each island hydrates, and a few times after that (sections we
// add after hydration, and islands that hydrate on idle / when visible).
export function setupSkin(islands) {
  const run = () => mark(document);
  run();
  islands.forEach((island) => {
    const url = island.getAttribute('component-url');
    if (!url || !island.hasAttribute('ssr')) return;
    fetch(url, { method: 'HEAD' }).then((res) => {
      if (res.ok) return;
      frozen.add(island);
      run();
    }).catch(() => {});
  });
  islands.forEach((island) => {
    if (!island.hasAttribute('ssr')) return;
    island.addEventListener('astro:hydrate', () => [300, 1200, 3000].forEach((t) => setTimeout(run, t)), { once: true });
  });
  [1500, 4000, 8000].forEach((t) => setTimeout(run, t));
}

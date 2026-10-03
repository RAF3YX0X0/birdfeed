// Design-system skin for the cloned React pages: turns the mono "// label"
// eyebrows into the dotted pills used on the homepage (styles in chrome.css).
//
// Changing text React rendered before it has hydrated would cause a mismatch,
// so React-owned eyebrows are only touched once React has claimed them; our own
// FX sections (funnels, explainers…) can be done straight away.

const OURS = '.fx-funnel, .fx-roi, .fx-towers, .fx-cal, .fx-ex, .fx-gallery';
const reactOwned = (el) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));
// Islands whose component code is missing from this build never hydrate, so
// their markup is final and safe to touch right away.
const frozen = new WeakSet();

function mark(root) {
  root.querySelectorAll('div, p, span').forEach((el) => {
    // Text only (React may split "// {label}" across several text nodes, with
    // <!-- --> comments between them).
    if (el.hasAttribute('data-fx-eyebrow') || el.children.length || !el.firstChild) return;
    const nodes = [...el.childNodes].filter((n) => n.nodeType !== 8);
    if (nodes.some((n) => n.nodeType !== 3) || !/^\s*\/\/\s*\S/.test(el.textContent)) return;
    if (!/mono/i.test(getComputedStyle(el).fontFamily)) return;
    const island = el.closest('astro-island');
    const safe = el.closest(OURS) || !island || frozen.has(island) || reactOwned(el);
    if (!safe) return; // not hydrated yet: try again later
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

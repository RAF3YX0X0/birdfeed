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

// Page and section headings without an accent:
// "Every video is built in one of<br>five proven formats." → the last line
// (if short) or its last two words go in an <em> styled as the serif accent.
function accents(root) {
  root.querySelectorAll('astro-island section :is(h1, h2)').forEach((h2) => {
    if (h2.hasAttribute('data-fx-accented') || h2.closest('[data-fx-skip], [data-fx-replaced]')) return;
    // Section headings only: not the smaller headings inside long-form text.
    if (parseFloat(getComputedStyle(h2).fontSize) < 32) return;
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

// The hero "Book a 20-min demo" window on city and industry pages is a Cal.com
// embed whose loader is missing from this build, so it stays an empty white
// box. Where no calendar has loaded, show a static booking preview that links
// to the demo page instead.
function calendars(root) {
  root.querySelectorAll('#my-cal-inline').forEach((box) => {
    if (box.hasAttribute('data-fx-cal') || box.querySelector('iframe') || !safe(box)) return;
    box.setAttribute('data-fx-cal', '');
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday first
    const month = first.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<i></i>';
    for (let d = 1; d <= days; d++) {
      const wd = new Date(now.getFullYear(), now.getMonth(), d).getDay();
      const open = d > now.getDate() && wd !== 0 && wd !== 6;
      const pick = open && !cells.includes('is-pick');
      cells += `<i class="${open ? 'is-open' : ''}${pick ? ' is-pick' : ''}">${d}</i>`;
    }
    box.innerHTML = `<a class="fx-cal-preview" href="/book-demo/">
      <span class="fx-cal-preview__head"><b>${month}</b><small>20 min · video call</small></span>
      <span class="fx-cal-preview__dow"><i>Mo</i><i>Tu</i><i>We</i><i>Th</i><i>Fr</i><i>Sa</i><i>Su</i></span>
      <span class="fx-cal-preview__grid">${cells}</span>
      <span class="fx-cal-preview__slots"><i>9:00am</i><i>10:30am</i><i class="is-pick">1:00pm</i><i>3:30pm</i></span>
      <span class="fx-cal-preview__cta">Choose a time on the demo page <em>→</em></span>
    </a>`;
  });
}

// Images missing from this build (blog thumbnails, some avatars) would show as
// empty grey boxes; mark them so chrome.css can draw a branded placeholder.
function brokenImages(root) {
  root.querySelectorAll('astro-island img:not([data-fx-noimg])').forEach((img) => {
    // Small ones (avatars) become a disc, big ones a placeholder panel.
    const flag = () => { if (safe(img)) img.setAttribute('data-fx-noimg', img.offsetWidth > 80 || img.offsetHeight > 80 ? 'box' : 'dot'); };
    if (img.complete) { if (!img.naturalWidth && img.getAttribute('src')) flag(); }
    else img.addEventListener('error', flag, { once: true });
  });
}

function mark(root) {
  eyebrows(root);
  accents(root);
  faqs(root);
  brokenImages(root);
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
  // Give a real calendar embed time to load before showing the preview.
  setTimeout(() => calendars(document), 6000);
}

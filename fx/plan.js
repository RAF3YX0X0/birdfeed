// A bridge to the homepage's plan builder (React, in the FBHomeMain island):
// the builder is the one place a plan lives, so adding a service anywhere on
// the page presses the builder's own card, and "what's in the plan" is read
// from its estimate panel. The builder hydrates once the page settles
// (scripts/optimize-pages.js); a click before that waits for it.

export function connectPlan({ lenis }) {
  const grid = document.querySelector('.sh-builder-grid');
  if (!grid) return null;
  const owned = () => { const c = grid.querySelector('.sh-bld'); return !!c && Object.keys(c).some((k) => k.startsWith('__reactFiber$')); };

  // The services in the plan, from the estimate panel's lines.
  function read() {
    const panel = grid.children[1];
    if (!panel) return [];
    return [...panel.querySelectorAll('div')]
      .filter((d) => d.children.length === 3 && [...d.children].every((c) => c.tagName === 'SPAN') && /^\$[\d,]+$/.test(d.children[2].textContent.trim()))
      .map((d) => d.children[0].textContent.trim().split(' · ')[0].trim());
  }
  const cardFor = (name) => [...grid.querySelectorAll('.sh-bld')].find((c) => [...c.querySelectorAll('span')].some((s) => !s.childElementCount && s.textContent.trim() === name));
  async function card(name) {
    let c = cardFor(name);
    if (c) return c;
    // The less common services are behind "More add-ons & services".
    const more = [...grid.querySelectorAll('button')].find((b) => /more add-ons/i.test(b.textContent));
    if (more) { more.click(); await frame(); c = cardFor(name); }
    return c;
  }
  async function ready() {
    for (let i = 0; i < 80 && !owned(); i++) await sleep(100);
    return owned();
  }
  const goTo = () => {
    const t = document.getElementById('build');
    if (t && lenis) lenis.scrollTo(t, { offset: -84, duration: 1.4 }); else if (t) t.scrollIntoView({ behavior: 'smooth' });
  };
  // Adds the service, or takes it out if it's already in. Returns whether it's in.
  async function toggle(name) {
    if (!(await ready())) { goTo(); return read().includes(name); }
    const c = await card(name);
    if (!c) { goTo(); return read().includes(name); }
    c.click();
    await frame();
    return read().includes(name);
  }
  function onChange(fn) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; fn(read()); });
    }).observe(grid, { childList: true, subtree: true, characterData: true });
    fn(read());
  }
  return { read, toggle, onChange, goTo };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));

// "Results we have delivered" (markup: scripts/build-stats.js, styles: stats.css):
// tabs by service; when a panel first comes into view its bars grow from zero
// and the figures count up to the number the export actually shows.

const fmtNum = (v) => v.toLocaleString('en-US');

// Matches show() in scripts/build-stats.js, so the counting ends on the
// same string the page was built with.
function show(v, fmt, unit) {
  if (fmt === 'pct') return `${v % 1 ? v.toFixed(2) : v.toFixed(1)}%`;
  if (fmt === 'money') {
    const n = v >= 1000 ? fmtNum(Math.round(v)) : v.toFixed(2).replace(/\.00$/, '');
    return unit === 'Rs' ? `Rs ${n}` : `${unit}${n}`;
  }
  return fmtNum(Math.round(v));
}

export function setupStats({ section, gsap: G, reduced }) {
  const tabs = [...section.querySelectorAll('.st3-tab')];
  const panels = [...section.querySelectorAll('.st3-panel')];
  if (!tabs.length) return;

  // ---- Tabs -------------------------------------------------------------------------------
  function select(key, focus) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.key === key)));
    panels.forEach((p) => { p.hidden = p.dataset.key !== key; });
    const panel = panels.find((p) => p.dataset.key === key);
    if (panel) play(panel);
    if (focus) tabs.find((t) => t.dataset.key === key).focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.key));
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      select(tabs[(i + d + tabs.length) % tabs.length].dataset.key, true);
    });
  });

  // ---- Growing the bars and counting the figures -------------------------------------------
  const done = new WeakSet();
  function play(panel) {
    if (done.has(panel)) return;
    done.add(panel);
    const bars = [...panel.querySelectorAll('.st3-bar__fill, .st3-row__fill')];
    const nums = [...panel.querySelectorAll('[data-to]')];
    const cards = [...panel.querySelectorAll('.st3-stat, .st3-chart, .st3-table')];
    if (reduced) return;

    G.set(cards, { opacity: 0, y: 26 });
    G.to(cards, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05, clearProps: 'transform,opacity' });
    bars.forEach((b) => b.style.setProperty('--grow', '0'));
    G.to(bars, {
      duration: 1.25, ease: 'power3.out', stagger: 0.07,
      onStart() { this.targets().forEach((b) => b.style.setProperty('--grow', '0')); },
      onUpdate() {
        const p = this.progress();
        this.targets().forEach((b) => b.style.setProperty('--grow', p.toFixed(3)));
      },
      onComplete() { this.targets().forEach((b) => b.style.removeProperty('--grow')); },
    });
    nums.forEach((el, i) => {
      const to = parseFloat(el.dataset.to);
      const { fmt, unit } = el.dataset;
      const o = { v: 0 };
      G.to(o, {
        v: to, duration: 1.4, delay: 0.1 + i * 0.07, ease: 'power3.out',
        onUpdate: () => { el.textContent = show(o.v, fmt, unit); },
        onComplete: () => { el.textContent = show(to, fmt, unit); },
      });
    });
  }

  window.ScrollTrigger.create({
    trigger: section, start: 'top 75%', once: true,
    onEnter: () => play(panels[0]),
  });
}

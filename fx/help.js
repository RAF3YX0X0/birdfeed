// "How can we help?" — a small help launcher in the corner, in the site's
// design (it replaces the original site's Intercom chat, which went to that
// company's inbox). It offers the ways to reach us that exist today: a demo,
// the plan builder, the work and the customer stories. The button is added
// once the page is idle; the panel is built the first time it's opened.

const ACTIONS = [
  { href: '/book-demo/', title: 'Book a free 30-min demo', text: 'See how it works and get your questions answered.', icon: '<path d="M4 7h16v13H4zM4 11h16M9 4v5M15 4v5"/>' },
  { href: '/pricing/', title: 'Build your plan', text: 'Pick what you need and see your price in 30 seconds.', icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' },
  { href: '/examples/', title: 'See our work', text: 'Real posts, videos and campaigns we’ve made.', icon: '<path d="M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4"/>' },
  { href: '/case-studies/', title: 'Read customer stories', text: 'What changed for businesses like yours.', icon: '<path d="M5 4h11l3 3v13H5zM9 10h6M9 14h6"/>' },
];
const svg = (d, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export function setupHelp({ gsap: G, reduced }) {
  const btn = document.createElement('button');
  btn.className = 'mm-help__btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Help: how can we help?');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mm-help');
  btn.innerHTML = `<span class="mm-help__ico mm-help__ico--chat">${svg('<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke-width="2.6"/>', 24)}</span><span class="mm-help__ico mm-help__ico--close">${svg('<path d="m6 9 6 6 6-6"/>', 24)}</span>`;
  document.body.appendChild(btn);

  let panel = null;
  function build() {
    panel = document.createElement('div');
    panel.className = 'mm-help';
    panel.id = 'mm-help';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'How can we help?');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="mm-help__head">
        <img src="/assets/madmarketing-logo.svg" alt="MadMarketing" width="140" height="20">
        <button class="mm-help__x" type="button" aria-label="Close">×</button>
      </div>
      <p class="mm-help__hi">Hi there <span aria-hidden="true">👋</span><br>How can we <em>help?</em></p>
      <ul class="mm-help__list">${ACTIONS.map((a) => `<li><a href="${a.href}"><span class="mm-help__aico">${svg(a.icon)}</span><span><b>${a.title}</b><small>${a.text}</small></span>${svg('<path d="M9 6l6 6-6 6"/>', 16)}</a></li>`).join('')}</ul>
      <p class="mm-help__foot">Done-for-you social media <span>from $99/mo</span></p>`;
    document.body.appendChild(panel);
    panel.querySelector('.mm-help__x').addEventListener('click', () => toggle(false));
  }

  let open = false;
  function toggle(on) {
    if (on === open) return;
    if (!panel) build();
    open = on;
    btn.setAttribute('aria-expanded', String(on));
    btn.classList.toggle('is-open', on);
    if (on) {
      panel.hidden = false;
      if (!reduced && G) G.fromTo(panel, { opacity: 0, y: 18, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out', clearProps: 'transform' });
      panel.querySelector('a').focus({ preventScroll: true });
    } else if (!reduced && G) {
      G.to(panel, { opacity: 0, y: 12, scale: 0.98, duration: 0.25, ease: 'power2.in', onComplete: () => { if (!open) panel.hidden = true; } });
    } else {
      panel.hidden = true;
    }
  }
  btn.addEventListener('click', () => toggle(!open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { toggle(false); btn.focus(); } });
  document.addEventListener('click', (e) => { if (open && !panel.contains(e.target) && !btn.contains(e.target)) toggle(false); });
}

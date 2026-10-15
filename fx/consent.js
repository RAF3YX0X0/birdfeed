// The cookie consent gate.
//
// This replaces the old notice, which only told people what was already
// running. Under GDPR and the UK/EU ePrivacy rules, analytics and
// advertising cookies need consent *before* they are set, refusing has to be
// as easy as accepting, and withdrawing has to be as easy as giving. So:
//
//   - Accept all and Reject all sit side by side, same size, same weight.
//     No pre-ticked boxes, and closing the banner is not consent.
//   - Nothing is remembered until someone chooses. The decision is stored
//     with a timestamp and a version, so the record says what was agreed to
//     and when.
//   - A Cookie settings link goes into the footer of every page, so the
//     choice can be changed or withdrawn at any time.
//
// The part that actually holds the tags back runs in the head
// (scripts/inject-fx.js), not here: by the time this module executes, a tag
// emitted normally would already have set its cookies. This file only
// collects the decision and applies it.

const KEY = 'mm-consent-v1';
const VERSION = 1;

// Necessary is not a choice, and saying so is part of being honest about it.
const CATEGORIES = [
  {
    id: 'necessary',
    name: 'Strictly necessary',
    always: true,
    what: 'Needed for the site to work: remembering that you have seen the intro, keeping prompts from reappearing, and limiting repeated form submissions. These stay on your device.',
  },
  {
    id: 'functional',
    name: 'Live chat',
    what: 'Loads our live chat and keeps a conversation open as you move between pages. It sets its own cookies as soon as it loads, whether or not you open it.',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    what: 'Google Analytics, so we can see which pages are useful and how people find us. Sets cookies beginning _ga that last up to two years.',
  },
  {
    id: 'marketing',
    name: 'Advertising',
    what: 'The Meta Pixel, so we can tell which of our Facebook and Instagram ads lead to an application. Meta can recognise your browser on other sites that use its tools.',
  },
];
const OPTIONAL = CATEGORIES.filter((c) => !c.always).map((c) => c.id);

const read = () => {
  // The head script already parsed this; fall back to it so the two can
  // never disagree about what was stored.
  const boot = window.__mmConsent;
  if (boot) return { set: !!boot.set, functional: !!boot.functional, analytics: !!boot.analytics, marketing: !!boot.marketing };
  return { set: false, functional: false, analytics: false, marketing: false };
};

const write = (choice) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: VERSION,
      ts: new Date().toISOString(),
      functional: !!choice.functional,
      analytics: !!choice.analytics,
      marketing: !!choice.marketing,
    }));
    return true;
  } catch {
    // Private window, or storage blocked. The choice still applies to this
    // page; it just cannot be remembered, so the banner returns next visit.
    return false;
  }
};

// Withdrawing has to actually do something. Scripts already running cannot be
// unloaded, so delete what they set and reload; until then, at least stop
// them storing anything new.
const COOKIES_BY = {
  analytics: [/^_ga/, /^_gid$/, /^_gat/],
  marketing: [/^_fbp$/, /^_fbc$/],
};

function clearCookies(patterns) {
  const host = location.hostname;
  // A cookie set on .example.com is not deleted by expiring it on
  // www.example.com, so try every parent domain and both path forms.
  const domains = [undefined, host, '.' + host];
  const parts = host.split('.');
  for (let i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));

  document.cookie.split(';').forEach((raw) => {
    const name = raw.split('=')[0].trim();
    if (!name || !patterns.some((re) => re.test(name))) return;
    domains.forEach((d) => {
      ['/', location.pathname].forEach((path) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}` + (d ? `; domain=${d}` : '');
      });
    });
  });
}

function apply(next, previous) {
  const granted = (k) => !!next[k];

  // Google Consent Mode v2. gtag exists because the head script defines it
  // before anything else, so this is safe even if gtag.js is still loading.
  if (typeof window.gtag === 'function') {
    const g = (b) => (b ? 'granted' : 'denied');
    window.gtag('consent', 'update', {
      ad_storage: g(granted('marketing')),
      ad_user_data: g(granted('marketing')),
      ad_personalization: g(granted('marketing')),
      analytics_storage: g(granted('analytics')),
      functionality_storage: g(granted('functional')),
    });
  }

  // Newly granted categories load now. Each loader runs once.
  if (typeof window.__mmLoad === 'function') {
    if (granted('marketing')) window.__mmLoad('marketing');
    if (granted('functional')) window.__mmLoad('functional');
  }

  // Newly withdrawn ones: clear what we can name, then reload so the scripts
  // themselves stop. Only when something was actually on before.
  const withdrawn = OPTIONAL.filter((k) => previous && previous[k] && !next[k]);
  withdrawn.forEach((k) => COOKIES_BY[k] && clearCookies(COOKIES_BY[k]));

  try {
    window.dispatchEvent(new CustomEvent('mm:consent', { detail: { ...next } }));
  } catch {}

  return withdrawn.length > 0;
}

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export function setupConsent({ gsap: G, reduced } = {}) {
  const state = read();
  let banner = null;
  let panel = null;
  let lastFocus = null;

  const show = (node) => {
    if (reduced || !G) { node.style.opacity = '1'; return; }
    G.fromTo(node, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
  };
  const hide = (node, after) => {
    if (reduced || !G) { node.remove(); if (after) after(); return; }
    G.to(node, { opacity: 0, y: 12, duration: 0.28, ease: 'power2.in', onComplete: () => { node.remove(); if (after) after(); } });
  };

  // ---- Saving -----------------------------------------------------------
  function save(choice) {
    const previous = read();
    write(choice);
    // Keep the head script's copy current, so a second save in the same page
    // compares against the right thing.
    window.__mmConsent = { ...choice, set: true };
    const needsReload = apply(choice, previous);

    if (banner) { hide(banner); banner = null; }
    if (panel) closePanel();
    if (needsReload) location.reload();
  }

  const all = (value) => ({ functional: value, analytics: value, marketing: value });

  // ---- The preferences panel --------------------------------------------
  function openPanel() {
    if (panel) return;
    lastFocus = document.activeElement;
    const current = read();

    panel = el('div', 'mm-cc-wrap');
    const rows = CATEGORIES.map((c) => {
      const on = c.always ? true : !!current[c.id];
      return `
        <div class="mm-cc__row">
          <div class="mm-cc__row-h">
            <label class="mm-cc__sw${c.always ? ' is-locked' : ''}">
              <input type="checkbox" data-cat="${c.id}"${on ? ' checked' : ''}${c.always ? ' disabled' : ''}>
              <span class="mm-cc__sw-t" aria-hidden="true"></span>
              <span class="mm-cc__row-n">${c.name}</span>
            </label>
            ${c.always ? '<span class="mm-cc__always">Always on</span>' : ''}
          </div>
          <p class="mm-cc__row-d">${c.what}</p>
        </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="mm-cc__scrim" data-close></div>
      <div class="mm-cc" role="dialog" aria-modal="true" aria-labelledby="mm-cc-h">
        <div class="mm-cc__head">
          <h2 id="mm-cc-h">Cookie settings</h2>
          <button type="button" class="mm-cc__close" aria-label="Close" data-close>&times;</button>
        </div>
        <p class="mm-cc__intro">Choose what this site may use. You can change this at any time from the Cookie settings link in the footer. Our <a href="/cookie-policy/">Cookie Policy</a> lists every cookie by name.</p>
        <div class="mm-cc__rows">${rows}</div>
        <div class="mm-cc__acts">
          <button type="button" class="mm-cc__btn mm-cc__btn--ghost" data-act="reject">Reject all</button>
          <button type="button" class="mm-cc__btn mm-cc__btn--ghost" data-act="accept">Accept all</button>
          <button type="button" class="mm-cc__btn mm-cc__btn--solid" data-act="save">Save choices</button>
        </div>
      </div>`;
    document.body.appendChild(panel);
    document.documentElement.classList.add('mm-cc-open');

    const box = panel.querySelector('.mm-cc');
    const pick = (id) => panel.querySelector(`input[data-cat="${id}"]`);

    panel.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) { closePanel(); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const which = act.dataset.act;
      if (which === 'save') {
        save({ functional: pick('functional').checked, analytics: pick('analytics').checked, marketing: pick('marketing').checked });
      } else {
        save(all(which === 'accept'));
      }
    });

    // Escape closes, and focus stays inside while it is open.
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closePanel(); return; }
      if (e.key !== 'Tab') return;
      const f = box.querySelectorAll('button, input, a[href]');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    show(box);
    (box.querySelector('.mm-cc__close') || box).focus();
  }

  function closePanel() {
    if (!panel) return;
    const node = panel;
    panel = null;
    document.documentElement.classList.remove('mm-cc-open');
    node.remove();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // ---- The banner --------------------------------------------------------
  function openBanner() {
    banner = el('div', 'mm-cb');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <p class="mm-cb__t">We use cookies to run our live chat, to see how this site is used, and to measure our ads. We only set them if you say yes. See our <a href="/cookie-policy/">Cookie Policy</a>.</p>
      <div class="mm-cb__acts">
        <button type="button" class="mm-cb__btn" data-act="reject">Reject all</button>
        <button type="button" class="mm-cb__btn" data-act="accept">Accept all</button>
        <button type="button" class="mm-cb__link" data-act="manage">Manage</button>
      </div>`;
    document.body.appendChild(banner);

    banner.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'manage') openPanel();
      else save(all(b.dataset.act === 'accept'));
    });

    show(banner);
  }

  // ---- Withdrawing later -------------------------------------------------
  // A link in the footer of every page, next to the policies it refers to.
  function addFooterLink() {
    document.querySelectorAll('.ft__legal').forEach((row) => {
      if (row.querySelector('[data-cookie-settings]')) return;
      const b = el('button', 'mm-cc-open-btn', 'Cookie settings');
      b.type = 'button';
      b.setAttribute('data-cookie-settings', '');
      const top = row.querySelector('.ft__top-btn');
      row.insertBefore(b, top || null);
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); openPanel(); }
  });

  addFooterLink();
  if (!state.set) openBanner();

  // Small public handle, so anything else on the page can read the choice or
  // reopen the panel without importing this module.
  window.mmConsent = { get: read, open: openPanel, save };
}

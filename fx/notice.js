// The cookie notice. Not a consent gate: analytics load either way, so this
// tells people what is set and points at the Cookie Policy, which is what a
// US business without EU visitors needs. If that changes — if the client
// starts advertising into the EU or UK — this has to become a real consent
// banner that holds GA4 back until someone accepts, and the policies have to
// say so too.
//
// It sits bottom-left because Chatway's bubble owns the bottom-right corner.
// The dismissal is remembered per browser in localStorage, which can throw in
// a private window, so every access is guarded.

const KEY = 'mm-notice-v1';

const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false; // Storage blocked: show it, rather than assume consent.
  }
};
const remember = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* Private window: it reappears next visit, which is the safe way to fail. */
  }
};

export function setupNotice({ gsap: G, reduced }) {
  if (seen()) return;

  const el = document.createElement('div');
  el.className = 'mm-note';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Cookie notice');
  el.innerHTML = `
    <p class="mm-note__t">We use cookies to understand how this site is used, and our live chat sets its own. See our <a href="/cookie-policy/">Cookie Policy</a>.</p>
    <button class="mm-note__x" type="button">Got it</button>`;
  document.body.appendChild(el);

  const close = () => {
    remember();
    if (reduced || !G) return el.remove();
    G.to(el, { opacity: 0, y: 12, duration: 0.3, ease: 'power2.in', onComplete: () => el.remove() });
  };
  el.querySelector('.mm-note__x').addEventListener('click', close);

  if (reduced || !G) {
    el.style.opacity = '1';
    return;
  }
  G.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.8 });
}

// The demo page's booking calendar: the client's Calendly (a 30-minute call),
// loaded straight into the box the page's own component made for its old
// Cal.com calendar. The component waits a few seconds before creating its
// calendar and skips it if the box is already marked done, so this marks the
// box the moment React owns it and puts Calendly's inline page in it.
// optimize-pages.js preconnects to Calendly, and chrome.css shows a loading
// state in the box until the calendar is in.
const CALENDLY = 'https://calendly.com/getmadmediamarketing/30min';
const reactOwned = (el) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));

export function startCal() {
  if (!document.getElementById('my-cal-inline')) return;
  let tries = 0;
  const tick = () => {
    const box = document.getElementById('my-cal-inline'); // fresh: React may re-render it
    if (!box || box.querySelector('iframe') || box.dataset.calInitDone) return;
    if (reactOwned(box)) {
      box.dataset.calInitDone = '1';
      const url = new URL(CALENDLY);
      url.searchParams.set('embed_domain', location.host);
      url.searchParams.set('embed_type', 'Inline');
      url.searchParams.set('hide_gdpr_banner', '1');
      url.searchParams.set('primary_color', '0066ff');
      const frame = document.createElement('iframe');
      frame.src = url.href;
      frame.title = 'Book a call with MadMarketing';
      frame.loading = 'eager';
      Object.assign(frame.style, { width: '100%', height: '100%', minHeight: '640px', border: '0', display: 'block' });
      box.appendChild(frame);
      return;
    }
    if (++tries < 300) setTimeout(tick, 100);
  };
  tick();
}

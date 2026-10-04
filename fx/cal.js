// The demo page's booking calendar (a Cal.com inline embed). The page's own
// component loads Cal's script when it mounts but then waits four seconds
// before creating the calendar; this creates it the moment React owns the
// box (the component then sees it's done and skips its own). inject-fx.js
// also preconnects to Cal and preloads its script, and chrome.css shows a
// loading state in the box until the calendar arrives.
const reactOwned = (el) => Object.keys(el).some((k) => k.startsWith('__reactFiber$'));

export function startCal() {
  if (!document.getElementById('my-cal-inline')) return;
  let tries = 0;
  const tick = () => {
    const box = document.getElementById('my-cal-inline'); // fresh: React may re-render it
    if (!box || box.querySelector('iframe') || box.dataset.calInitDone) return;
    if (reactOwned(box) && typeof window.Cal === 'function') {
      box.dataset.calInitDone = '1';
      window.Cal('inline', { elementOrSelector: '#my-cal-inline', config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' }, calLink: 'feedbird/demo' });
      window.Cal('ui', { hideEventTypeDetails: true, layout: 'month_view' });
      return;
    }
    if (++tries < 300) setTimeout(tick, 100);
  };
  tick();
}

/*
 * FX boot — loaded render-blocking in <head> so the page never flashes before the
 * intro curtain. Keep this tiny: it only sets <html> classes that fx.css keys off.
 */
(function () {
  var d = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  d.classList.add('fx');
  if (reduce) { d.classList.add('fx-reduced'); return; }

  // A page reached through an fx page-transition starts covered so the
  // curtain can lift off it. A fresh load shows the page straight away (no
  // preloader: nothing should stand between a visitor and the content).
  var fromNav = false;
  try {
    fromNav = sessionStorage.getItem('fx-nav') === '1';
    sessionStorage.removeItem('fx-nav');
  } catch (e) {}
  if (!fromNav) return;
  d.classList.add('fx-cover', 'fx-from-nav');

  // Failsafe: never leave the page covered if fx.js fails to run.
  setTimeout(function () { d.classList.remove('fx-cover'); }, 2500);
})();

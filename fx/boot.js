/*
 * FX boot — loaded render-blocking in <head> so the page never flashes before the
 * intro curtain. Keep this tiny: it only sets <html> classes that fx.css keys off.
 */
(function () {
  var d = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  d.classList.add('fx');
  // Inner pages' rebuilt sections replace the originals once fx.js runs; if
  // it never does, show the originals again.
  setTimeout(function () { if (document.getElementById('fx-nx') && !document.querySelector('section.nx')) d.classList.add('fx-nx-off'); }, 12000);
  if (reduce) { d.classList.add('fx-reduced'); return; }

  // The preloader plays on the first page of a visit; pages after that show
  // straight away (links navigate natively, with a quick cross-fade).
  var seen = false;
  try {
    seen = sessionStorage.getItem('fx-seen') === '1';
    sessionStorage.setItem('fx-seen', '1');
    sessionStorage.removeItem('fx-nav');
  } catch (e) {}
  if (seen) return;
  d.classList.add('fx-cover', 'fx-from-load');
  // Failsafe: never leave the page covered if fx.js fails to run.
  setTimeout(function () { d.classList.remove('fx-cover'); }, 4000);
})();

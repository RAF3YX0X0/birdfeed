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

  // Pages show straight away: no preloader, no cover between pages. (Clear
  // the flag older versions set before navigating.)
  try { sessionStorage.removeItem('fx-nav'); } catch (e) {}
})();

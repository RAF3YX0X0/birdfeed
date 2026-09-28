/* Inject left/right arrow controls under any .m-slider that overflows (mobile only) */
(function(){
  function sync(){
    var mobile = window.innerWidth <= 700;
    if(!mobile){
      document.querySelectorAll('.m-slider-arrows').forEach(function(e){ e.remove(); });
      document.querySelectorAll('.m-slider[data-arrowed]').forEach(function(s){ s.removeAttribute('data-arrowed'); });
      return;
    }
    document.querySelectorAll('.m-slider').forEach(function(s){
      var scrollable = s.scrollWidth > s.clientWidth + 8;
      if(!scrollable){ if(s.dataset.arrowed){ var n=s.nextElementSibling; if(n&&n.classList.contains('m-slider-arrows')) n.remove(); s.removeAttribute('data-arrowed'); } return; }
      if(s.dataset.arrowed) return;
      s.dataset.arrowed = '1';
      var bar = document.createElement('div');
      bar.className = 'm-slider-arrows';
      var svg = function(d){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>'; };
      var prev = document.createElement('button'); prev.setAttribute('aria-label','Scroll left'); prev.innerHTML = svg('<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>');
      var next = document.createElement('button'); next.setAttribute('aria-label','Scroll right'); next.innerHTML = svg('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>');
      prev.addEventListener('click', function(){ s.scrollBy({ left: -Math.round(s.clientWidth*0.8), behavior:'smooth' }); });
      next.addEventListener('click', function(){ s.scrollBy({ left:  Math.round(s.clientWidth*0.8), behavior:'smooth' }); });
      bar.appendChild(prev); bar.appendChild(next);
      s.insertAdjacentElement(s.classList.contains('m-slider-below') ? 'afterend' : 'beforebegin', bar);
    });
  }
  var t;
  function schedule(){ clearTimeout(t); t = setTimeout(sync, 250); }
  window.addEventListener('resize', schedule);
  window.addEventListener('load', function(){ setTimeout(sync, 500); });
  document.addEventListener('DOMContentLoaded', function(){
    var root = document.getElementById('root');
    if(root){ new MutationObserver(schedule).observe(root, { childList:true, subtree:true }); }
    setTimeout(sync, 900);
  });
})();

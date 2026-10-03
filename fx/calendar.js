// "A month of content, handled" — a 3D content calendar for the Social Media
// Management page. Desktop: the section pins while scrolling walks through
// the month and each day's post flips into place. Phones / unpinned: the month
// plays by itself once the section is in view.
import { allowSticky } from './funnel.js';

const TYPES = {
  post: { label: 'Posts', color: '#3B5BFF' },
  reel: { label: 'Reels & short videos', color: '#E8435F' },
  story: { label: 'Stories', color: '#8A9BFF' },
};
// Illustrative schedule: posts Mon/Wed/Fri, reels Tue/Thu, a story Saturday,
// Sunday off. The month starts on a Wednesday (offset 2).
const OFFSET = 2;
const DAYS = Array.from({ length: 30 }, (_, i) => {
  const weekday = (OFFSET + i) % 7; // 0 = Monday
  const type = [0, 2, 4].includes(weekday) ? 'post' : [1, 3].includes(weekday) ? 'reel' : weekday === 5 ? 'story' : null;
  return { day: i + 1, type };
});
const IMAGES = [
  '/assets/work/social-citrus.webp', '/img/ex/feat-thecups-koreanicecup.webp', '/assets/work/ugc-mic.webp',
  '/assets/work/story-sunglasses.webp', '/img/ex/feat-manaia-surf-aerial.webp', '/assets/work/carousel-holiday.webp',
  '/assets/work/video-plane.webp', '/img/ex/feat-lessbooze-mocktails.webp', '/assets/work/social-laundry.webp',
  '/assets/work/ugc-handmade.webp', '/img/ex/feat-kingrilla-whatsinit.webp', '/assets/work/story-yoga.webp',
  '/assets/work/carousel-caffeine.webp', '/img/ex/feat-millynnial-selfaware.webp', '/assets/work/ugc-sam.webp',
  '/img/ex/feat-spinsudz-springcleaning.webp', '/assets/work/carousel-driving.webp', '/img/ex/feat-crenshaw-dreamapt.webp',
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function setupCalendar({ anchor, gsap, lenis, reduced, narrow }) {
  const totals = Object.fromEntries(Object.keys(TYPES).map((k) => [k, DAYS.filter((d) => d.type === k).length]));
  const sec = document.createElement('section');
  sec.className = 'fx-cal';
  sec.setAttribute('aria-labelledby', 'fx-cal-title');
  sec.innerHTML = `
    <div class="fx-cal__pin">
      <div class="fx-cal__head">
        <p class="fx-cal__eyebrow">// a month with us</p>
        <h2 class="fx-cal__title" id="fx-cal-title">A month of content, <em>handled.</em></h2>
        <p class="fx-cal__lede">Here’s what a typical month looks like. We plan it, design it, write it and publish it. You just approve.</p>
      </div>
      <div class="fx-cal__body">
        <div class="fx-cal__viz" aria-hidden="true"><div class="fx-cal__canvas"></div></div>
        <div class="fx-cal__panel">
          <p class="fx-cal__day"><span>Day</span> <b data-k="day">1</b> <span>of 30</span></p>
          <ul class="fx-cal__legend">
            ${Object.entries(TYPES).map(([k, t]) => `<li style="--c:${t.color}"><i></i><span>${t.label}</span><b data-k="${k}">0</b></li>`).join('')}
          </ul>
          <div class="fx-cal__you">
            <p><b>Your part:</b> about 15 minutes a week approving posts in your dashboard.</p>
            <p><b>Our part:</b> ideas, design, video, captions, hashtags and publishing, on schedule.</p>
          </div>
        </div>
      </div>
      <p class="fx-cal__note">Illustrative schedule of ${totals.post + totals.reel + totals.story} pieces. Your plan decides how many posts, videos and stories you get.</p>
    </div>`;
  anchor.parentNode.insertBefore(sec, anchor);

  const pinned = !reduced && !narrow && window.innerHeight >= 680 && allowSticky(sec);
  sec.classList.toggle('is-pinned', pinned);
  const out = {
    day: sec.querySelector('[data-k="day"]'),
    ...Object.fromEntries(Object.keys(TYPES).map((k) => [k, sec.querySelector(`[data-k="${k}"]`)])),
  };

  let cal = null;
  let progress = reduced ? 1 : 0;
  function render(p) {
    progress = p;
    const reached = Math.min(DAYS.length, Math.floor(p * DAYS.length + 0.0001));
    out.day.textContent = String(Math.max(1, reached));
    Object.keys(TYPES).forEach((k) => {
      out[k].textContent = String(DAYS.slice(0, reached).filter((d) => d.type === k).length);
    });
    if (cal) cal.setProgress(p);
  }

  if (pinned) {
    const onScroll = () => {
      const r = sec.getBoundingClientRect();
      render(clamp(-r.top / Math.max(1, sec.offsetHeight - window.innerHeight), 0, 1));
    };
    lenis ? lenis.on('scroll', onScroll) : window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    render(progress);
  }

  // Start (3D + entrance, or autoplay when unpinned) once in view. A timer
  // backs up the observer, whose callbacks can starve on a busy main thread.
  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    clearInterval(backup);
    io.disconnect();
    if (!pinned && !reduced) {
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: 7, ease: 'none', delay: 0.4, onUpdate: () => render(o.p) });
    }
    try {
      const [kit, mod] = await Promise.all([import('./three/kit.js'), import('./three/calendar3d.js')]);
      if (!kit.webglAvailable()) return;
      cal = mod.mountCalendar({ host: sec.querySelector('.fx-cal__canvas'), days: DAYS, offset: OFFSET, images: IMAGES, types: TYPES, gsap, reduced });
      cal.setProgress(progress);
      sec.classList.add('is-3d');
    } catch (err) {
      console.warn('[fx] calendar 3D unavailable', err);
    }
  };
  const io = new IntersectionObserver((list) => { if (list[list.length - 1].isIntersecting) start(); }, { rootMargin: '0px 0px -20% 0px' });
  io.observe(sec);
  const backup = setInterval(() => {
    const r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.8 && r.bottom > 0) start();
  }, 250);
  return sec;
}

// "From scroll to sale" — a 3D sales funnel section for the landing page that
// explains, in plain words, how social media turns strangers into customers.
// Desktop: the section pins while scrolling walks through the five stages
// (like the helix gallery). Phones / reduced motion: a normal section where
// the stage in the middle of the screen is highlighted.

export const FUNNEL_STAGES = [
  {
    key: 'Awareness', title: 'They see you', color: '#7A8BFF', color3d: '#C7D0FF',
    text: 'Your posts, reels and ads show up in the feeds of people nearby who have never heard of you.',
    we: 'Daily on-brand posts, short videos, smart hashtags and local targeting.',
    num: 10000, unit: 'people see your posts',
  },
  {
    key: 'Interest', title: 'They like what they see', color: '#5E73FF', color3d: '#9DAEFF',
    text: 'They stop scrolling to like, comment, share and follow you.',
    we: 'Scroll-stopping content, and replies to every comment and message.',
    num: 1200, unit: 'like, comment or follow',
  },
  {
    key: 'Consideration', title: 'They check you out', color: '#3B5BFF', color3d: '#6F86FF',
    text: 'They visit your profile, tap your link, read your reviews or send you a message.',
    we: 'A clear bio and links, story highlights, offers and fast replies.',
    num: 300, unit: 'visit your page or message you',
  },
  {
    key: 'Conversion', title: 'They buy', color: '#2A45E0', color3d: '#3B5BFF',
    text: 'They book, order or call, and become paying customers.',
    we: 'Retargeting ads, promotions and one-tap booking or checkout links.',
    num: 45, unit: 'become customers',
  },
  {
    key: 'Loyalty', title: 'They come back and tell friends', color: '#E8435F', color3d: '#FF5C7A',
    text: 'Happy customers return, leave reviews and bring their friends, who start the journey all over again.',
    we: 'Review requests, customer spotlights and content that keeps you top of mind.',
    num: 15, unit: 'come back and refer friends',
  },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function setupFunnel({ anchor, gsap, lenis, reduced, narrow }) {
  const N = FUNNEL_STAGES.length;
  const sec = document.createElement('section');
  sec.className = 'fx-funnel';
  sec.setAttribute('aria-labelledby', 'fx-funnel-title');
  sec.innerHTML = `
    <div class="fx-funnel__pin">
      <div class="fx-funnel__head">
        <p class="fx-funnel__eyebrow">// how social media turns into sales</p>
        <h2 class="fx-funnel__title" id="fx-funnel-title">From scroll <em>to sale.</em></h2>
        <p class="fx-funnel__lede">Every post moves people one step closer to buying from you. Here’s the journey, in plain English.</p>
      </div>
      <div class="fx-funnel__body">
        <div class="fx-funnel__stage3d" aria-hidden="true">
          <div class="fx-funnel__fallback">${FUNNEL_STAGES.map((s, i) => `<span style="--c:${s.color3d};--w:${100 - i * 15}%"></span>`).join('')}</div>
          <div class="fx-funnel__canvas"></div>
          <div class="fx-funnel__tags"></div>
        </div>
        <ol class="fx-funnel__steps">
          ${FUNNEL_STAGES.map((s, i) => `
          <li class="fx-funnel__step" style="--c:${s.color}">
            <button type="button" class="fx-funnel__stepbtn" aria-expanded="false" aria-controls="fx-funnel-d${i}">
              <span class="fx-funnel__num">${i + 1}</span>
              <span class="fx-funnel__txt"><span class="fx-funnel__key">${s.key}</span><span class="fx-funnel__name">${s.title}</span></span>
              <span class="fx-funnel__metric"><b data-n="${s.num}">${s.num.toLocaleString('en-US')}</b>${s.unit}</span>
            </button>
            <div class="fx-funnel__detail" id="fx-funnel-d${i}"><div>
              <p>${s.text}</p>
              <p class="fx-funnel__we"><span>What we do:</span> ${s.we}</p>
            </div></div>
          </li>`).join('')}
        </ol>
      </div>
      <p class="fx-funnel__note">Illustrative example for a local business; your numbers depend on your industry and budget. <a href="/book-demo/">See what’s possible for you →</a></p>
    </div>`;
  anchor.parentNode.insertBefore(sec, anchor);

  const steps = [...sec.querySelectorAll('.fx-funnel__step')];
  const pinned = !reduced && !narrow && window.innerHeight >= 680;
  sec.classList.toggle('is-pinned', pinned);
  sec.style.setProperty('--fx-funnel-stages', N);

  // ---- active stage ----------------------------------------------------------
  let active = -1;
  let funnel = null;
  const counted = new Set();
  function setActive(i) {
    if (i === active) return;
    active = i;
    steps.forEach((li, k) => {
      li.classList.toggle('is-active', k === i);
      li.classList.toggle('is-past', k < i);
      li.querySelector('button').setAttribute('aria-expanded', String(k === i));
    });
    if (funnel) funnel.setActive(i);
    // Count the stage's number up the first time it's shown.
    if (!reduced && !counted.has(i)) {
      counted.add(i);
      const b = steps[i].querySelector('b');
      const n = +b.dataset.n;
      const o = { v: 0 };
      gsap.to(o, { v: n, duration: 1.2, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v).toLocaleString('en-US'); } });
    }
  }

  // Scroll position inside the pinned section → stage.
  function span() { return sec.offsetHeight - window.innerHeight; }
  function onScroll() {
    const r = sec.getBoundingClientRect();
    const q = clamp(-r.top / Math.max(1, span()), 0, 0.9999);
    setActive(Math.floor(q * N));
  }
  if (pinned) {
    if (lenis) lenis.on('scroll', onScroll);
    else window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    // Unpinned: highlight the step crossing the middle of the screen.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((li) => io.observe(li));
    setActive(0);
  }

  // Clicking a step jumps to it.
  steps.forEach((li, i) => {
    li.querySelector('button').addEventListener('click', () => {
      if (!pinned) return setActive(i);
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const y = top + ((i + 0.5) / N) * span();
      lenis ? lenis.scrollTo(y, { duration: 1.1 }) : window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // ---- entrance + lazy 3D ----------------------------------------------------
  const head = sec.querySelectorAll('.fx-funnel__eyebrow, .fx-funnel__title, .fx-funnel__lede');
  if (!reduced) {
    gsap.set(head, { opacity: 0, y: 36, rotationX: -45, transformPerspective: 900, transformOrigin: '50% 100%' });
    gsap.set(steps, { opacity: 0, x: 40, rotationY: -18, transformPerspective: 900 });
  }
  const once = new IntersectionObserver(async (list) => { const e = list[list.length - 1]; // latest state wins
    if (!e.isIntersecting) return;
    once.disconnect();
    if (!reduced) {
      gsap.to(head, { opacity: 1, y: 0, rotationX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, clearProps: 'transform' });
      gsap.to(steps, { opacity: 1, x: 0, rotationY: 0, duration: 1, ease: 'expo.out', stagger: 0.07, delay: 0.2, clearProps: 'transform' });
    }
  }, { threshold: 0.15 });
  once.observe(sec);

  const lazy = new IntersectionObserver(async (list) => { const e = list[list.length - 1]; // latest state wins
    if (!e.isIntersecting) return;
    lazy.disconnect();
    try {
      const [kit, mod] = await Promise.all([import('./three/kit.js'), import('./three/funnel3d.js')]);
      if (!kit.webglAvailable()) return; // the CSS funnel stays
      funnel = mod.mountFunnel({
        host: sec.querySelector('.fx-funnel__canvas'),
        tagsHost: sec.querySelector('.fx-funnel__tags'),
        stages: FUNNEL_STAGES,
        gsap,
        reduced,
      });
      funnel.setActive(active);
      sec.classList.add('is-3d');
    } catch (err) {
      console.warn('[fx] funnel 3D unavailable', err);
    }
  }, { rootMargin: '100% 0px' });
  lazy.observe(sec);

  return sec;
}

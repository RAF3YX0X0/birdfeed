// Trust strip (markup: partials/home-trust.html, styles: trust.css): rating
// cards flip in, their scores count up and their stars fill; cards tilt and
// glow under the pointer. The platform marquee is pure CSS.

export function setupTrust({ section, gsap: G, reduced, finePointer }) {
  const cards = [...section.querySelectorAll('.tr-card')];
  if (reduced) return;

  G.from(section.querySelectorAll('.tr__k, .tr__marquee'), {
    opacity: 0, y: 24, duration: 0.9, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,opacity',
    scrollTrigger: { trigger: section, start: 'top 85%', once: true },
  });

  cards.forEach((c) => c.style.setProperty('--fill', '0'));
  G.set(cards, { opacity: 0, y: 60, rotationX: -35, transformOrigin: '50% 100%' });
  window.ScrollTrigger.create({
    trigger: section.querySelector('.tr__ratings'), start: 'top 85%', once: true,
    onEnter: () => {
      G.to(cards, { opacity: 1, y: 0, rotationX: 0, duration: 1, ease: 'expo.out', stagger: 0.1, clearProps: 'transform,opacity' });
      cards.forEach((card, i) => {
        const b = card.querySelector('.tr-card__score b');
        const to = parseFloat(b.dataset.to);
        const o = { v: 0, f: 0 };
        G.to(o, {
          v: to, f: 1, duration: 1.6, delay: 0.15 + i * 0.1, ease: 'power3.out',
          onUpdate: () => { b.textContent = o.v.toFixed(1); card.style.setProperty('--fill', o.f.toFixed(3)); },
          onComplete: () => { b.textContent = to.toFixed(1); },
        });
      });
    },
  });

  if (!finePointer) return;
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${((x - 0.5) * 10).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
      card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      ['--rx', '--ry', '--gx', '--gy'].forEach((k) => card.style.removeProperty(k));
    });
  });
}

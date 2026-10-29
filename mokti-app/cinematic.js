/* Mokti soft cinematic motion: scroll reveals, pointer depth, 3D books,
   layered project panels and count-up stats. Everything here is optional
   decoration: without this file, or with reduced motion, the pages show
   exactly the same content, flat and still. */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 3D books are static depth, so they stay on even with reduced motion.
  document.querySelectorAll('.guide-card .ebook-cover, .ebook-card .ebook-cover').forEach(cover => {
    const book = document.createElement('span');
    book.className = 'book3d';
    const pages = document.createElement('span');
    pages.className = 'book3d-pages';
    pages.setAttribute('aria-hidden', 'true');
    cover.replaceWith(book);
    book.append(cover, pages);
  });

  if (reduceMotion) return;
  document.documentElement.classList.add('motion-ok');

  // ---------- Scroll reveals (one shared observer) ----------
  const revealTargets = '.section-head, .offer, .process-grid li, .service, .package, .guide-card, .ebook-card, .bundle, .work-item, .work-stats li, .tee, .writing-panel, .cta-inner, .info-inner > *, .feature-text, .work-strip a, .cs-body section, .cs-next';
  const revealer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealer.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }) : null;
  document.querySelectorAll(revealTargets).forEach(el => {
    if (el.closest('.hero')) return;
    el.classList.add('js-reveal');
    if (revealer) revealer.observe(el); else el.classList.add('is-visible');
  });

  // ---------- Count-up for the existing stats (final text is unchanged) ----------
  const counters = [...document.querySelectorAll('.hero-proof strong, .work-stats strong')]
    .map(el => ({ el, text: el.textContent, match: el.textContent.match(/^(\d+)(.*)$/) }))
    .filter(c => c.match);
  const countObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const c = counters.find(c => c.el === entry.target);
      const end = Number(c.match[1]);
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / 1400);
        const eased = 1 - Math.pow(1 - t, 3);
        c.el.textContent = t < 1 ? Math.round(end * eased) + c.match[2] : c.text;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 }) : null;
  if (countObserver) counters.forEach(c => countObserver.observe(c.el));

  // ---------- Scroll-driven depth: hero card and My Work panels ----------
  const heroCard = document.querySelector('.hero-work');
  const hero = heroCard && heroCard.closest('.hero');
  if (heroCard) heroCard.classList.add('depth-stage');
  const panels = [...document.querySelectorAll('.work-gallery .shot, .project-card')];
  document.querySelectorAll('.work-gallery .shot').forEach(p => p.classList.add('panel3d'));
  const stages = [...document.querySelectorAll('.feature-stage')];

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = window.innerHeight;
    if (hero) {
      const r = hero.getBoundingClientRect();
      const hs = Math.min(1, Math.max(0, -r.top / r.height));
      heroCard.style.setProperty('--hs', hs.toFixed(3));
    }
    panels.forEach(panel => {
      const r = panel.getBoundingClientRect();
      // 0 when the panel's top is at the bottom of the screen, 1 once it reaches 70% height.
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.3)));
      panel.style.setProperty('--p', p.toFixed(3));
    });
    stages.forEach(stage => {
      const r = stage.getBoundingClientRect();
      // The featured stage opens out over a longer stretch of scrolling.
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      stage.style.setProperty('--p', p.toFixed(3));
    });
  };
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  // ---------- Pointer tilt (mouse and trackpad only) ----------
  if (!finePointer) return;
  const tiltTargets = '.offer, .process-grid li, .package, .guide-card, .work-stats li, .tee, .work-item, .story-card';
  document.querySelectorAll(tiltTargets).forEach(el => el.classList.add('js-tilt'));
  const tilt = (el, maxX, maxY) => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', (-y * maxX).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (x * maxY).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
    });
  };
  document.querySelectorAll('.js-tilt').forEach(el => tilt(el, 2.4, 3));
  panels.forEach(el => tilt(el, 4, 5));
  stages.forEach(el => tilt(el, 6, 8));
  if (heroCard) tilt(heroCard, 5, 7);
})();

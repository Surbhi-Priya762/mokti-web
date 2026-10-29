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

  // ---------- Demo videos: load and play only while on screen ----------
  const videos = [...document.querySelectorAll('video[data-autoplay]')];
  const player = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        const source = v.querySelector('source[data-src]');
        if (source) { source.src = source.dataset.src; source.removeAttribute('data-src'); v.load(); }
        v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { threshold: 0.25 }) : null;
  if (player) videos.forEach(v => player.observe(v));

  // ---------- Typewriter: the hero's highlighted words type, pause and change ----------
  // The heading keeps its first wording for screen readers (aria-label).
  const typer = document.querySelector('.typer[data-words]');
  if (typer) {
    const h = typer.closest('h1, h2');
    if (h) h.setAttribute('aria-label', h.textContent.trim());
    const words = typer.dataset.words.split('|');
    const out = document.createElement('span');
    out.setAttribute('aria-hidden', 'true');
    out.textContent = words[0];
    typer.textContent = '';
    typer.append(out);
    typer.classList.add('typing');
    let w = 0, n = words[0].length, deleting = true;
    const tick = () => {
      if (deleting) {
        n--;
        if (n <= 0) { deleting = false; w = (w + 1) % words.length; }
      } else {
        n++;
        if (n >= words[w].length) { deleting = true; out.textContent = words[w]; return setTimeout(tick, 2200); }
      }
      out.textContent = words[w].slice(0, Math.max(0, n));
      setTimeout(tick, deleting ? 38 : 75);
    };
    setTimeout(tick, 2600);
  }

  // ---------- Story chapters: pin each one and drive its pieces by scroll ----------
  // --e goes 0 to 1 as a chapter scrolls into view, --p 0 to 1 while it is pinned.
  const story = document.querySelector('.story');
  if (story) {
    story.classList.add('story-on');
    const chapters = [...story.querySelectorAll('.st-chapter')];
    const clamp01 = n => Math.min(1, Math.max(0, n));
    let queued = false;
    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      chapters.forEach(ch => {
        const r = ch.getBoundingClientRect();
        const pin = ch.firstElementChild.offsetHeight;
        const top = parseFloat(getComputedStyle(ch.firstElementChild).top) || 0;
        ch.style.setProperty('--e', clamp01((vh - r.top) / (vh - top)).toFixed(3));
        ch.style.setProperty('--p', clamp01((top - r.top) / (r.height - pin)).toFixed(3));
      });
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }

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
  document.querySelectorAll('.demo-stage').forEach(el => tilt(el, 4, 6));
  if (heroCard) tilt(heroCard, 5, 7);
})();

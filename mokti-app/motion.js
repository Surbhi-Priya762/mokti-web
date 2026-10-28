// ---------- SITE MOTION: phone tilt, before/after, card tilt, count-up, reveal ----------
// Plain JS, no libraries. Everything here is optional polish: the page reads the
// same without it, and visitors who ask for reduced motion get none of it.
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Before / After slider (works with reduced motion too) ----------
  const ba = document.getElementById('ba');
  if (ba) {
    const range = ba.querySelector('.ba-range');
    const set = pct => {
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty('--pos', pct + '%');
      range.value = Math.round(pct);
    };
    const fromEvent = e => {
      const r = ba.getBoundingClientRect();
      set((e.clientX - r.left) / r.width * 100);
    };
    let dragging = false;
    ba.addEventListener('pointerdown', e => {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    ba.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel'].forEach(t => ba.addEventListener(t, () => { dragging = false; }));
    range.addEventListener('input', () => set(+range.value));
    ba.addEventListener('click', () => range.focus({ preventScroll: true }));
  }

  if (reduce) return;

  // ---------- Hero phone: tilt with the mouse, or with the phone itself ----------
  const stage = document.getElementById('hero-stage');
  const tilt = document.getElementById('phone-tilt');
  if (stage && tilt) {
    const base = { x: 4, y: -10 };
    let target = { x: base.x, y: base.y }, cur = { x: base.x, y: base.y }, raf = 0;
    const step = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      tilt.style.setProperty('--rx', cur.x.toFixed(2) + 'deg');
      tilt.style.setProperty('--ry', cur.y.toFixed(2) + 'deg');
      raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const aim = (nx, ny) => { // nx, ny in -1..1
      target = { x: base.x - ny * 7, y: base.y + nx * 10 };
      if (!raf) raf = requestAnimationFrame(step);
    };
    const hero = stage.closest('.hero');
    if (finePointer) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        aim((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
      });
      hero.addEventListener('pointerleave', () => aim(0, 0));
    } else if ('DeviceOrientationEvent' in window) {
      // Android sends this without asking; iOS needs a permission prompt, so it just floats there.
      let start = null;
      window.addEventListener('deviceorientation', e => {
        if (e.beta == null || e.gamma == null) return;
        if (!start) start = { b: e.beta, g: e.gamma };
        const clamp = v => Math.max(-1, Math.min(1, v));
        aim(clamp((e.gamma - start.g) / 25), clamp((e.beta - start.b) / 25));
      }, { passive: true });
    }
  }

  // ---------- Cards: slight 3D tilt on hover (mouse only) ----------
  const CARDS = '.offer, .package, .guide-card, .ebook-card, .process-grid li, .work-stats li, .work-item, .tee, .story-card, .blog-card';
  if (finePointer) {
    document.querySelectorAll(CARDS).forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tx', (-ny * 6).toFixed(2) + 'deg');
        card.style.setProperty('--ty', (nx * 6).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--tx');
        card.style.removeProperty('--ty');
      });
    });
  }

  if (!('IntersectionObserver' in window)) return;

  // ---------- Stats count up when they come into view ----------
  const countUp = el => {
    const end = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const statObs = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    statObs.unobserve(en.target);
    countUp(en.target);
  }), { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = '0' + (el.dataset.suffix || '');
    statObs.observe(el);
  });

  // ---------- Sections fade up gently on scroll ----------
  const targets = document.querySelectorAll(
    'main > section:not(.hero) .section-head, .offer, .ba, .process-grid li, .service-group, .service, ' +
    '.bundle, .guide-card, .ebook-card, .cta-inner, .shot, .tee, .work-stats li, .work-item, .story-card, .blog-card'
  );
  const revealObs = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    revealObs.unobserve(en.target);
    const el = en.target;
    el.classList.add('is-in');
    // hand the transform back to the card's own hover/tilt styles once it has arrived
    setTimeout(() => el.classList.remove('reveal', 'is-in'), 1400);
  }), { rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => {
    // stagger cards that sit side by side
    const i = Array.prototype.indexOf.call(el.parentElement.children, el);
    if (el.matches('.offer, .process-grid li, .guide-card, .ebook-card, .shot, .tee, .work-stats li')) el.style.setProperty('--d', (i % 4) * 0.08 + 's');
    el.classList.add('reveal');
    revealObs.observe(el);
  });
})();

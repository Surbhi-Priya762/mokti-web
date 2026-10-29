/* MOKTI 3D carousel. Cards stand in a ring and turn so each one comes to the front.
   Markup: .c3d[data-c3d] > .c3d-stage > ul.c3d-ring > li.c3d-item, plus optional
   .c3d-prev / .c3d-next / .c3d-pause buttons and a .c3d-status line.
   Turns on its own (not with reduced motion), pauses on hover, focus, touch and
   when off screen. Swipe, arrow buttons and the arrow keys turn it by hand.
   Clicking a side card brings it to the front; clicking the front card follows its link.
   Without JS the ring is a plain sideways-scrolling row. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EVERY = 3000;

  function init(root) {
    if (root._c3d) return root._c3d;
    var stage = root.querySelector('.c3d-stage');
    var ring = root.querySelector('.c3d-ring');
    var items = [].slice.call(ring.children);
    var n = items.length;
    if (n < 3) return null;
    var angle = 360 / n, idx = 0, r = 0;
    var paused = false, holding = false, onScreen = true, swiped = false, ptr = false;
    var status = root.querySelector('.c3d-status');
    var pauseBtn = root.querySelector('.c3d-pause');

    root.classList.add('c3d-on');
    if (reduce && pauseBtn) pauseBtn.hidden = true;

    function front() { return ((idx % n) + n) % n; }

    function layout() {
      var w = items[0].offsetWidth;
      if (!w) return;
      r = Math.round((w / 2) / Math.tan(Math.PI / n) + w * 0.12);
      items.forEach(function (li, i) {
        li.style.transform = 'rotateY(' + (i * angle) + 'deg) translateZ(' + r + 'px)';
      });
      render();
    }

    function render() {
      ring.style.transform = 'translateZ(' + (-r) + 'px) rotateY(' + (-idx * angle) + 'deg)';
      var f = front();
      items.forEach(function (li, i) {
        var d = Math.abs(i - f);
        d = Math.min(d, n - d);
        li.style.setProperty('--d', d);
        li.classList.toggle('is-front', i === f);
        li.classList.toggle('is-far', d > 2);
      });
      if (status) {
        var name = items[f].getAttribute('data-name') || '';
        status.textContent = (f + 1) + ' of ' + n + (name ? ': ' + name : '');
      }
    }

    function go(step) { idx += step; render(); }
    function goTo(i) {
      var delta = i - front();
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      if (delta) go(delta);
    }

    var prev = root.querySelector('.c3d-prev');
    var next = root.querySelector('.c3d-next');
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? 'Play' : 'Pause';
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); focusFront(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); focusFront(); }
    });
    function focusFront() {
      if (!root.contains(document.activeElement) || !document.activeElement.closest('.c3d-item')) return;
      var a = items[front()].querySelector('a, button');
      if (a) a.focus({ preventScroll: true });
    }

    // Tabbing onto a card turns it to the front.
    items.forEach(function (li, i) {
      li.addEventListener('focusin', function () { if (!ptr) goTo(i); stage.scrollLeft = 0; });
      li.addEventListener('click', function (e) {
        if (swiped || i !== front()) { e.preventDefault(); e.stopPropagation(); if (!swiped) goTo(i); }
      }, true);
    });

    // Swipe.
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; swiped = false; holding = true; ptr = true; });
    window.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { swiped = true; go(dx < 0 ? 1 : -1); setTimeout(function () { swiped = false; }, 0); }
      if (e.pointerType !== 'mouse') holding = false;
      setTimeout(function () { ptr = false; }, 0);
    });

    root.addEventListener('mouseenter', function () { holding = true; });
    root.addEventListener('mouseleave', function () { holding = false; });
    root.addEventListener('focusin', function () { holding = true; });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) holding = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }, { threshold: 0.3 }).observe(root);
    }

    if (!reduce) setInterval(function () {
      if (!paused && !holding && onScreen && !document.hidden && root.offsetParent) go(1);
    }, EVERY);

    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(layout, 150); });
    layout();
    // Images can change card width once loaded only if CSS lets them; recheck after load.
    window.addEventListener('load', layout);

    root._c3d = { layout: layout, go: go, goTo: goTo };
    return root._c3d;
  }

  // Tabs that switch between carousels: [role=tablist] buttons with aria-controls.
  function initTabs(list) {
    var tabs = [].slice.call(list.querySelectorAll('[role=tab]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) {
          var c = panel.querySelector('[data-c3d]');
          if (c && c._c3d) c._c3d.layout();
        }
      });
      if (focus) tab.focus();
    }
    // Panels all show without JS; hide the unselected ones now.
    select(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (j === null) return;
        e.preventDefault();
        select(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
  }

  window.C3D = { init: init };
  function start() {
    [].forEach.call(document.querySelectorAll('[data-c3d]'), init);
    [].forEach.call(document.querySelectorAll('[data-c3d-tabs]'), initTabs);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* Mokti demo kit: menu, booking forms, filters, opening hours and a small
   cart. Demo forms never send anything: they show what a real site would
   receive. To reuse for a client, point the forms at Netlify Forms (add
   data-netlify="true" and a name) and remove data-demo-form. */
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = n => '₹' + n.toLocaleString('en-IN');

  // ---------- Mobile menu ----------
  const menuBtn = $('.d-menu'), nav = $('.d-nav');
  if (menuBtn && nav) {
    const set = open => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
    menuBtn.addEventListener('click', () => set(!nav.classList.contains('open')));
    $$('a', nav).forEach(a => a.addEventListener('click', () => set(false)));
  }

  // ---------- Gentle reveals ----------
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  // ---------- "Book this" buttons fill in the booking form ----------
  // <button data-fill="service=Haircut|stylist=Meera" data-go="#book">
  $$('[data-fill]').forEach(btn => btn.addEventListener('click', () => {
    btn.dataset.fill.split('|').forEach(pair => {
      const [name, value] = pair.split('=');
      const field = $(`[data-demo-form] [name="${name}"]`);
      if (field) field.value = value;
    });
    const target = $(btn.dataset.go || '[data-demo-form]');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = $('[data-demo-form] [name="name"]');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 400);
  }));

  // ---------- Dates: no past days ----------
  const today = new Date();
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $$('input[type="date"]').forEach(i => { i.min = iso(today); });

  // ---------- Demo forms: show what the business would receive ----------
  $$('[data-demo-form]').forEach(form => {
    const box = $(form.dataset.confirm || '.confirm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const rows = [...new FormData(form).entries()]
        .filter(([, v]) => String(v).trim())
        .map(([k, v]) => {
          const label = form.querySelector(`[name="${k}"]`)?.closest('label')?.firstChild?.textContent.trim() || k;
          return `<dt>${esc(label)}</dt><dd>${esc(v)}</dd>`;
        }).join('');
      box.innerHTML = `<h3>${esc(form.dataset.thanks || 'Request received')}</h3>
        <p>On a real site, the business would now get this request by email or WhatsApp:</p>
        <dl>${rows}</dl>
        <p class="note">This is a demo, so nothing was sent and nothing was saved.</p>`;
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      box.focus();
      form.reset();
    });
  });
  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }

  // ---------- Filter chips: <div class="chips" data-filter=".item"> <button data-value="all"> ----------
  $$('.chips[data-filter]').forEach(group => {
    const items = () => $$(group.dataset.filter);
    $$('button', group).forEach(b => b.addEventListener('click', () => {
      $$('button', group).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      items().forEach(it => { it.hidden = !(b.dataset.value === 'all' || (it.dataset.tags || '').split(' ').includes(b.dataset.value)); });
    }));
  });

  // ---------- Opening hours: highlight today and say whether it's open ----------
  // <table class="hours" data-hours='{"1":["09:00","20:00"], "0":null}'>, keys are 0 (Sun) to 6 (Sat);
  // each row lists the days it covers: <tr data-day="1 2 3 4 5">
  $$('table.hours[data-hours]').forEach(table => {
    const hours = JSON.parse(table.dataset.hours);
    const day = today.getDay();
    const row = $$('tr[data-day]', table).find(tr => tr.dataset.day.split(' ').includes(String(day)));
    if (row) row.classList.add('today');
    const status = $(table.dataset.status || '.open-now');
    if (!status) return;
    // A day is null (closed), one span ["10:00","20:00"] or several [["09:00","13:00"],["17:00","21:00"]].
    const spans = !hours[day] ? [] : typeof hours[day][0] === 'string' ? [hours[day]] : hours[day];
    const mins = today.getHours() * 60 + today.getMinutes();
    const toM = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const open = spans.find(s => mins >= toM(s[0]) && mins < toM(s[1]));
    status.classList.toggle('is-open', !!open);
    status.textContent = open ? `Open now · until ${open[1]}` : 'Closed now';
  });

  // ---------- Shop: product dialog, sizes and cart (boutique) ----------
  const shop = window.DEMO_SHOP;
  if (!shop) return;
  const key = 'mokti-demo-cart-' + shop.id;
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(key)) || []; } catch (_) { cart = []; }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(cart)); } catch (_) {} };
  const byId = id => shop.products.find(p => p.id === id);

  const grid = $('#products');
  grid.innerHTML = shop.products.map(p => `
    <button class="product reveal in" type="button" data-id="${p.id}" data-tags="${p.tags.join(' ')}" aria-haspopup="dialog">
      <span class="ph"><img src="${p.img}" alt="" width="400" height="500" loading="lazy"></span>
      <span class="tag">${esc(p.collection)}</span>
      <span class="pname">${esc(p.name)}</span>
      <span class="pprice">${money(p.price)}</span>
    </button>`).join('');

  // 3D "turn the rack" ring (carousel.js turns it); each card opens the same product dialog.
  const picks = $('#picks-ring');
  if (picks) {
    picks.innerHTML = shop.products.map(p => `
      <li class="c3d-item" data-name="${esc(p.name)}"><button class="c3d-card" type="button" data-id="${p.id}" aria-haspopup="dialog">
        <img src="${p.img}" alt="" width="400" height="500" loading="lazy" draggable="false">
        <span class="c3d-body"><span class="c3d-kicker">${esc(p.collection)}</span><span class="c3d-name">${esc(p.name)}</span><span class="c3d-price">${money(p.price)}</span></span>
      </button></li>`).join('');
    $$('.c3d-card', picks).forEach(b => b.addEventListener('click', () => $(`.product[data-id="${b.dataset.id}"]`, grid).click()));
  }

  const dlg = $('#product-dialog');
  let current = null, qty = 1;
  const renderQty = () => { $('#pd-qty').value = qty; $('#pd-qty').textContent = qty; };
  $$('.product', grid).forEach(b => b.addEventListener('click', () => {
    current = byId(b.dataset.id); qty = 1;
    $('#pd-img').src = current.img;
    $('#pd-img').alt = current.alt;
    $('#pd-tag').textContent = current.collection;
    $('#pd-name').textContent = current.name;
    $('#pd-price').textContent = money(current.price);
    $('#pd-desc').textContent = current.desc;
    $('#pd-sizes').innerHTML = `<legend>${current.sizeLabel || 'Size'}</legend>` + current.sizes.map((s, i) => `
      <label><input type="radio" name="size" value="${s}" ${current.soldOut?.includes(s) ? 'disabled' : ''} ${i === current.sizes.findIndex(x => !current.soldOut?.includes(x)) ? 'checked' : ''}><span>${s}</span></label>`).join('');
    $('#pd-note').textContent = current.soldOut?.length ? `Sold out in ${current.soldOut.join(', ')}.` : '';
    renderQty();
    dlg.showModal();
  }));
  $('#pd-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); renderQty(); });
  $('#pd-plus').addEventListener('click', () => { qty = Math.min(9, qty + 1); renderQty(); });
  $('#pd-add').addEventListener('click', () => {
    const size = $('#pd-sizes input:checked')?.value;
    const line = cart.find(l => l.id === current.id && l.size === size);
    if (line) line.qty = Math.min(9, line.qty + qty); else cart.push({ id: current.id, size, qty });
    save(); renderCart(); dlg.close();
    openCart();
  });
  $$('dialog .close-x').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  const drawer = $('#cart');
  const openCart = () => { $('#order-preview').hidden = true; drawer.showModal(); };
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', openCart));
  function renderCart(){
    const n = cart.reduce((a, l) => a + l.qty, 0);
    $$('.cart-count').forEach(c => { c.textContent = n; c.dataset.n = n; });
    const list = $('#cart-items');
    list.innerHTML = cart.length ? cart.map((l, i) => {
      const p = byId(l.id);
      return `<li><img src="${p.img}" alt=""><div><strong>${esc(p.name)}</strong><br><span class="meta">${esc(l.size)} · Qty ${l.qty}</span><br><button class="rm" type="button" data-i="${i}">Remove</button></div><span>${money(p.price * l.qty)}</span></li>`;
    }).join('') : '<li class="meta">Your bag is empty.</li>';
    $$('.rm', list).forEach(b => b.addEventListener('click', () => { cart.splice(Number(b.dataset.i), 1); save(); renderCart(); }));
    $('#cart-total').textContent = money(cart.reduce((a, l) => a + byId(l.id).price * l.qty, 0));
    $('#checkout').disabled = !cart.length;
  }
  $('#checkout').addEventListener('click', () => {
    const lines = cart.map(l => { const p = byId(l.id); return `• ${p.name} (${l.size}) x${l.qty} = ${money(p.price * l.qty)}`; });
    const total = cart.reduce((a, l) => a + byId(l.id).price * l.qty, 0);
    const msg = `Hello ${shop.name}! I'd like to order:\n${lines.join('\n')}\nTotal: ${money(total)}`;
    const pre = $('#order-preview');
    pre.textContent = msg + '\n\n(Demo: on a real site this opens WhatsApp with the message ready to send. Nothing was sent.)';
    pre.hidden = false;
  });
  cart = cart.filter(l => byId(l.id));
  renderCart();
})();

// ---------- HEADER MENU (mobile) ----------
const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');
function setMenu(open){
  siteNav.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('open')));
siteNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

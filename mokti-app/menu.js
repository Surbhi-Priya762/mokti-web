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

// ---------- NETLIFY FORMS: send in the background, show the result inline ----------
// A plain POST leaves the visitor on Netlify's own page, which is a bare error
// page when the submission is refused. Posting with fetch keeps them here and,
// if it fails, hands them a ready-made email so the message still reaches Surbhi.
const OWNER_EMAIL = 'surbhi7priya@gmail.com';
document.querySelectorAll('form[data-netlify]:not([hidden])').forEach(form => {
  let note = form.nextElementSibling;
  if (!note || !note.classList.contains('form-note')) {
    note = document.createElement('p');
    note.className = 'form-note';
    note.textContent = "Thank you, I'll get back to you soon. 🤍";
    note.hidden = true;
    form.after(note);
  }
  const thanks = note.textContent;
  const button = form.querySelector('[type="submit"]');
  const buttonText = button.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      form.hidden = true;
      note.classList.remove('form-error');
      note.textContent = thanks;
    } catch (err) {
      const lines = [];
      data.forEach((value, key) => {
        if (key !== 'form-name' && key !== 'bot-field' && String(value).trim()) lines.push(key + ': ' + value);
      });
      const mailto = 'mailto:' + OWNER_EMAIL +
        '?subject=' + encodeURIComponent('Mokti ' + data.get('form-name').replace('mokti-', '')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      note.classList.add('form-error');
      note.textContent = "Sorry, that didn't go through. ";
      const link = document.createElement('a');
      link.href = mailto;
      link.textContent = 'Send it by email instead';
      note.append(link, ' or WhatsApp me on +91 8317369573.');
    } finally {
      button.disabled = false;
      button.textContent = buttonText;
      note.hidden = false;
    }
  });
});

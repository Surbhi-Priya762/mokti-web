// ---------- CONFIG: paste your real Razorpay Payment Page/Link URLs here ----------
const RAZORPAY_LINKS = {
  stories: "https://rzp.io/l/PASTE-YOUR-STORIES-LINK",
  experience: "https://rzp.io/l/PASTE-YOUR-EXPERIENCE-LINK",
  ebookWasThatLove: "https://rzp.io/rzp/xuC5BcP",
  ebookCoincidence: "https://rzp.io/rzp/dh78raYc",
  ebookLoveYourselfFirst: "https://rzp.io/rzp/Ra1Myen",
  ebookHealingAfterHeartbreak: "https://rzp.io/rzp/k4L1DvGT",
  ebookDearMe: "https://rzp.io/rzp/CnVMKw7I",
  ebookTextMeBack: "https://rzp.io/rzp/7bQdoLCD",
  ebookRedFlagsGreenFlags: "https://rzp.io/rzp/KUMn3GV",
  ebookLettersINeverSent: "https://rzp.io/rzp/L5AUD4Mg",
  ebookMilesApart: "https://rzp.io/rzp/mikOQkT",
  ebookStoriesWeNeverTold: "https://rzp.io/rzp/wNLnwfk",
  bundleAll: "https://rzp.io/rzp/yl5ewD1N"
};
document.querySelectorAll('[data-razorpay]').forEach(el => {
  const key = el.getAttribute('data-razorpay');
  if (RAZORPAY_LINKS[key]) el.href = RAZORPAY_LINKS[key];
});

// ---------- WRITING TABS (Journal, Quotes, Experience, ...) ----------
const tabs = document.querySelectorAll('.writing-tabs .tab');
const panes = document.querySelectorAll('.writing-panel .pane');

function showTab(target){
  tabs.forEach(t => t.classList.toggle('active', t.dataset.target === target));
  panes.forEach(p => p.classList.toggle('active', p.id === target));
}

tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.target)));

// ---------- JOURNAL (localStorage, this device only) ----------
const STORAGE_KEY = 'mokti_journal_entries';
const journalList = document.getElementById('journal-list');
const publicToggle = document.getElementById('public-toggle');
const toggleLabel = document.getElementById('toggle-label-text');
const saveBtn = document.getElementById('save-entry');
const entryBox = document.getElementById('journal-entry');

publicToggle.addEventListener('change', () => {
  toggleLabel.textContent = publicToggle.checked ? 'Public' : 'Private';
});

function loadEntries(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveEntries(entries){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries(){
  const entries = loadEntries();
  if(entries.length === 0){
    journalList.innerHTML = '<p class="empty-note">Your saved entries will appear here.</p>';
    return;
  }
  journalList.innerHTML = entries.slice().reverse().map(e => `
    <div class="entry-card ${e.isPublic ? 'public' : ''}">
      <div class="entry-meta">
        <span class="${e.isPublic ? 'dot-public' : 'dot-private'}">${e.isPublic ? '● Public' : '● Private'}</span>
        <span>${new Date(e.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</span>
      </div>
      <div class="entry-text">${escapeHtml(e.text)}</div>
    </div>
  `).join('');
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

saveBtn.addEventListener('click', () => {
  const text = entryBox.value.trim();
  if(!text) return;
  const entries = loadEntries();
  entries.push({ text, isPublic: publicToggle.checked, date: Date.now() });
  saveEntries(entries);
  entryBox.value = '';
  publicToggle.checked = false;
  toggleLabel.textContent = 'Private';
  renderEntries();
  renderQuoteFeed();
});

// ---------- QUOTES FEED ----------
const seedQuotes = [
  { text: "Kuch cheezein bina kahe bhi samajh aa jaati hain.", source: "Mokti" },
  { text: "You don't have to explain your healing to anyone.", source: "Mokti" },
  { text: "Khud se milna, sabse zaroori mulakaat hai.", source: "Mokti" }
];

function renderQuoteFeed(){
  const feed = document.getElementById('quote-feed');
  const publicEntries = loadEntries().filter(e => e.isPublic).map(e => ({ text: e.text, source: 'from a journal page' }));
  const userQuotes = loadEntries().__quotes || [];
  const all = [...seedQuotes, ...publicEntries];
  feed.innerHTML = all.slice().reverse().map(q => `
    <div class="quote-card">
      <p class="quote-text">"${escapeHtml(q.text)}"</p>
      <p class="quote-source">— ${escapeHtml(q.source)}</p>
    </div>
  `).join('');
}

const QUOTE_KEY = 'mokti_user_quotes';
function loadUserQuotes(){
  try { return JSON.parse(localStorage.getItem(QUOTE_KEY)) || []; }
  catch { return []; }
}
function saveUserQuotes(list){ localStorage.setItem(QUOTE_KEY, JSON.stringify(list)); }

document.getElementById('quote-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('quote-input');
  const text = input.value.trim();
  if(!text) return;
  const list = loadUserQuotes();
  list.push({ text, source: 'you' });
  saveUserQuotes(list);
  input.value = '';
  renderQuoteFeedFull();
});

function renderQuoteFeedFull(){
  const feed = document.getElementById('quote-feed');
  const publicEntries = loadEntries().filter(e => e.isPublic).map(e => ({ text: e.text, source: 'from a journal page' }));
  const userQuotes = loadUserQuotes();
  const all = [...seedQuotes, ...publicEntries, ...userQuotes];
  feed.innerHTML = all.slice().reverse().map(q => `
    <div class="quote-card">
      <p class="quote-text">"${escapeHtml(q.text)}"</p>
      <p class="quote-source">— ${escapeHtml(q.source)}</p>
    </div>
  `).join('');
}

// ---------- YOU FORM: anonymous toggle ----------
const anonCheck = document.getElementById('anon-check');
const identityFields = document.getElementById('identity-fields');
anonCheck.addEventListener('change', () => {
  identityFields.style.display = anonCheck.checked ? 'none' : 'flex';
  identityFields.style.flexDirection = 'column';
});

const youForm = document.getElementById('you-form');
youForm.addEventListener('submit', () => {
  // Netlify handles the actual submission + redirect via its own form endpoint.
  // This just shows a friendly inline note if JS runs before redirect.
  document.getElementById('you-note').hidden = false;
});

// ---------- SERVICES: "Enquire" pre-fills the enquiry form ----------
const enquiryService = document.getElementById('enquiry-service');
const enquiryPackage = document.getElementById('enquiry-package');
document.querySelectorAll('[data-enquire]').forEach(btn => {
  btn.addEventListener('click', () => {
    const [service, pkg] = btn.dataset.enquire.split('|');
    enquiryService.value = service;
    enquiryPackage.value = pkg;
    document.getElementById('enquiry').scrollIntoView({behavior:'smooth'});
  });
});

document.getElementById('enquiry-form').addEventListener('submit', () => {
  document.getElementById('enquiry-note').hidden = false;
});

// ---------- INIT ----------
renderEntries();
renderQuoteFeedFull();

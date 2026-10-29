// Builds the blog from blog/posts/*.md (written in the /admin editor or by hand).
// Runs on every Netlify deploy (netlify.toml) and locally with `node scripts/build-blog.mjs`.
// Writes blog/index.html, blog/<slug>/index.html and blog/posts.json. Plain Node, no packages.
// A bad post is skipped with a warning; it never stops the deploy.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mokti.in';
const postsDir = join(root, 'blog', 'posts');
const outDir = join(root, 'blog');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Front matter: the small YAML subset the editor writes ----------
function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    if (/^[>|][+-]?$/.test(val)) {
      // Block scalar: > folds lines into one, | keeps line breaks.
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === '')) block.push(lines[++i].trim());
      val = val[0] === '>' ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n').trim();
    } else if (/^'.*'$/.test(val)) val = val.slice(1, -1).replace(/''/g, "'");
    else if (/^".*"$/.test(val)) val = JSON.parse(val);
    data[key] = val;
  }
  return { data, body: m[2] };
}

// ---------- Markdown: headings, lists, quotes, images, links, bold, italic, code ----------
function safeUrl(u) {
  u = u.trim();
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u) || !/^[a-z]+:/i.test(u) ? u : '#';
}
function inline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, src) => `<img src="${safeUrl(src)}" alt="${alt}" loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, t, href) => {
    const u = safeUrl(href);
    const ext = /^https?:\/\//.test(u) && !u.startsWith(SITE);
    return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
  });
  // Bold and italic only touch text between tags, so link URLs with _ or * stay intact.
  s = s.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : part
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a, b) => `<strong>${a || b}</strong>`)
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>')).join('');
  s = s.replace(/ {2,}\n|\\\n/g, '<br>\n');
  return s;
}
function markdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join('\n'))}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (/^```/.test(line)) {
      flush();
      const code = [];
      while (++i < lines.length && !/^```/.test(lines[i])) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
      i++; continue;
    }
    if (!line.trim()) { flush(); i++; continue; }
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flush();
      const level = Math.min(6, Math.max(2, m[1].length)); // the post title is the only h1
      out.push(`<h${level}>${inline(m[2].replace(/\s+#+\s*$/, ''))}</h${level}>`);
      i++; continue;
    }
    if (/^(\*\s*\*\s*\*|-\s*-\s*-|_\s*_\s*_)[\s*_-]*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      flush();
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${markdown(q.join('\n'))}</blockquote>`);
      continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      flush();
      const ordered = /^\s*\d+[.)]/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) item += '\n' + lines[i++].trim();
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    para.push(line);
    i++;
  }
  flush();
  return out.join('\n');
}

// ---------- Page shell: header and footer come from about.html, so the menu stays in sync ----------
const about = readFileSync(join(root, 'about.html'), 'utf8');
const absolutise = html => html
  .replace(/(href|src)="(?!https?:|\/|#|mailto:|tel:)([^"]*)"/g, '$1="/$2"')
  .replace(/href="\/index\.html/g, 'href="/')
  .replace(/ aria-current="page"/g, '');
const header = absolutise(about.match(/<header class="site-header">[\s\S]*?<\/header>/)[0])
  .replace('<a href="/blog/">Blog</a>', '<a href="/blog/" aria-current="page">Blog</a>');
const footer = absolutise(about.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0]);
const fontLinks = about.match(/<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts[^>]*>/)[0];

const page = ({ title, description, canonical, image, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${esc(image)}">\n` : ''}${fontLinks}
<link rel="stylesheet" href="/style.css">
</head>
<body class="info-page blog-page">

${header}

<main class="info">
${body}
</main>

${footer}

<script src="/menu.js"></script>
<script src="/cinematic.js"></script>
</body>
</html>
`;

const fmtDate = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
const absUrl = u => !u ? '' : /^https?:/.test(u) ? u : SITE + (u.startsWith('/') ? u : '/' + u);

// ---------- Read posts ----------
const posts = [];
if (existsSync(postsDir)) {
  for (const file of readdirSync(postsDir).filter(f => f.endsWith('.md')).sort()) {
    try {
      const { data, body } = parseFrontMatter(readFileSync(join(postsDir, file), 'utf8'));
      const slug = file.replace(/\.md$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      if (!slug || !data.title) throw new Error('needs a title');
      const date = new Date(data.date || Date.now());
      if (isNaN(date)) throw new Error(`bad date "${data.date}"`);
      if (String(data.draft) === 'true') continue;
      posts.push({ slug, title: data.title, date, summary: data.summary || '', cover: data.cover || '', coverAlt: data.cover_alt || '', html: markdown(body) });
    } catch (e) {
      console.warn(`blog: skipped ${file}: ${e.message}`);
    }
  }
}
posts.sort((a, b) => b.date - a.date);

// ---------- Clean old output, keep posts/, images/ and the hand-written files ----------
const keep = new Set(['posts', 'images', 'blog.js']);
for (const name of readdirSync(outDir)) {
  if (keep.has(name)) continue;
  rmSync(join(outDir, name), { recursive: true, force: true });
}

// ---------- Post pages ----------
const card = p => `
    <a class="post-card" href="/blog/${p.slug}/">
      ${p.cover ? `<span class="post-cover"><img src="${esc(p.cover)}" alt="" loading="lazy"></span>` : '<span class="post-cover post-cover-none" aria-hidden="true">M</span>'}
      <span class="post-meta"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time></span>
      <span class="post-title">${esc(p.title)}</span>
      ${p.summary ? `<span class="post-summary">${esc(p.summary)}</span>` : ''}
      <span class="post-read">Read →</span>
    </a>`;

for (const [n, p] of posts.entries()) {
  const next = posts[n + 1], prev = posts[n - 1];
  const url = `${SITE}/blog/${p.slug}/`;
  const share = `https://wa.me/?text=${encodeURIComponent(`${p.title} ${url}`)}`;
  const body = `<article class="container post">
  <p class="post-back"><a href="/blog/">← All posts</a></p>
  <header class="post-head">
    <p class="eyebrow"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time> · Surbhi Priya</p>
    <h1>${esc(p.title)}</h1>
    ${p.summary ? `<p class="post-lede">${esc(p.summary)}</p>` : ''}
  </header>
  ${p.cover ? `<figure class="post-hero"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}"></figure>` : ''}
  <div class="post-body">
${p.html}
  </div>
  <footer class="post-foot">
    <a class="btn-outline" href="${share}" target="_blank" rel="noopener">Share on WhatsApp</a>
    <a class="btn-ink" href="/#enquiry">Start a project</a>
  </footer>
  <nav class="post-nav" aria-label="More posts">
    ${next ? `<a href="/blog/${next.slug}/"><span>Older</span>${esc(next.title)}</a>` : '<span></span>'}
    ${prev ? `<a class="post-nav-newer" href="/blog/${prev.slug}/"><span>Newer</span>${esc(prev.title)}</a>` : ''}
  </nav>
</article>`;
  mkdirSync(join(outDir, p.slug), { recursive: true });
  writeFileSync(join(outDir, p.slug, 'index.html'), page({
    title: `${p.title} — Mokti blog`, description: p.summary || `${p.title}, by Surbhi Priya.`,
    canonical: url, image: absUrl(p.cover), body,
  }));
}

// ---------- Blog home ----------
writeFileSync(join(outDir, 'index.html'), page({
  title: 'Blog — Mokti',
  description: 'Notes on websites, selling online, design and AI for small business owners, by Surbhi Priya.',
  canonical: `${SITE}/blog/`,
  body: `<div class="container blog-index">
  <p class="eyebrow">the mokti blog</p>
  <h1>Notes on websites, selling online and AI</h1>
  <p class="section-intro">Practical posts for small business owners, written by me.</p>
  ${posts.length ? `<div class="post-grid">${posts.map(card).join('')}\n  </div>` : '<p class="post-empty">The first post is on its way. Check back soon.</p>'}
</div>`,
}));

// ---------- Feed for the home page's "From the blog" strip ----------
writeFileSync(join(outDir, 'posts.json'), JSON.stringify(posts.map(p => ({
  title: p.title, date: p.date.toISOString(), dateText: fmtDate(p.date), summary: p.summary, cover: p.cover, url: `/blog/${p.slug}/`,
})), null, 2));

console.log(`blog: built ${posts.length} post${posts.length === 1 ? '' : 's'}`);

// Home page "From the blog": shows the newest posts from blog/posts.json,
// which scripts/build-blog.mjs writes on every deploy.
(() => {
  const grid = document.getElementById('latest-posts');
  if (!grid) return;
  const empty = document.getElementById('latest-posts-empty');
  const limit = Number(grid.dataset.limit) || 3;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  fetch('blog/posts.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : []))
    .catch(() => [])
    .then(posts => {
      if (!posts.length) return;
      empty.hidden = true;
      grid.innerHTML = posts.slice(0, limit).map(p => `
        <a class="post-card" href="${esc(p.url)}">
          ${p.cover ? `<span class="post-cover"><img src="${esc(p.cover)}" alt="" loading="lazy"></span>` : '<span class="post-cover post-cover-none" aria-hidden="true">M</span>'}
          <span class="post-meta"><time datetime="${esc(p.date)}">${esc(p.dateText)}</time></span>
          <span class="post-title">${esc(p.title)}</span>
          ${p.summary ? `<span class="post-summary">${esc(p.summary)}</span>` : ''}
          <span class="post-read">Read →</span>
        </a>`).join('');
    });
})();

# Mokti — v1 Web App

The mokti.in website: a one-page site with a header menu (Home, Ebooks, Services, Writing, About, Contact). The home page covers a hero, the 2 ebooks, Services with an enquiry form, and a Writing area (Blog, Quotes, Experience, Stories, Share yours). The Journal has its own page, `journal.html`, and uses the same code in `app.js`. The About, Contact, Terms, Refund and Privacy pages are separate HTML files that share the same header and footer. The header menu lives in `menu.js`, the rest of the page logic is in `app.js`, and the optional motion and 3D effects (scroll reveals, 3D books, layered project panels, count-up stats) are in `cinematic.js`, which switches itself off for visitors who prefer reduced motion.

My Work (`work.html`) is a project gallery: one featured project in a layered 3D stage, three project cards, then every screenshot by group. Each featured project has a case study page in `work/` (`mokti-site.html`, `storeily.html`, `dashboards.html`, `python-apps.html`) with the job, what I did, the features visible in the screenshots, and a screenshot gallery. To add a case study, copy one of those pages, change the text and images, and add a card for it in `work.html` and in the `work-strip` on the home page. Only describe features you can see in the screenshots or in the code.

To publish a blog post, open `index.html`, find `blog-grid`, add an `<article class="blog-card">` inside it (the comment above it shows the markup), and delete the `blog-empty` block.

## Before you launch — 5 things to edit

1. **Razorpay links** — all 10 ebooks and the bundle already have their real links at the top of `app.js`. Paste your links for `stories` and `experience` in place of the placeholders.
2. **Real content** — swap the placeholder story/blog text in `index.html` for your actual writing.
3. **Ebook prices** — prices and button text live in the `EBOOKS` section of `index.html`. If you change a price, change it in Razorpay too. Never put the ebook PDFs in this repo: the site is public, so anyone could download them for free.
4. **Your 3 stories + free chapter** — right now "Read chapter →" doesn't link anywhere real; wire it to wherever that content lives (a PDF, a private page, an email).
5. **About, Contact, Terms, Refund and Privacy pages** — open `about.html`, `contact.html`, `terms.html`, `refund-policy.html` and `privacy-policy.html` and replace every highlighted `[FILL IN: …]` with your own details. Razorpay checks for these pages when it activates your account.

## Automatic ebook emails

When someone pays on a Razorpay Payment Page, Razorpay tells the website (a "webhook"), and `netlify/functions/razorpay-webhook.mjs` emails the buyer their PDF as an attachment through [Resend](https://resend.com). Bundles get every PDF in one email. The buyer's email comes from the Email field Razorpay already asks for.

- Which page sends which PDF is in `netlify/lib/products.mjs`. It matches on the page title, and on the price for the two bundles.
- The PDFs stay in your Google Drive. Each one's share link goes in a Netlify environment variable (list below), so they never appear in this public repo.
- If the website can't tell which ebook was bought, or an email fails, you get an "Action needed" email at surbhi7priya@gmail.com with the buyer's details so you can send it by hand.
- Buyers who reply to the ebook email reach surbhi7priya@gmail.com.

### One-time setup

1. **Resend:** sign up free at resend.com (3,000 emails a month). Go to **Domains → Add domain → mokti.in** and add the DNS records it shows wherever mokti.in's DNS lives (Netlify DNS or your domain registrar). Wait for it to say Verified. Then **API Keys → Create API key** and copy it.
2. **Google Drive:** for each PDF, right-click → Share → General access → **Anyone with the link**, then Copy link.
3. **Netlify:** Site configuration → Environment variables → Add a variable → **Import from a .env file**, paste the block below with your values filled in, and save.

   ```
   RESEND_API_KEY=
   RAZORPAY_WEBHOOK_SECRET=
   PDF_WAS_THAT_LOVE=
   PDF_COINCIDENCE=
   PDF_LOVE_YOURSELF_FIRST=
   PDF_HEALING_AFTER_HEARTBREAK=
   PDF_DEAR_ME=
   PDF_TEXT_ME_BACK=
   PDF_RED_FLAGS_GREEN_FLAGS=
   PDF_LETTERS_I_NEVER_SENT=
   PDF_MILES_APART=
   PDF_STORIES_WE_NEVER_TOLD=
   PDF_CLAUDE_MADE_SIMPLE=
   PDF_PROMPT_LIKE_A_PRO=
   PDF_AI_EVERYDAY_LIFE=
   PDF_AUTOMATE_IT=
   PDF_TEACH_CLAUDE_SKILLS=
   PDF_AI_STUDENTS_JOBS=
   PDF_AI_INSTAGRAM_BUSINESS=
   ```

   `RAZORPAY_WEBHOOK_SECRET` is any long password you make up; you'll type the same one into Razorpay next. Then **Deploys → Trigger deploy** so the site picks up the new values.
4. **Razorpay:** Account & Settings → Webhooks → **Add New Webhook**. Webhook URL `https://mokti.in/api/razorpay-webhook`, Secret = the same password as above, Active events: tick only **payment_page.paid** (the only event that says which Payment Page was bought). Save.
5. **Success message:** on each Payment Page, change the message after payment to something like "Thank you! Your ebook is on its way to your email inbox. If you don't see it in a few minutes, check Spam or email surbhi7priya@gmail.com." and remove the Drive link.
6. **Test:** buy the cheapest ebook once yourself with your own email, check it arrives, then refund it from the Razorpay dashboard.

Keep each PDF under about 25 MB so it can be attached. A bigger file is sent as its Drive link instead.

## Important limitation — read this

The Journal's private/public toggle currently saves to **this browser only** (localStorage). That means:
- It works great as a personal daily-journal habit on your own phone.
- "Public" entries only show up in the Quotes feed **on your own device** — they will NOT be visible to other visitors on the live site yet, because there's no shared database.

To make Public entries actually visible to everyone (real community feature), you'll need a backend — the easiest add-on is **Supabase** (free tier, ~30 min to wire up) or **Firebase**. I can build that layer next once you've seen this version live and are happy with the direction.

The **You** submission form is already fully real — it uses Netlify Forms, so submissions land directly in your Netlify dashboard inbox with no extra setup.

---

## Step-by-step: Launch on Netlify

### 1. Put the code on GitHub
1. Go to [github.com](https://github.com) → New repository → name it `mokti-web`.
2. On your computer, download this project folder, then in a terminal inside it run:
   ```
   git init
   git add .
   git commit -m "Mokti v1"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mokti-web.git
   git push -u origin main
   ```
   (No terminal? GitHub also lets you drag-and-drop the files directly into the repo via "Add file → Upload files".)

### 2. Connect Netlify
1. Go to [app.netlify.com](https://app.netlify.com) → sign in (GitHub login is easiest).
2. Click **Add new site → Import an existing project**.
3. Choose GitHub, then select the `mokti-web` repo.
4. Build settings: leave **Build command blank**, **Publish directory** = `.` (already set in `netlify.toml`).
5. Click **Deploy site**.

Netlify gives you a live link immediately, like `random-name-123.netlify.app`.

### 3. Connect your domain (mokti.in)
1. In your new site → **Domain settings → Add a domain** → enter `mokti.in`.
2. Netlify will show you DNS records (usually an A record + CNAME).
3. Go to wherever you bought mokti.in (GoDaddy / Namecheap / etc.) → DNS settings → add those records.
4. Wait 10 minutes–24 hours for DNS to propagate. Netlify auto-issues free HTTPS once it detects the domain is pointed correctly.

### 4. Turn on form notifications
1. In Netlify → **Forms** tab → you'll see `mokti-experience` listed once someone submits.
2. Site settings → Forms → Form notifications → **Add notification → Email notification** → put in your email so you get pinged the moment someone shares their experience.

### 5. Test before sharing the link
- Submit a test entry through **You** → confirm it shows in Netlify's Forms tab.
- Write a journal entry, mark it public, check it appears in Quotes (on the same device).
- Click both "Unlock" buttons and both ebook "Buy" buttons and confirm they go to your real Razorpay links.

---

## What to build next (in order I'd suggest)
1. Real Razorpay links + real story/chapter content (today).
2. Supabase backend so Public journal entries + Quotes are visible to *everyone*, not just you.
3. Simple content-unlock-after-payment flow (email delivery to start, automated later).
4. Blog Post section pulling from real posts instead of placeholders.

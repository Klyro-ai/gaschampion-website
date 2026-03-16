# Analytics Setup Guide

This site has analytics pre-wired. You just need to paste in your IDs. No code changes needed beyond one file.

**Config file:** `src/config/analytics.ts`

---

## Step 1: Microsoft Clarity (Free — Heatmaps & Session Recordings)

Clarity shows you exactly how visitors use your site — where they click, how far they scroll, and what makes them leave. It records real visitor sessions you can watch back.

### Setup

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com)
2. Sign in with a Microsoft account (or create one free)
3. Click **"New project"**
4. Enter `gaschampion.co.uk` as the website URL
5. Clarity will give you a **Project ID** — it looks like a short string like `abc123xyz`
6. Open `src/config/analytics.ts` and replace `PASTE_YOUR_CLARITY_ID_HERE` with your Project ID:

```ts
clarity: {
  enabled: true,
  projectId: 'abc123xyz',  // ← your actual ID here
},
```

7. Deploy the site. Clarity will start recording within a few hours.

### What you get

- **Heatmaps** — see where visitors click and how far they scroll
- **Session recordings** — watch real visitors using your site
- **Rage clicks** — find out where people click repeatedly (frustration signals)
- **Dead clicks** — find buttons or links that don't work as expected
- **Dashboard:** [clarity.microsoft.com/projects](https://clarity.microsoft.com/projects)

---

## Step 2: Google Search Console (Free — Search Performance)

Search Console shows you which Google searches bring visitors to your site, which pages rank, and any indexing problems.

### Setup

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Sign in with a Google account
3. Click **"Add property"** → choose **"URL prefix"** → enter `https://gaschampion.co.uk`
4. Choose the **"HTML tag"** verification method
5. Copy the `content` value from the meta tag they give you — it looks like `google1234567890abcdef`
6. Open `src/config/analytics.ts` and replace `PASTE_YOUR_SEARCH_CONSOLE_ID_HERE`:

```ts
searchConsole: {
  verificationId: 'google1234567890abcdef',  // ← your actual code here
},
```

7. Deploy the site, then click **"Verify"** in Search Console
8. Submit the sitemap: go to **Sitemaps** in the left menu → enter `sitemap-index.xml` → click Submit

### What you get

- **Search queries** — which Google searches show your site
- **Click-through rates** — how often people click when they see you
- **Page indexing** — which pages Google has indexed
- **Core Web Vitals** — performance scores from real visitors
- **Crawl errors** — find and fix broken pages
- **Dashboard:** [search.google.com/search-console](https://search.google.com/search-console)

---

## Step 3: Plausible Analytics (Optional — Paid, Privacy-Friendly)

Plausible is a lightweight, privacy-friendly alternative to Google Analytics. It doesn't use cookies, is GDPR-compliant by default, and won't slow your site down.

**This is OFF by default.** No scripts are loaded until you enable it.

### Setup

1. Go to [plausible.io](https://plausible.io) and sign up (30-day free trial, then from €9/month)
2. Add your site: `gaschampion.co.uk`
3. Open `src/config/analytics.ts` and set:

```ts
plausible: {
  enabled: true,
  domain: 'gaschampion.co.uk',
},
```

4. Deploy. Data will appear in your Plausible dashboard within minutes.

### What you get

- **Visitor counts** — real-time and historical
- **Top pages** — which pages get the most traffic
- **Traffic sources** — where visitors come from (Google, social, direct)
- **Location data** — which towns/cities your visitors are in
- **Custom events** — phone clicks, form submissions (already wired up)
- **Dashboard:** [plausible.io/gaschampion.co.uk](https://plausible.io/gaschampion.co.uk)

### Custom events already tracked

When Plausible is enabled, the site automatically tracks:

| Event | When it fires |
|-------|--------------|
| Phone Click | Visitor taps a phone number link |
| Form Submit | Visitor submits the quote request form |
| WhatsApp Click | Visitor taps a WhatsApp link |
| Directions Click | Visitor taps a directions/map link |

You can see these in Plausible under **Goal Conversions**.

---

## Cloudflare Analytics (Free — No Setup Needed)

If you deploy to Cloudflare Pages, you get built-in analytics automatically:

- **Web Traffic** — visitor counts, page views, unique visitors
- **Performance** — load times by country and device
- **Security** — blocked threats, bot traffic
- **Dashboard:** Your Cloudflare dashboard → the site → Analytics

No code or configuration needed — it works at the network level.

---

## Summary

| Tool | Cost | Default | What it does |
|------|------|---------|-------------|
| Clarity | Free | ON (needs ID) | Heatmaps, session recordings, rage clicks |
| Search Console | Free | ON (needs ID) | Search rankings, indexing, Core Web Vitals |
| Plausible | €9/mo | OFF | Privacy-friendly visitor analytics |
| Cloudflare | Free | Automatic | Traffic stats, performance, security |

---

## Performance Impact

- **Clarity:** ~17KB async script — loads after page content, zero render blocking
- **Search Console:** Zero impact — it's just a meta tag
- **Plausible:** ~1KB script with `defer` — smallest analytics script available
- **When disabled:** Zero scripts loaded, zero bytes, zero impact

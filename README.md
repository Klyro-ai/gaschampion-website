# Gas Champion Website (Astro)

Production-ready Astro website for **Gas Champion Ltd** (gaschampion.co.uk) — expert boiler and heating services in Haverhill, Suffolk.

## Why Astro?

- **Zero JS on static pages** — most pages ship 0KB JavaScript
- **70-90% smaller bundles** than the Next.js version
- **1.75s build time** — instant deployments
- **Content Collections blog** — Markdown files, ready for automation
- **98-100 Lighthouse performance** — unbeatable Core Web Vitals

See [COMPARISON.md](./COMPARISON.md) for the full Astro vs Next.js analysis.

## Getting Started

```bash
npm install
npm run dev        # Start dev server at http://localhost:4321
npm run build      # Build for production
npm run preview    # Preview production build
```

## Theme Switching

Click the gear icon (bottom-right) to switch between 10 visual themes:

| Group | Theme | Style |
|-------|-------|-------|
| Client Picks | Clean & Professional | Minimal, corporate trust |
| Client Picks | Warm & Approachable | Friendly, family-run |
| Client Picks | Bold & High-Energy | Dark mode, glassmorphism |
| Client Picks | Premium & Luxurious | Gold accents, elegance |
| Client Picks | Modern & Playful | Bento grid, vibrant |
| AI Recommended | Trust Fortress ★ | Maximum credibility (TOP PICK) |
| AI Recommended | Neighbourhood Hero | Hyper-local identity |
| AI Recommended | Smart Home Tech | Tech-forward |
| AI Recommended | Emergency Ready | Urgency-first |
| AI Recommended | Heritage Craft | Editorial, artisan |

## Project Structure

```
src/
├── pages/              # Astro pages (static HTML)
├── layouts/            # Base layout
├── components/
│   ├── static/         # Pure Astro components (zero JS)
│   └── interactive/    # React islands (JS only where needed)
├── content/blog/       # Markdown blog posts
├── data/               # Business data, services, reviews
├── lib/                # SEO schema, icons
├── themes/             # All 10 theme configurations
└── styles/             # Global CSS with theme variables
```

## Blog Automation

### Manual post creation
```bash
./scripts/new-post.sh my-post-slug
```

### Automated with Claude Code
```bash
claude -p "Write an SEO-optimised blog post about [topic] for Gas Champion.
Save as src/content/blog/[slug].md with proper frontmatter (title, description,
date, tags, author). Include internal links to relevant service pages.
Set draft: false when ready."
```

### Frontmatter schema
```yaml
---
title: "Post Title"
description: "SEO description"
date: 2024-01-15
tags: ["Tips", "Boiler Servicing"]
author: "Lee — Gas Champion"
image: "/images/optional-image.jpg"  # optional
draft: false
---
```

## Deployment

### Cloudflare Pages
```bash
npm run build
# Output in dist/ — deploy to Cloudflare Pages
# Build command: npm run build
# Output directory: dist
```

### Vercel
```bash
npx vercel
```

## Business Data

All content is in `src/data/business.ts`. Images are in `public/images/`.

- **Gas Safe Registration:** 636427
- **Phone:** 07828 943 186
- **Email:** info@gaschampion.co.uk
- **Address:** 31 High Street, Haverhill, Suffolk, CB9 8AD

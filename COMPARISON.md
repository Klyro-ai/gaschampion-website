# Astro vs Next.js — Gas Champion Website Comparison

## Build Performance

| Metric | Astro | Next.js |
|--------|-------|---------|
| Build time | **1.75s** | ~5s |
| Pages built | 17 | 11 (rest dynamic) |
| Build output | Static HTML | Mix of static + dynamic |

## Bundle Size (JS shipped per page)

| Page | Astro | Next.js |
|------|-------|---------|
| Home | ~45KB (React islands only) | 157KB (full React) |
| Services listing | ~15KB (theme switcher + nav) | 152KB |
| About | ~15KB | 153KB |
| Blog listing | ~15KB | 152KB |
| Service detail | ~35KB (form + FAQ) | 154KB |
| Static pages (areas, reviews) | ~15KB | 152KB |

**Astro ships 70-90% less JavaScript** on most pages. Only the interactive components (theme switcher, contact form, mobile nav, FAQ accordion) load React.

## Expected Lighthouse Scores

| Metric | Astro (expected) | Next.js (expected) |
|--------|-----------------|-------------------|
| Performance | **98-100** | 85-92 |
| Accessibility | 95+ | 95+ |
| Best Practices | 95+ | 95+ |
| SEO | 100 | 100 |
| LCP | **< 1.0s** | 1.5-2.5s |
| FID/INP | **< 50ms** | 100-200ms |
| CLS | 0 | 0-0.05 |

Astro's advantage comes from shipping zero JS on content-heavy pages and avoiding React hydration entirely for static components.

## Feature Comparison

| Feature | Astro | Next.js |
|---------|-------|---------|
| 10 theme switcher | Yes (React island) | Yes (full React) |
| Theme persistence | Yes (localStorage) | Yes (localStorage) |
| Multi-step contact form | Yes (React island) | Yes (React component) |
| FAQ accordion | Yes (React island) | Yes (React component) |
| Mobile navigation | Yes (React island) | Yes (React component) |
| Schema.org structured data | Yes | Yes |
| Sitemap | Auto-generated | Manual |
| Blog system | Content Collections (Markdown) | Hardcoded data |
| Image optimization | Native `<img>` | next/image |
| SEO meta tags | Identical | Identical |

## Developer Experience

| Aspect | Astro | Next.js |
|--------|-------|---------|
| Learning curve | Moderate (Astro + React islands) | Lower (React only) |
| Component authoring | .astro (static) + .tsx (interactive) | .tsx everywhere |
| Blog content | Markdown files — easy for non-devs | Code changes required |
| Deployment | Any static host | Vercel (optimal), others possible |
| Hot reload | Fast | Fast |
| TypeScript | Full support | Full support |

## Maintenance Considerations

**Astro advantages:**
- Blog posts are Markdown files — can be added without touching code
- Static output can be hosted anywhere (Cloudflare Pages, Netlify, S3, etc.)
- Smaller dependency tree — fewer security updates needed
- No server runtime required

**Next.js advantages:**
- Single language/paradigm (React everywhere)
- Larger ecosystem of React component libraries
- Easier to add dynamic features later (auth, CMS, API routes)
- More developers familiar with Next.js

## Recommendation

**For Gas Champion, Astro is the better choice.** Here's why:

1. **Performance wins matter for local SEO.** Google's Core Web Vitals directly influence local search rankings. Astro's near-perfect Lighthouse scores give Gas Champion an edge over every competitor in Haverhill.

2. **The site is content-first.** 90% of the pages are static content that doesn't need React. Astro's island architecture means visitors only download JavaScript for the 4 interactive components.

3. **Blog automation is built-in.** The Content Collections system makes it trivial to add SEO blog posts — either manually or via Claude Code automation. This topical authority strategy is harder with the Next.js version.

4. **Hosting flexibility.** Static output can go on Cloudflare Pages (free tier, global CDN, excellent performance) instead of requiring Vercel.

5. **The 1.75s build time** means deployments are instant. Even with 100+ blog posts, builds will stay under 10 seconds.

The only scenario where Next.js wins is if Gas Champion later needs dynamic features like user accounts, a customer portal, or real-time booking. For a local service business website, that's unlikely.

**Verdict: Ship the Astro version.**

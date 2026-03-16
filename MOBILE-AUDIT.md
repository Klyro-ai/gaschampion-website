# Mobile Responsive Audit Report

**Date:** 2026-03-16
**Breakpoints tested:** 320px, 375px, 390px, 428px, 768px, 1024px
**Themes:** All 11 (clean-professional, warm-approachable, bold-high-energy, premium-luxurious, modern-playful, trust-fortress, neighbourhood-hero, smart-home-tech, emergency-ready, heritage-craft, liquid-glass)

---

## Global (src/styles/global.css)

### Issue 1: Horizontal overflow possible on mobile
- **Problem:** No `overflow-x: hidden` on html/body; long URLs or inline code could cause horizontal scroll
- **Fix:** Added `overflow-x: hidden` to `html` and `body`; added `overflow-wrap: break-word` to `body`
- **Breakpoints:** All mobile (320px-428px)
- **Themes:** All

### Issue 2: Universal `*` transition selector includes images/SVGs
- **Problem:** `*` selector applied CSS transitions to images and SVGs, potentially causing performance issues especially on mobile
- **Fix:** Changed selector to `*:not(img):not(svg):not(video):not(canvas)` to exclude media elements
- **Themes:** All

### Issue 3: Images missing max-width constraint
- **Problem:** No global constraint preventing images from exceeding their container
- **Fix:** Added `img, video, iframe, embed, object { max-width: 100%; height: auto; }`
- **Breakpoints:** All
- **Themes:** All

### Issue 4: Liquid Glass backdrop-filter heavy on mobile
- **Problem:** `blur(40px)` and `blur(60px)` cause janky scrolling on low-end mobile devices
- **Fix:** Added `@media (max-width: 640px)` reducing `--glass-blur` to 20px and `--glass-blur-heavy` to 30px; increased card opacity to 0.7 for readability
- **Breakpoints:** 320px-640px
- **Themes:** liquid-glass

### Issue 5: Dark theme form inputs unreadable
- **Problem:** On bold-high-energy and premium-luxurious themes, form input text inherits dark foreground but inputs have dark backgrounds, making text invisible
- **Fix:** Added explicit `color` and `::placeholder` rules for both dark themes
- **Breakpoints:** All
- **Themes:** bold-high-energy, premium-luxurious

### Issue 6: Prose content overflow on 320px
- **Problem:** Blog post content (images, pre, tables) could overflow on very narrow screens
- **Fix:** Added `@media (max-width: 374px)` with `max-width: 100%; overflow-x: auto;` for prose children
- **Breakpoints:** 320px
- **Themes:** All

---

## TopBar (src/components/static/TopBar.astro)

### Issue 7: Gas Safe text overflow on 320px
- **Problem:** "Gas Safe: 123456" text combined with phone number may not fit on 320px viewport
- **Fix:** Added `gap-2` between flex items; shortened "Gas Safe:" prefix to just the number on mobile (`hidden sm:inline` / `sm:hidden` pattern)
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 8: Phone link missing min-width for touch target
- **Problem:** Phone link had `min-height: 44px` but no `min-width`, potentially failing WCAG touch target guidelines
- **Fix:** Added `min-width: 44px` and `shrink-0`
- **Breakpoints:** All
- **Themes:** All

---

## Header (src/components/static/Header.astro)

### Issue 9: Logo missing width/height attributes
- **Problem:** `<img>` for logo had no `width`/`height` attributes, causing CLS (Cumulative Layout Shift) on load
- **Fix:** Added `width="160" height="40"` and `object-fit: contain`
- **Breakpoints:** All
- **Themes:** All

### Issue 10: Logo link missing touch target dimensions
- **Problem:** Logo link (`<a>`) had no minimum touch target size
- **Fix:** Added `min-height: 44px; min-width: 44px` and `flex items-center`
- **Breakpoints:** All mobile
- **Themes:** All

---

## Hero (src/components/static/Hero.astro)

### Issue 11: H1 text-3xl too large on 320px
- **Problem:** `text-3xl` (1.875rem = 30px) is too large for a 320px viewport with padding, causing awkward line breaks
- **Fix:** Changed to `text-[1.65rem]` (26.4px) base, scaling up via `sm:text-4xl md:text-5xl lg:text-[3.5rem]`
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 12: Credentials grid-cols-2 overflows on 320px
- **Problem:** `grid-cols-2` for credentials (Gas Safe, OFTEC, etc.) causes text truncation or overflow on narrow screens
- **Fix:** Changed to `grid-cols-1 sm:grid-cols-2`; added `min-w-0` and `truncate` on text spans
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 13: CTA buttons overflow on 320px
- **Problem:** `px-7` padding on "Call 07828 943 186" button is too wide for 320px viewport
- **Fix:** Changed to `px-5 sm:px-7` and `text-sm sm:text-base`; added `min-height: 48px` for touch target; added `shrink-0` on phone icon SVG
- **Breakpoints:** 320px, 375px
- **Themes:** All

---

## Footer (src/components/static/Footer.astro)

### Issue 14: Logo missing width/height attributes
- **Problem:** Footer logo had no `width`/`height` attributes
- **Fix:** Added `width="160" height="40"` and `object-fit: contain`
- **Breakpoints:** All
- **Themes:** All

### Issue 15: Email address overflows on 320px
- **Problem:** Long email addresses (e.g. "info@gaschampion.co.uk") could overflow the footer brand column on 320px
- **Fix:** Wrapped email in `<span class="break-all">` and added `min-w-0` to the link
- **Breakpoints:** 320px
- **Themes:** All

### Issue 16: Address text not wrapping properly
- **Problem:** Long address text could overflow; icon not aligned to top when text wraps
- **Fix:** Changed `flex items-center` to `flex items-start`; added `mt-0.5` to icon; added `break-words` and `min-w-0`
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 17: Copyright text too large on 320px
- **Problem:** `text-sm` footer bottom bar text cramped on narrow screens
- **Fix:** Changed to `text-xs sm:text-sm`; removed "All rights reserved." trailing text to save space; added `flex-wrap justify-center` to links
- **Breakpoints:** 320px
- **Themes:** All

---

## Contact Form (src/components/interactive/AppIslands.tsx — ContactFormIsland)

### Issue 18: Service options grid-cols-2 too tight on 320px
- **Problem:** 11 service option buttons in `grid-cols-2` at 320px made each button ~140px wide, too small for text like "Smart Thermostat"
- **Fix:** Changed to `grid-cols-1 sm:grid-cols-2`; added `minHeight: 44px` to each button
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 19: Urgency buttons too small on 320px
- **Problem:** `grid-cols-3` urgency buttons ("Emergency", "This week", "No rush") had tiny text and padding at 320px
- **Fix:** Reduced gap to `gap-1.5 sm:gap-2`; reduced padding to `p-2 sm:p-3`; reduced text to `text-xs sm:text-sm`; added `text-center`; added `minHeight: 44px`
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 20: Form container padding too wide on 320px
- **Problem:** `p-6 md:p-8` left only 248px content area on 320px viewport (320 - 24*2 padding - 24*2 form padding)
- **Fix:** Changed to `p-4 sm:p-6 md:p-8`
- **Breakpoints:** 320px
- **Themes:** All

### Issue 21: Form heading too large on 320px
- **Problem:** `text-2xl` heading in form takes up too much space on narrow screens
- **Fix:** Changed to `text-xl sm:text-2xl`
- **Breakpoints:** 320px
- **Themes:** All

### Issue 22: Form inputs missing touch target
- **Problem:** Form inputs had no explicit `min-height`, could be smaller than 48px on some browsers
- **Fix:** Added `minHeight: 48px` to all inputs
- **Breakpoints:** All mobile
- **Themes:** All

### Issue 23: Form buttons missing touch targets
- **Problem:** Back/Next/Submit buttons lacked explicit `min-height`
- **Fix:** Added `minHeight: 48px` to all step navigation and submit buttons
- **Breakpoints:** All mobile
- **Themes:** All

### Issue 24: "Send Quote Request" text overflow
- **Problem:** Button text "Send Quote Request" could overflow on very narrow screens
- **Fix:** Added `text-sm sm:text-base` to the submit button
- **Breakpoints:** 320px
- **Themes:** All

---

## Theme Switcher (src/components/interactive/AppIslands.tsx — ThemeSwitcherIsland)

### Issue 25: Close button too small for touch
- **Problem:** Close button was `p-2` (8px padding each side + 20px icon = 36px), below the 44px minimum
- **Fix:** Added `minWidth: 44px; minHeight: 44px` and `flex items-center justify-center`; added `aria-label`
- **Breakpoints:** All mobile
- **Themes:** All

### Issue 26: Theme count incorrect
- **Problem:** Subtitle said "Compare 10 visual styles" but there are 11 themes
- **Fix:** Changed to "Compare 11 visual styles"
- **Breakpoints:** N/A
- **Themes:** N/A

### Issue 27: Drawer scroll containment
- **Problem:** On mobile, scrolling inside the theme drawer could scroll the background page
- **Fix:** Added `overscroll-contain` class to the drawer
- **Breakpoints:** All mobile
- **Themes:** All

---

## FAQ (src/components/interactive/AppIslands.tsx — FAQIsland)

### Issue 28: Heading text-3xl too large on 320px
- **Problem:** `text-3xl` FAQ heading overflows or looks cramped on 320px
- **Fix:** Changed to `text-2xl sm:text-3xl md:text-4xl`
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 29: FAQ toggle buttons missing touch target
- **Problem:** FAQ accordion buttons had no explicit `min-height`
- **Fix:** Added `minHeight: 48px`; reduced padding to `p-4 sm:p-5`; reduced text to `text-sm sm:text-base`
- **Breakpoints:** All mobile
- **Themes:** All

---

## Pages

### Issue 30: All page H1 headings too large on 320px
- **Problem:** `text-4xl` (2.25rem = 36px) H1 headings on about, contact, reviews, services, blog, and blog post pages are too large for 320px
- **Fix:** Added responsive scaling: `text-3xl sm:text-4xl md:text-5xl` (or `text-[1.65rem]` for pages with longer headings like about and blog posts)
- **Breakpoints:** 320px, 375px
- **Themes:** All
- **Files affected:**
  - src/pages/about.astro
  - src/pages/contact.astro
  - src/pages/reviews.astro
  - src/pages/service-areas.astro
  - src/pages/services/index.astro
  - src/pages/services/[slug].astro
  - src/pages/blog/index.astro
  - src/pages/blog/[...slug].astro

### Issue 31: Service detail price + button layout breaks on 320px
- **Problem:** On service detail pages, "From X" price and "Book Now" button in a horizontal flex could overflow on 320px
- **Fix:** Changed to `flex-col sm:flex-row`; reduced price text to `text-2xl sm:text-3xl`; added `min-height: 48px` and `justify-center` to button
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 32: Reviews page stat grid too tight on 320px
- **Problem:** `grid-cols-3 gap-6` stats with `text-3xl` numbers overflows on 320px
- **Fix:** Reduced to `gap-3 sm:gap-6`; scaled text to `text-2xl sm:text-3xl` and labels to `text-xs sm:text-sm`
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 33: Multiple images missing width/height attributes
- **Problem:** Several images across pages lacked `width`/`height` attributes causing CLS
- **Fix:** Added explicit dimensions to:
  - About page: engineer-on-way.png (500x400)
  - Reviews page: google-review-*.png (400x300), mybuilder-review.png (400x300), local-heroes-review.png (400x300)
  - Blog index: blog card images (640x360)
- **Breakpoints:** All
- **Themes:** All

### Issue 34: About page body text too large on 320px
- **Problem:** `text-lg` paragraphs on about page too wide for 320px with padding
- **Fix:** Changed to `text-base sm:text-lg`
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 35: About page credential badges cramped on 320px
- **Problem:** `gap-4` between credential badges too wide on 320px, could cause wrapping issues
- **Fix:** Changed to `gap-2 sm:gap-4`
- **Breakpoints:** 320px
- **Themes:** All

### Issue 36: Contact page items overflow
- **Problem:** Working hours value "Mon-Fri: 8am-6pm | Sat: 9am-2pm | Emergency 7 days" overflows on 320px; contact item layout cramped
- **Fix:** Added `min-w-0` to parent and text container; added `break-words` to value text; reduced icon size to `w-10 h-10 sm:w-12 sm:h-12`; reduced padding to `p-4 sm:p-5`; added `text-sm` to value
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 37: Blog post prose content overflow
- **Problem:** Blog post markdown content could contain long URLs or code that overflows on mobile
- **Fix:** Added `overflow-wrap: break-word` inline style to the prose container
- **Breakpoints:** 320px, 375px
- **Themes:** All

### Issue 38: Reviews page heading overflow on 320px
- **Problem:** "Straight From Google, MyBuilder & Local Heroes" heading at `text-2xl` could look cramped
- **Fix:** Changed to `text-xl sm:text-2xl`
- **Breakpoints:** 320px
- **Themes:** All

---

## Summary

| Category | Issues Found | Issues Fixed |
|----------|-------------|-------------|
| Text overflow / sizing | 14 | 14 |
| Touch targets | 9 | 9 |
| Image dimensions | 5 | 5 |
| Horizontal overflow | 4 | 4 |
| Dark theme contrast | 2 | 2 |
| Liquid Glass performance | 2 | 2 |
| Layout / grid collapse | 3 | 3 |
| **Total** | **38** | **38** |

All fixes use Tailwind responsive prefixes (mobile-first) and CSS custom properties, ensuring compatibility across all 11 themes.

/**
 * Basic website scraper for tradesperson sites.
 *
 * Fetches raw HTML and extracts useful content using regex / string
 * methods. This will fail on JS-rendered sites (Wix, Squarespace)
 * and that is acceptable — it covers ~60% of tradesperson sites
 * (WordPress, static HTML, basic CMS).
 */

export interface ScrapedWebsite {
  title: string;
  description: string;
  aboutText: string;
  serviceTexts: string[];
  contactInfo: {
    phones: string[];
    emails: string[];
    address?: string;
  };
  imageUrls: string[];
  socialLinks: string[];
  colours: string[];
}

/**
 * Scrape a website and extract structured content.
 * Returns null if the site cannot be fetched or parsed.
 */
export async function scrapeWebsite(
  url: string,
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = (...args) => fetch(...args),
): Promise<ScrapedWebsite | null> {
  try {
    // Normalise URL
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    const response = await fetchFn(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KlyroBot/1.0)',
        Accept: 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    const html = await response.text();
    return parseHtml(html, url);
  } catch {
    return null;
  }
}

// ── HTML parsing ───────────────────────────────────────────────────

export function parseHtml(html: string, baseUrl: string): ScrapedWebsite {
  const title = extractTag(html, 'title');
  const description = extractMeta(html, 'description');

  // Strip script/style tags for text extraction
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const headings = extractAllTags(cleanHtml, 'h1')
    .concat(extractAllTags(cleanHtml, 'h2'))
    .concat(extractAllTags(cleanHtml, 'h3'));

  const paragraphs = extractAllTags(cleanHtml, 'p');

  // About text — look for paragraphs near "about" headings, or longest paragraph
  const aboutText = findAboutText(headings, paragraphs, cleanHtml);

  // Services — look for list items or headings containing service-related words
  const serviceTexts = findServiceTexts(headings, paragraphs);

  // Contact info
  const phones = extractPhones(html);
  const emails = extractEmails(html);
  const address = extractAddress(html);

  // Images
  const imageUrls = extractImages(html, baseUrl);

  // Social links
  const socialLinks = extractSocialLinks(html);

  // CSS colours
  const colours = extractColours(html);

  return {
    title: title || '',
    description: description || '',
    aboutText,
    serviceTexts,
    contactInfo: {
      phones: [...new Set(phones)],
      emails: [...new Set(emails)],
      address: address || undefined,
    },
    imageUrls: [...new Set(imageUrls)].slice(0, 20),
    socialLinks: [...new Set(socialLinks)],
    colours: [...new Set(colours)].slice(0, 10),
  };
}

// ── Extraction helpers ─────────────────────────────────────────────

function extractTag(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = html.match(re);
  return match ? stripTags(match[1]).trim() : null;
}

function extractAllTags(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text.length > 2 && text.length < 500) {
      results.push(text);
    }
  }
  return results;
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const match = html.match(re);
  if (match) return match[1].trim();

  // Try reversed attribute order
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i');
  const match2 = html.match(re2);
  return match2 ? match2[1].trim() : null;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function extractPhones(html: string): string[] {
  // UK phone numbers
  const ukRe = /(?:0\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/g;
  // Also catch +44 format
  const intlRe = /(?:\+44[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/g;

  const text = stripTags(html);
  const uk = text.match(ukRe) || [];
  const intl = text.match(intlRe) || [];
  return [...uk, ...intl].map((p) => p.trim());
}

function extractEmails(html: string): string[] {
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const text = stripTags(html);
  return (text.match(re) || []).filter(
    (e) => !e.includes('example.com') && !e.includes('wixpress') && !e.includes('sentry'),
  );
}

function extractAddress(html: string): string | null {
  // Look for structured address in schema.org
  const schemaRe = /"streetAddress"\s*:\s*"([^"]+)"/;
  const match = html.match(schemaRe);
  if (match) return match[1];

  // Look for UK postcode patterns near address-like content
  const postcodeRe = /[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}/i;
  const text = stripTags(html);
  const pcMatch = text.match(postcodeRe);
  if (pcMatch) {
    // Grab surrounding context (up to 100 chars before)
    const idx = text.indexOf(pcMatch[0]);
    const start = Math.max(0, idx - 100);
    const snippet = text.substring(start, idx + pcMatch[0].length).trim();
    // Try to find an address-like sentence
    const lines = snippet.split(/[.\n]/).filter((l) => l.trim().length > 5);
    return lines.length > 0 ? lines[lines.length - 1].trim() : pcMatch[0];
  }

  return null;
}

function extractImages(html: string, baseUrl: string): string[] {
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    let src = match[1];
    // Skip data URIs, tracking pixels, tiny icons
    if (src.startsWith('data:')) continue;
    if (src.includes('1x1') || src.includes('pixel') || src.includes('tracking')) continue;

    // Resolve relative URLs
    if (src.startsWith('//')) {
      src = 'https:' + src;
    } else if (src.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        src = `${base.origin}${src}`;
      } catch {
        continue;
      }
    } else if (!src.startsWith('http')) {
      try {
        src = new URL(src, baseUrl).href;
      } catch {
        continue;
      }
    }

    results.push(src);
  }
  return results;
}

function extractSocialLinks(html: string): string[] {
  const re = /href=["'](https?:\/\/(?:www\.)?(?:facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|youtube\.com|tiktok\.com)\/[^"'\s]+)["']/gi;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function extractColours(html: string): string[] {
  const colours: string[] = [];

  // Hex colours from CSS
  const hexRe = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const inlineStyles = html.match(/style=["'][^"']+["']/gi) || [];
  const cssText = [...styleBlocks, ...inlineStyles].join(' ');

  const hexMatches = cssText.match(hexRe) || [];
  // Filter out common non-design colours
  const skipColours = new Set(['#fff', '#ffffff', '#000', '#000000', '#333', '#333333', '#666', '#999', '#ccc', '#ddd', '#eee']);
  for (const hex of hexMatches) {
    if (!skipColours.has(hex.toLowerCase())) {
      colours.push(hex);
    }
  }

  // CSS custom properties with colour values
  const varRe = /--[a-zA-Z-]+\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varRe.exec(cssText)) !== null) {
    colours.push(varMatch[1]);
  }

  return colours;
}

function findAboutText(headings: string[], paragraphs: string[], html: string): string {
  // Look for content near "about" headings
  const aboutIdx = headings.findIndex((h) => /about/i.test(h));
  if (aboutIdx >= 0) {
    // Find paragraphs after the about heading in the HTML
    const aboutHeading = headings[aboutIdx];
    const headingPos = html.indexOf(aboutHeading);
    if (headingPos >= 0) {
      const afterHeading = html.substring(headingPos);
      const nearbyPs = extractAllTags(afterHeading, 'p').slice(0, 3);
      if (nearbyPs.length > 0) {
        return nearbyPs.join(' ').substring(0, 1000);
      }
    }
  }

  // Fallback: longest paragraph
  if (paragraphs.length > 0) {
    const sorted = [...paragraphs].sort((a, b) => b.length - a.length);
    return sorted[0].substring(0, 1000);
  }

  return '';
}

function findServiceTexts(headings: string[], paragraphs: string[]): string[] {
  const serviceWords = /service|repair|install|maintain|boiler|plumb|heat|gas|electri|roof|build|renovat|kitchen|bathroom/i;
  const services: string[] = [];

  for (const h of headings) {
    if (serviceWords.test(h)) {
      services.push(h);
    }
  }

  // If we found nothing from headings, check paragraphs
  if (services.length === 0) {
    for (const p of paragraphs) {
      if (serviceWords.test(p) && p.length < 200) {
        services.push(p);
      }
    }
  }

  return services.slice(0, 10);
}

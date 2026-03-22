import { describe, it, expect, vi } from 'vitest';
import { scrapeWebsite, parseHtml } from '../../src/services/website-scraper';

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Smith's Plumbing - Expert Plumbers in Leeds</title>
  <meta name="description" content="Professional plumbing services across Leeds and West Yorkshire">
  <style>
    :root {
      --primary: #2a5db0;
      --accent: #f5a623;
    }
    .header { background-color: #1a3d6e; }
  </style>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/services">Services</a>
  </nav>

  <h1>Smith's Plumbing</h1>
  <h2>Your Local Plumbing Experts</h2>

  <p>Welcome to Smith's Plumbing. We provide top-quality plumbing services across Leeds and the surrounding areas.</p>

  <h2>About Us</h2>
  <p>With over 20 years of experience, our team of qualified plumbers deliver reliable and affordable services. We're Gas Safe registered and fully insured.</p>

  <h2>Our Services</h2>
  <h3>Boiler Installation</h3>
  <p>Expert boiler installation and replacement.</p>
  <h3>Emergency Plumbing Repairs</h3>
  <p>24/7 emergency plumbing service.</p>
  <h3>Bathroom Fitting</h3>

  <p>Contact us today on 0113 234 5678 or email info@smithsplumbing.co.uk</p>
  <p>Visit us at 45 Bridge Road, Leeds LS1 4AB</p>

  <img src="/images/team.jpg" alt="Our team">
  <img src="https://cdn.example.com/boiler-install.jpg" alt="Boiler installation">
  <img src="data:image/gif;base64,R0lGOD..." alt="pixel">

  <footer>
    <a href="https://www.facebook.com/smithsplumbing">Facebook</a>
    <a href="https://www.instagram.com/smithsplumbing">Instagram</a>
    <a href="https://twitter.com/smithsplumbing">Twitter</a>
  </footer>

  <script type="application/ld+json">
  {"@type": "LocalBusiness", "streetAddress": "45 Bridge Road"}
  </script>
</body>
</html>`;

describe('Website Scraper', () => {
  describe('parseHtml', () => {
    it('extracts title', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.title).toBe("Smith's Plumbing - Expert Plumbers in Leeds");
    });

    it('extracts meta description', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.description).toBe('Professional plumbing services across Leeds and West Yorkshire');
    });

    it('extracts about text', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.aboutText).toContain('20 years of experience');
    });

    it('extracts service-related headings', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.serviceTexts.length).toBeGreaterThan(0);
      const serviceText = result.serviceTexts.join(' ');
      expect(serviceText).toMatch(/boiler|plumb|bathroom/i);
    });

    it('extracts phone numbers', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.contactInfo.phones).toContain('0113 234 5678');
    });

    it('extracts email addresses', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.contactInfo.emails).toContain('info@smithsplumbing.co.uk');
    });

    it('extracts structured address from schema.org', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.contactInfo.address).toBe('45 Bridge Road');
    });

    it('extracts image URLs and resolves relative paths', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.imageUrls).toContain('https://smithsplumbing.co.uk/images/team.jpg');
      expect(result.imageUrls).toContain('https://cdn.example.com/boiler-install.jpg');
      // Should not include data URIs
      expect(result.imageUrls.some((u) => u.startsWith('data:'))).toBe(false);
    });

    it('extracts social media links', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.socialLinks).toContain('https://www.facebook.com/smithsplumbing');
      expect(result.socialLinks).toContain('https://www.instagram.com/smithsplumbing');
      expect(result.socialLinks).toContain('https://twitter.com/smithsplumbing');
    });

    it('extracts CSS colours (skipping common greys/black/white)', () => {
      const result = parseHtml(SAMPLE_HTML, 'https://smithsplumbing.co.uk');
      expect(result.colours).toContain('#2a5db0');
      expect(result.colours).toContain('#f5a623');
      expect(result.colours).toContain('#1a3d6e');
      // Should not include common colours
      expect(result.colours).not.toContain('#fff');
      expect(result.colours).not.toContain('#000');
    });
  });

  describe('parseHtml edge cases', () => {
    it('handles empty HTML', () => {
      const result = parseHtml('', 'https://example.com');
      expect(result.title).toBe('');
      expect(result.description).toBe('');
      expect(result.contactInfo.phones).toEqual([]);
    });

    it('handles HTML with no meta description', () => {
      const html = '<html><head><title>Test</title></head><body><p>Hello</p></body></html>';
      const result = parseHtml(html, 'https://example.com');
      expect(result.title).toBe('Test');
      expect(result.description).toBe('');
    });

    it('handles meta with reversed attribute order', () => {
      const html = '<html><head><meta content="Reversed desc" name="description"></head><body></body></html>';
      const result = parseHtml(html, 'https://example.com');
      expect(result.description).toBe('Reversed desc');
    });
  });

  describe('scrapeWebsite', () => {
    it('returns null on fetch failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const result = await scrapeWebsite('https://bad-site.com', mockFetch);
      expect(result).toBeNull();
    });

    it('returns null on non-HTML response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      });

      const result = await scrapeWebsite('https://api.example.com', mockFetch);
      expect(result).toBeNull();
    });

    it('returns null on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await scrapeWebsite('https://missing.com', mockFetch);
      expect(result).toBeNull();
    });

    it('prepends https:// to URLs without protocol', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html><head><title>Test</title></head><body></body></html>'),
      });

      await scrapeWebsite('example.com', mockFetch);
      expect(mockFetch.mock.calls[0][0]).toBe('https://example.com');
    });

    it('parses a valid HTML response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        text: () => Promise.resolve(SAMPLE_HTML),
      });

      const result = await scrapeWebsite('https://smithsplumbing.co.uk', mockFetch);
      expect(result).not.toBeNull();
      expect(result!.title).toBe("Smith's Plumbing - Expert Plumbers in Leeds");
    });
  });
});

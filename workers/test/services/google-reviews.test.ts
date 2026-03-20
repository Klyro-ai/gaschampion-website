import { describe, it, expect, vi } from 'vitest';
import { fetchGoogleReviews, parseGoogleReview } from '../../src/services/google-reviews';

describe('Google Reviews', () => {
  describe('parseGoogleReview', () => {
    it('parses a Google Places API review into our format', () => {
      const raw = {
        name: 'places/ChIJ.../reviews/abc123',
        relativePublishTimeDescription: '2 months ago',
        rating: 5,
        text: { text: 'Brilliant service from Lee!' },
        authorAttribution: { displayName: 'Sarah M.' },
        publishTime: '2024-06-15T10:30:00Z',
      };

      const parsed = parseGoogleReview(raw);
      expect(parsed.author_name).toBe('Sarah M.');
      expect(parsed.rating).toBe(5);
      expect(parsed.text).toBe('Brilliant service from Lee!');
      expect(parsed.source_id).toBe('abc123');
      expect(parsed.review_date).toBe('2024-06-15T10:30:00Z');
    });

    it('handles review with no text', () => {
      const raw = {
        name: 'places/ChIJ.../reviews/xyz',
        rating: 4,
        text: undefined,
        authorAttribution: { displayName: 'John' },
        publishTime: '2024-01-01T00:00:00Z',
      };

      const parsed = parseGoogleReview(raw);
      expect(parsed.text).toBeNull();
      expect(parsed.rating).toBe(4);
    });
  });

  describe('fetchGoogleReviews', () => {
    it('calls Google Places API with correct URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: [] }),
      });

      await fetchGoogleReviews('ChIJtest', 'fake-api-key', mockFetch);

      expect(mockFetch).toHaveBeenCalledOnce();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('places/ChIJtest');
      expect(url).toContain('key=fake-api-key');
    });
  });
});

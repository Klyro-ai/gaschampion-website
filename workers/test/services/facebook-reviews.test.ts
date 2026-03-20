import { describe, it, expect, vi } from 'vitest';
import { fetchFacebookReviews, parseFacebookReview } from '../../src/services/facebook-reviews';

describe('Facebook Reviews Service', () => {
  describe('parseFacebookReview', () => {
    it('parses a Facebook page rating', () => {
      const raw = {
        reviewer: { name: 'Jane D.' },
        rating: 5,
        review_text: 'Amazing gas engineer!',
        created_time: '2024-06-15T10:30:00+0000',
        recommendation_type: 'positive',
        open_graph_story: { id: 'fb-review-123' },
      };

      const parsed = parseFacebookReview(raw);
      expect(parsed.author_name).toBe('Jane D.');
      expect(parsed.rating).toBe(5);
      expect(parsed.text).toBe('Amazing gas engineer!');
      expect(parsed.source).toBe('facebook');
    });

    it('handles recommendation (no numeric rating)', () => {
      const raw = {
        reviewer: { name: 'Mark T.' },
        review_text: 'Highly recommend',
        created_time: '2024-01-01T00:00:00+0000',
        recommendation_type: 'positive',
        open_graph_story: { id: 'fb-456' },
      };

      const parsed = parseFacebookReview(raw);
      expect(parsed.rating).toBe(5); // positive recommendation = 5
    });
  });

  describe('fetchFacebookReviews', () => {
    it('calls Facebook Graph API with correct URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await fetchFacebookReviews('page123', 'fake-token', mockFetch);

      expect(mockFetch).toHaveBeenCalledOnce();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('page123/ratings');
    });
  });
});

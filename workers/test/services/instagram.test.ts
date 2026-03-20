import { describe, it, expect, vi } from 'vitest';
import { fetchInstagramPosts, parseInstagramPost } from '../../src/services/instagram';

describe('Instagram Service', () => {
  describe('parseInstagramPost', () => {
    it('parses an Instagram Graph API media object', () => {
      const raw = {
        id: '17895695668004550',
        caption: 'New Worcester boiler install in Haverhill!',
        media_type: 'IMAGE',
        media_url: 'https://scontent.cdninstagram.com/v/t51.123/photo.jpg',
        permalink: 'https://www.instagram.com/p/ABC123/',
        timestamp: '2024-06-15T14:30:00+0000',
      };

      const parsed = parseInstagramPost(raw);
      expect(parsed.instagram_id).toBe('17895695668004550');
      expect(parsed.caption).toBe('New Worcester boiler install in Haverhill!');
      expect(parsed.media_type).toBe('IMAGE');
      expect(parsed.permalink).toBe('https://www.instagram.com/p/ABC123/');
    });

    it('handles post with no caption', () => {
      const raw = {
        id: '123',
        media_type: 'IMAGE',
        media_url: 'https://example.com/img.jpg',
        permalink: 'https://instagram.com/p/xyz',
        timestamp: '2024-01-01T00:00:00+0000',
      };

      const parsed = parseInstagramPost(raw);
      expect(parsed.caption).toBeNull();
    });
  });

  describe('fetchInstagramPosts', () => {
    it('calls Instagram Graph API with correct URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await fetchInstagramPosts('12345', 'fake-token', mockFetch);

      expect(mockFetch).toHaveBeenCalledOnce();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('12345/media');
      expect(url).toContain('access_token=fake-token');
    });

    it('throws on API error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(fetchInstagramPosts('12345', 'bad-token', mockFetch))
        .rejects.toThrow('Instagram API error: 401');
    });
  });
});

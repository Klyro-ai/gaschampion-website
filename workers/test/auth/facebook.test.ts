import { describe, it, expect, vi } from 'vitest';
import { buildFacebookAuthUrl, handleFacebookCallback } from '../../src/auth/facebook';

describe('Facebook OAuth', () => {
  it('builds correct Facebook auth URL', () => {
    const url = buildFacebookAuthUrl({
      appId: 'app123',
      redirectUri: 'https://worker.dev/auth/facebook/callback',
      state: 'state-token',
    });

    expect(url).toContain('facebook.com/v21.0/dialog/oauth');
    expect(url).toContain('client_id=app123');
    expect(url).toContain('state=state-token');
    expect(url).toContain('pages_read_engagement');
  });

  it('exchanges code for token', async () => {
    const mockFetch = vi.fn()
      // Token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'short-token', token_type: 'bearer' }),
      })
      // Long-lived token exchange
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'long-token', expires_in: 5184000 }),
      })
      // Get pages
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'page-123', name: 'Gas Champion', access_token: 'page-token' }],
        }),
      })
      // Get Instagram account
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          instagram_business_account: { id: 'ig-456' },
        }),
      });

    const result = await handleFacebookCallback({
      code: 'auth-code',
      appId: 'app123',
      appSecret: 'secret',
      redirectUri: 'https://worker.dev/auth/facebook/callback',
      fetchFn: mockFetch,
    });

    expect(result.pageId).toBe('page-123');
    expect(result.instagramId).toBe('ig-456');
    expect(result.longLivedToken).toBe('long-token');
    expect(result.pageAccessToken).toBe('page-token');
  });
});

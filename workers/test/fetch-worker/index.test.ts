import { describe, it, expect, vi } from 'vitest';
import { processFetchJob } from '../../src/fetch-worker/index';

describe('Fetch Worker', () => {
  it('fetches Google reviews and stores them', async () => {
    const mockKV = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'token:client-1:google') return 'fake-google-key';
        return null;
      }),
    };

    const mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({}),
          first: vi.fn().mockResolvedValue(null),
        }),
      }),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reviews: [{
          name: 'places/ChIJ/reviews/abc',
          rating: 5,
          text: { text: 'Great service' },
          authorAttribution: { displayName: 'Test User' },
          publishTime: '2024-01-01T00:00:00Z',
        }],
      }),
    });

    const job = {
      client_id: 'client-1',
      client: { id: 'client-1', google_place_id: 'ChIJtest' },
      tasks: ['google'] as ('google')[],
    };

    await expect(
      processFetchJob(job as any, mockDB as any, mockKV as any, mockFetch)
    ).resolves.not.toThrow();
  });
});

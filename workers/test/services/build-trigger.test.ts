import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuildTrigger } from '../../src/services/build-trigger';

describe('BuildTrigger', () => {
  let mockKV: any;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('triggers a build when no recent build exists', async () => {
    const trigger = new BuildTrigger(mockKV, mockFetch);
    const result = await trigger.triggerBuild('client-1', 'https://api.cloudflare.com/hooks/deploy/xxx');

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockKV.put).toHaveBeenCalled();
  });

  it('debounces builds within 15 minutes', async () => {
    const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
    mockKV.get.mockResolvedValue(recentTime);

    const trigger = new BuildTrigger(mockKV, mockFetch);
    const result = await trigger.triggerBuild('client-1', 'https://api.cloudflare.com/hooks/deploy/xxx');

    expect(result).toBe(false); // debounced
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('allows build after debounce window', async () => {
    const oldTime = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago
    mockKV.get.mockResolvedValue(oldTime);

    const trigger = new BuildTrigger(mockKV, mockFetch);
    const result = await trigger.triggerBuild('client-1', 'https://api.cloudflare.com/hooks/deploy/xxx');

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});

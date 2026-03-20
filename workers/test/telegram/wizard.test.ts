import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WizardManager } from '../../src/telegram/wizard';

describe('WizardManager', () => {
  let mockKV: any;

  beforeEach(() => {
    mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('starts a new wizard', async () => {
    const wiz = new WizardManager(mockKV);
    await wiz.start(12345, 'addclient', 'ask_name');

    expect(mockKV.put).toHaveBeenCalledOnce();
    const [key, value, opts] = mockKV.put.mock.calls[0];
    expect(key).toBe('wizard:12345');
    const state = JSON.parse(value);
    expect(state.type).toBe('addclient');
    expect(state.step).toBe('ask_name');
    expect(opts.expirationTtl).toBe(3600);
  });

  it('gets current wizard state', async () => {
    const stored = JSON.stringify({
      type: 'addclient',
      step: 'ask_name',
      data: { name: 'Test' },
      updatedAt: new Date().toISOString(),
    });
    mockKV.get.mockResolvedValue(stored);

    const wiz = new WizardManager(mockKV);
    const state = await wiz.get(12345);

    expect(state?.type).toBe('addclient');
    expect(state?.data.name).toBe('Test');
  });

  it('updates wizard step and data', async () => {
    const stored = JSON.stringify({
      type: 'addclient',
      step: 'ask_name',
      data: {},
      updatedAt: new Date().toISOString(),
    });
    mockKV.get.mockResolvedValue(stored);

    const wiz = new WizardManager(mockKV);
    await wiz.update(12345, 'ask_id', { business_name: 'Gas Champion' });

    const [, value] = mockKV.put.mock.calls[0];
    const state = JSON.parse(value);
    expect(state.step).toBe('ask_id');
    expect(state.data.business_name).toBe('Gas Champion');
  });

  it('clears wizard state', async () => {
    const wiz = new WizardManager(mockKV);
    await wiz.clear(12345);

    expect(mockKV.delete).toHaveBeenCalledWith('wizard:12345');
  });
});

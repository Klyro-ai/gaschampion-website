import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAddClientStep } from '../../../src/telegram/admin/addclient';

describe('Add Client Wizard', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
  };
  const mockWizard = {
    start: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  };
  const mockDb = {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({}),
        first: vi.fn().mockResolvedValue(null),
      }),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts wizard by asking for business name', async () => {
    await handleAddClientStep(mockBot as any, 11111, null, null, mockWizard as any, mockDb as any);

    expect(mockWizard.start).toHaveBeenCalledWith(11111, 'addclient', 'ask_name');
    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain("business name");
  });

  it('asks for client ID after receiving name', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_name', data: {} });

    await handleAddClientStep(mockBot as any, 11111, 'Gas Champion Ltd', null, mockWizard as any, mockDb as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_id', { business_name: 'Gas Champion Ltd' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('short ID');
  });

  it('asks for pages project after receiving ID', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_id', data: { business_name: 'Gas Champion' } });

    await handleAddClientStep(mockBot as any, 11111, 'gc-001', null, mockWizard as any, mockDb as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_project', { client_id: 'gc-001' });
  });

  it('shows confirmation after receiving project name', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'addclient',
      step: 'ask_project',
      data: { business_name: 'Gas Champion', client_id: 'gc-001' },
    });

    await handleAddClientStep(mockBot as any, 11111, 'gaschampion-website', null, mockWizard as any, mockDb as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Gas Champion');
    expect(text).toContain('gc-001');
    expect(text).toContain('gaschampion-website');
    expect(markup.inline_keyboard).toBeDefined();
  });
});

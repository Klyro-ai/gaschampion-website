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
  const mockEnv = {
    DB: mockDb,
    AI: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts wizard by asking for business name', async () => {
    await handleAddClientStep(mockBot as any, 11111, null, null, mockWizard as any, mockEnv as any);

    expect(mockWizard.start).toHaveBeenCalledWith(11111, 'addclient', 'ask_name');
    expect(mockBot.sendMessage).toHaveBeenCalledOnce();
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain("business name");
  });

  it('asks for client ID after receiving name', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_name', data: {} });

    await handleAddClientStep(mockBot as any, 11111, 'Gas Champion Ltd', null, mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_id', { business_name: 'Gas Champion Ltd' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('short ID');
  });

  it('asks for trade type after receiving ID', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_id', data: { business_name: 'Gas Champion' } });

    await handleAddClientStep(mockBot as any, 11111, 'gc-001', null, mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_trade', { client_id: 'gc-001' });
    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('trade');
    expect(markup.inline_keyboard).toBeDefined();
    expect(markup.inline_keyboard.length).toBeGreaterThanOrEqual(3);
  });

  it('asks for owner name after selecting trade', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_trade', data: { business_name: 'GC', client_id: 'gc-001' } });

    await handleAddClientStep(mockBot as any, 11111, null, 'addclient:trade:gas-engineer', mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_owner', { trade_type: 'gas-engineer' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Gas & Heating Engineer');
    expect(text).toContain("owner's name");
  });

  it('asks for phone after receiving owner name', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_owner', data: {} });

    await handleAddClientStep(mockBot as any, 11111, 'John Smith', null, mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_phone', { owner_name: 'John Smith' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('phone');
  });

  it('asks for email after receiving phone', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_phone', data: {} });

    await handleAddClientStep(mockBot as any, 11111, '07700900123', null, mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_email', { phone: '07700900123' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('email');
  });

  it('asks for town after receiving email', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_email', data: {} });

    await handleAddClientStep(mockBot as any, 11111, 'john@example.com', null, mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_town', { email: 'john@example.com' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('town');
  });

  it('asks for pages project after receiving town', async () => {
    mockWizard.get.mockResolvedValue({ type: 'addclient', step: 'ask_town', data: { business_name: 'GC' } });

    await handleAddClientStep(mockBot as any, 11111, 'Manchester', null, mockWizard as any, mockEnv as any);

    expect(mockWizard.update).toHaveBeenCalledWith(11111, 'ask_project', { town: 'Manchester' });
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Pages project');
  });

  it('shows confirmation after receiving project name', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'addclient',
      step: 'ask_project',
      data: {
        business_name: 'Gas Champion',
        client_id: 'gc-001',
        trade_type: 'gas-engineer',
        owner_name: 'John Smith',
        phone: '07700900123',
        email: 'john@gc.com',
        town: 'Manchester',
      },
    });

    await handleAddClientStep(mockBot as any, 11111, 'gaschampion-website', null, mockWizard as any, mockEnv as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Gas Champion');
    expect(text).toContain('gc-001');
    expect(text).toContain('Gas & Heating Engineer');
    expect(text).toContain('John Smith');
    expect(text).toContain('gaschampion-website');
    expect(text).toContain('site_config');
    expect(markup.inline_keyboard).toBeDefined();
  });

  it('cancels wizard when cancel is clicked', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'addclient',
      step: 'confirm',
      data: {},
    });

    await handleAddClientStep(mockBot as any, 11111, null, 'addclient:cancel', mockWizard as any, mockEnv as any);

    expect(mockWizard.clear).toHaveBeenCalledWith(11111);
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Cancelled');
  });
});

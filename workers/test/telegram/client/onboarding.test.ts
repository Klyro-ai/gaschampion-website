import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOnboarding } from '../../../src/telegram/client/onboarding';

describe('Client Onboarding', () => {
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

  beforeEach(() => vi.clearAllMocks());

  it('sends welcome message on valid invite', async () => {
    const mockClaimInvite = vi.fn().mockResolvedValue('gc-001');
    const mockGetClient = vi.fn().mockResolvedValue({ id: 'gc-001', business_name: 'Gas Champion Ltd' });

    await handleOnboarding(mockBot as any, 99999, 'invite_abc123', null, mockWizard as any, {
      claimInvite: mockClaimInvite,
      getClient: mockGetClient,
    } as any);

    expect(mockClaimInvite).toHaveBeenCalledWith('invite_abc123', '99999');
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Welcome to Klyro');
    expect(text).toContain('Gas Champion Ltd');
  });

  it('rejects expired invite', async () => {
    const mockClaimInvite = vi.fn().mockResolvedValue(null);

    await handleOnboarding(mockBot as any, 99999, 'invite_expired', null, mockWizard as any, {
      claimInvite: mockClaimInvite,
    } as any);

    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('expired or is invalid');
  });

  it('handles Google skip', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'onboarding',
      step: 'google',
      data: {},
      clientId: 'gc-001',
    });

    await handleOnboarding(mockBot as any, 99999, null, 'onboard:skip_google', mockWizard as any, {} as any);

    expect(mockWizard.update).toHaveBeenCalledWith(99999, 'social', expect.anything());
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Instagram & Facebook');
  });

  it('shows setup complete after hours selection', async () => {
    mockWizard.get.mockResolvedValue({
      type: 'onboarding',
      step: 'hours',
      data: { google: 'connected' },
      clientId: 'gc-001',
    });

    const mockUpdateHours = vi.fn().mockResolvedValue(undefined);
    const mockGetClient = vi.fn().mockResolvedValue({
      id: 'gc-001',
      business_name: 'Gas Champion Ltd',
      google_place_id: 'ChIJ123',
      instagram_user_id: null,
      facebook_page_id: null,
      quiet_hours_start: '09:00',
      quiet_hours_end: '18:00',
    });

    await handleOnboarding(mockBot as any, 99999, null, 'onboard:hours_9_18', mockWizard as any, {
      updateQuietHours: mockUpdateHours,
      getClient: mockGetClient,
    } as any);

    expect(mockWizard.clear).toHaveBeenCalledWith(99999);
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain("You're all set");
  });
});

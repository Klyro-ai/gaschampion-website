import { describe, it, expect, vi } from 'vitest';
import { handleConnect } from '../../../src/telegram/client/connect';

describe('/connect hub', () => {
  const mockBot = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    answerCallback: vi.fn().mockResolvedValue(undefined),
  };

  it('shows connection status for a fully connected client', async () => {
    const client = {
      id: 'gc-001',
      google_place_id: 'ChIJ123',
      instagram_user_id: 'ig-456',
      facebook_page_id: 'fb-789',
    };

    await handleConnect(mockBot as any, 12345, null, client as any, {} as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('Google Reviews');
    expect(text).toContain('Instagram & Facebook');
    expect(markup.inline_keyboard).toBeDefined();
  });

  it('shows connect buttons for disconnected services', async () => {
    const client = {
      id: 'gc-001',
      google_place_id: null,
      instagram_user_id: null,
      facebook_page_id: null,
    };

    await handleConnect(mockBot as any, 12345, null, client as any, {} as any);

    const [, text, markup] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('not connected');
    // Should have connect buttons
    const allCallbacks = markup.inline_keyboard.flat().map((b: any) => b.callback_data || b.url).filter(Boolean);
    expect(allCallbacks.length).toBeGreaterThan(0);
  });

  it('handles disconnect callback', async () => {
    const mockUpdateGoogle = vi.fn().mockResolvedValue(undefined);

    await handleConnect(mockBot as any, 12345, 'connect:disconnect_google', { id: 'gc-001' } as any, {
      updateGooglePlaceId: mockUpdateGoogle,
    } as any);

    expect(mockUpdateGoogle).toHaveBeenCalledWith('gc-001', null);
    const [, text] = mockBot.sendMessage.mock.calls[0];
    expect(text).toContain('disconnected');
  });
});

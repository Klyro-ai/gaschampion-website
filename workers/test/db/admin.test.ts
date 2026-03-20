import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { createClient, claimInvite, createInviteToken, getClientByChatId } from '../../src/db/client';

describe('Admin DB operations', () => {
  beforeEach(async () => {
    // Run both migrations
    const { default: migration1 } = await import('../../migrations/0001_initial.sql?raw');
    const { default: migration2 } = await import('../../migrations/0002_invite_tokens.sql?raw');
    for (const sql of [migration1, migration2]) {
      const statements = sql
        .split(';')
        .map((s: string) => s.replace(/--[^\n]*/g, '').trim())
        .filter((s: string) => s.length > 0)
        .map((s: string) => s + ';');
      for (const stmt of statements) {
        await env.DB.prepare(stmt).run();
      }
    }
  });

  it('creates a client with UNCLAIMED chat_id', async () => {
    const id = await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });

    expect(id).toBe('test-001');

    const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind('test-001').first();
    expect(client?.business_name).toBe('Test Business');
    expect(client?.telegram_chat_id).toBe('UNCLAIMED');
  });

  it('creates and validates an invite token', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });

    const token = await createInviteToken(env.DB, 'test-001');
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(20);

    // Verify it's in the DB
    const row = await env.DB.prepare('SELECT * FROM invite_tokens WHERE token = ?').bind(token).first();
    expect(row?.client_id).toBe('test-001');
  });

  it('claims an invite and updates client chat_id', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });
    const token = await createInviteToken(env.DB, 'test-001');

    const clientId = await claimInvite(env.DB, token, '99999');
    expect(clientId).toBe('test-001');

    // Verify chat_id updated
    const client = await env.DB.prepare('SELECT telegram_chat_id FROM clients WHERE id = ?').bind('test-001').first();
    expect(client?.telegram_chat_id).toBe('99999');

    // Verify authorized_user created
    const user = await env.DB.prepare('SELECT * FROM authorized_users WHERE telegram_chat_id = ?').bind('99999').first();
    expect(user?.client_id).toBe('test-001');
    expect(user?.role).toBe('admin');
  });

  it('rejects expired invite', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });

    // Insert an already-expired invite
    await env.DB.prepare(
      "INSERT INTO invite_tokens (token, client_id, expires_at) VALUES (?, ?, datetime('now', '-1 day'))"
    ).bind('expired-token', 'test-001').run();

    const result = await claimInvite(env.DB, 'expired-token', '99999');
    expect(result).toBeNull();
  });

  it('finds client by chat_id', async () => {
    await createClient(env.DB, {
      id: 'test-001',
      business_name: 'Test Business',
      pages_project_name: 'test-site',
      r2_bucket_prefix: 'test-001/',
    });
    // Update chat_id manually for test
    await env.DB.prepare("UPDATE clients SET telegram_chat_id = '55555' WHERE id = 'test-001'").run();

    const client = await getClientByChatId(env.DB, '55555');
    expect(client?.id).toBe('test-001');
    expect(client?.business_name).toBe('Test Business');
  });
});

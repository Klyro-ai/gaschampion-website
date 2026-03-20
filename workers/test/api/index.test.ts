import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../../src/api/index';

describe('API Worker', () => {
  it('returns 401 without API key', async () => {
    const req = new Request('http://localhost/api/gc-001/reviews');
    const res = await app.fetch(req, env);
    expect(res.status).toBe(401);
  });

  it('returns approved reviews for a client', async () => {
    // Run migration first
    const { default: migrationSQL } = await import('../../migrations/0001_initial.sql?raw');
    const statements = migrationSQL.split(';').filter((s: string) => s.trim());
    for (const stmt of statements) {
      try {
        await env.DB.prepare(stmt + ';').run();
      } catch {}
    }

    // Seed test data
    await env.DB.prepare(
      "INSERT INTO clients (id, business_name, telegram_chat_id, pages_project_name, r2_bucket_prefix) VALUES (?, ?, ?, ?, ?)"
    ).bind('gc-001', 'Gas Champion', 'chat123', 'gc-website', 'gc-001/').run();

    await env.DB.prepare(
      "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind('r1', 'gc-001', 'google', 'Alice', 5, 'Great', 'approved', 'ext-1').run();

    await env.DB.prepare(
      "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind('r2', 'gc-001', 'google', 'Bob', 3, 'OK', 'pending', 'ext-2').run();

    const req = new Request('http://localhost/api/gc-001/reviews', {
      headers: { 'X-API-Key': env.BUILD_API_KEY || 'test-key' },
    });
    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].author_name).toBe('Alice');
  });
});

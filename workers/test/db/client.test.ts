import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { ClientDB } from '../../src/db/client';

describe('ClientDB', () => {
  let clientDb: ClientDB;

  beforeEach(async () => {
    // Run migration — must actually execute SQL statements
    const { default: migrationSQL } = await import('../../migrations/0001_initial.sql?raw');
    const statements = migrationSQL
      .split(';')
      .map((s: string) => s.replace(/--[^\n]*/g, '').trim())
      .filter((s: string) => s.length > 0)
      .map((s: string) => s + ';');
    for (const stmt of statements) {
      await env.DB.prepare(stmt).run();
    }
    // Seed required client rows to satisfy FK constraints
    await env.DB.prepare(
      "INSERT OR IGNORE INTO clients (id, business_name, telegram_chat_id, pages_project_name, r2_bucket_prefix) VALUES (?, ?, ?, ?, ?)"
    ).bind('test-client-001', 'Test Client', '100', 'test-project', 'test/').run();
    await env.DB.prepare(
      "INSERT OR IGNORE INTO clients (id, business_name, telegram_chat_id, pages_project_name, r2_bucket_prefix) VALUES (?, ?, ?, ?, ?)"
    ).bind('other-client', 'Other Client', '200', 'other-project', 'other/').run();

    clientDb = new ClientDB(env.DB, 'test-client-001');
  });

  describe('reviews', () => {
    it('only returns reviews for the bound client', async () => {
      // Insert review for our client
      await env.DB.prepare(
        "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind('r1', 'test-client-001', 'google', 'Alice', 5, 'Great', 'approved', 'ext-1').run();

      // Insert review for different client
      await env.DB.prepare(
        "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind('r2', 'other-client', 'google', 'Bob', 5, 'Also great', 'approved', 'ext-2').run();

      const reviews = await clientDb.reviews.getApproved();
      expect(reviews).toHaveLength(1);
      expect(reviews[0].author_name).toBe('Alice');
    });

    it('upserts a review without duplicates', async () => {
      await clientDb.reviews.upsert({
        source: 'google',
        author_name: 'Alice',
        rating: 5,
        text: 'Great',
        review_date: '2024-01-01',
        source_id: 'ext-1',
      });

      // Upsert same source_id — should not create duplicate
      await clientDb.reviews.upsert({
        source: 'google',
        author_name: 'Alice',
        rating: 5,
        text: 'Great updated',
        review_date: '2024-01-01',
        source_id: 'ext-1',
      });

      const all = await clientDb.reviews.getPending();
      // Should have 0 pending because upsert keeps existing status
      // But there should only be 1 total review
      const count = await env.DB.prepare(
        "SELECT COUNT(*) as c FROM reviews WHERE client_id = ?"
      ).bind('test-client-001').first<{ c: number }>();
      expect(count?.c).toBe(1);
    });

    it('returns pending reviews', async () => {
      await env.DB.prepare(
        "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind('r1', 'test-client-001', 'google', 'Alice', 5, 'Great', 'pending', 'ext-1').run();

      const pending = await clientDb.reviews.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe('pending');
    });

    it('approves a review', async () => {
      await env.DB.prepare(
        "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind('r1', 'test-client-001', 'google', 'Alice', 5, 'Great', 'pending', 'ext-1').run();

      await clientDb.reviews.approve('r1');
      const approved = await clientDb.reviews.getApproved();
      expect(approved).toHaveLength(1);
    });

    it('cannot approve a review belonging to another client', async () => {
      await env.DB.prepare(
        "INSERT INTO reviews (id, client_id, source, author_name, rating, text, status, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind('r1', 'other-client', 'google', 'Bob', 5, 'Great', 'pending', 'ext-1').run();

      await clientDb.reviews.approve('r1');
      // Should not have been approved (wrong client)
      const result = await env.DB.prepare(
        "SELECT status FROM reviews WHERE id = ?"
      ).bind('r1').first<{ status: string }>();
      expect(result?.status).toBe('pending');
    });
  });

  describe('instagram', () => {
    it('upserts instagram posts', async () => {
      await clientDb.instagram.upsert({
        instagram_id: 'ig-123',
        caption: 'New boiler install',
        media_type: 'IMAGE',
        media_url: 'https://r2.example.com/img.webp',
        permalink: 'https://instagram.com/p/123',
        posted_at: '2024-01-01T12:00:00',
      });

      const posts = await clientDb.instagram.getAll();
      expect(posts).toHaveLength(1);
      expect(posts[0].caption).toBe('New boiler install');
    });
  });

  describe('blogPosts', () => {
    it('creates and publishes a blog post', async () => {
      const id = await clientDb.blogPosts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: '# Hello\n\nThis is a test.',
        description: 'A test post',
        tags: JSON.stringify(['test']),
      });

      expect(id).toBeDefined();

      await clientDb.blogPosts.publish(id);
      const published = await clientDb.blogPosts.getPublished();
      expect(published).toHaveLength(1);
      expect(published[0].published_at).toBeDefined();
    });
  });
});

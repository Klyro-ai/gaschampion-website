import { Hono } from 'hono';
import type { Env } from '../types';
import { forClient } from '../db/client';

const app = new Hono<{ Bindings: Env }>();

// Auth middleware — build-time API key
app.use('/api/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.BUILD_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// GET /api/:clientId/reviews — approved reviews + aggregate rating
app.get('/api/:clientId/reviews', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);

  const [reviews, aggregate] = await Promise.all([
    db.reviews.getApproved(),
    db.reviews.getAggregateRating(),
  ]);

  return c.json({ reviews, aggregate });
});

// GET /api/:clientId/instagram — synced Instagram posts
app.get('/api/:clientId/instagram', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);
  const posts = await db.instagram.getAll();
  return c.json({ posts });
});

// GET /api/:clientId/blog — published blog posts
app.get('/api/:clientId/blog', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);
  const posts = await db.blogPosts.getPublished();
  return c.json({ posts });
});

// GET /api/:clientId/gallery — gallery images ordered by display_order
app.get('/api/:clientId/gallery', async (c) => {
  const clientId = c.req.param('clientId');
  const db = forClient(c.env.DB, clientId);
  const images = await db.gallery.getAll();
  return c.json({ images });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;

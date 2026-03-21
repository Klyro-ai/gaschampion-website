const API_BASE = import.meta.env.KLYRO_API_URL || 'http://localhost:8787';
const API_KEY = import.meta.env.KLYRO_API_KEY || '';
const CLIENT_ID = import.meta.env.KLYRO_CLIENT_ID || 'gc-001';

async function fetchKlyro<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE}/api/${CLIENT_ID}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-API-Key': API_KEY },
  });

  if (!response.ok) {
    console.warn(`Klyro API error: ${response.status} for ${endpoint}`);
    return { reviews: [], posts: [], images: [], aggregate: { average: 0, count: 0 } } as T;
  }

  return response.json() as Promise<T>;
}

export async function getApprovedReviews() {
  const data = await fetchKlyro<{
    reviews: Array<{
      id: string;
      source: string;
      author_name: string;
      rating: number;
      text: string;
      review_date: string;
    }>;
    aggregate: { average: number; count: number };
  }>('/reviews');
  return data;
}

export async function getInstagramPosts() {
  const data = await fetchKlyro<{
    posts: Array<{
      instagram_id: string;
      caption: string | null;
      media_type: string;
      media_url: string;
      permalink: string;
      posted_at: string;
    }>;
  }>('/instagram');
  return data.posts;
}

export async function getPublishedBlogPosts() {
  const data = await fetchKlyro<{
    posts: Array<{
      id: string;
      title: string;
      slug: string;
      content: string;
      description: string;
      tags: string;
      image_url: string | null;
      published_at: string;
    }>;
  }>('/blog');
  return data.posts;
}

export async function getBlogPostBySlug(slug: string) {
  const url = `${API_BASE}/api/${CLIENT_ID}/blog/${slug}`;
  const response = await fetch(url, {
    headers: { 'X-API-Key': API_KEY },
  });

  if (!response.ok) return null;
  const data = await response.json() as { post: any };
  return data?.post ?? null;
}

export async function getGalleryImages() {
  const data = await fetchKlyro<{
    images: Array<{
      id: string;
      r2_key: string;
      alt_text: string | null;
      caption: string | null;
      srcset: string | null;
    }>;
  }>('/gallery');
  return data.images;
}

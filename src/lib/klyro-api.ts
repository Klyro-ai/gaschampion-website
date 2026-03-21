/** Build a public image URL served from the worker's R2 endpoint */
export function imageUrl(apiBase: string, r2Key: string): string {
  return `${apiBase}/api/image/${r2Key}`;
}

type ApiFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function fetchForClient<T>(apiFetch: ApiFetch, apiKey: string, clientId: string, endpoint: string): Promise<T> {
  const url = `https://internal/api/${clientId}${endpoint}`;
  const response = await apiFetch(url, {
    headers: { 'X-API-Key': apiKey },
  });

  if (!response.ok) {
    console.warn(`Klyro API error: ${response.status} for ${endpoint}`);
    return { reviews: [], posts: [], images: [], aggregate: { average: 0, count: 0 } } as T;
  }

  return response.json() as Promise<T>;
}

export async function getApprovedReviews(apiFetch: ApiFetch, apiKey: string, clientId: string) {
  return fetchForClient<{
    reviews: Array<{ id: string; source: string; author_name: string; rating: number; text: string; review_date: string }>;
    aggregate: { average: number; count: number };
  }>(apiFetch, apiKey, clientId, '/reviews');
}

export async function getPublishedBlogPosts(apiFetch: ApiFetch, apiKey: string, clientId: string) {
  const data = await fetchForClient<{
    posts: Array<{ id: string; title: string; slug: string; content: string; description: string; tags: string; image_url: string | null; image_alt_text: string | null; published_at: string }>;
  }>(apiFetch, apiKey, clientId, '/blog');
  return data.posts;
}

export async function getBlogPostBySlug(apiFetch: ApiFetch, apiKey: string, clientId: string, slug: string) {
  const url = `https://internal/api/${clientId}/blog/${slug}`;
  const response = await apiFetch(url, { headers: { 'X-API-Key': apiKey } });
  if (!response.ok) return null;
  const data = await response.json() as { post: any };
  return data?.post ?? null;
}

export async function getGalleryImages(apiFetch: ApiFetch, apiKey: string, clientId: string) {
  const data = await fetchForClient<{
    images: Array<{ id: string; r2_key: string; alt_text: string | null; caption: string | null; srcset: string | null }>;
  }>(apiFetch, apiKey, clientId, '/gallery');
  return data.images;
}

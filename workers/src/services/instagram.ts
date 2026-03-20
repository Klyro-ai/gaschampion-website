export interface InstagramMediaRaw {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export interface ParsedInstagramPost {
  instagram_id: string;
  caption: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  posted_at: string;
}

export function parseInstagramPost(raw: InstagramMediaRaw): ParsedInstagramPost {
  return {
    instagram_id: raw.id,
    caption: raw.caption ?? null,
    media_type: raw.media_type,
    media_url: raw.media_url,
    thumbnail_url: raw.thumbnail_url ?? null,
    permalink: raw.permalink,
    posted_at: raw.timestamp,
  };
}

export async function fetchInstagramPosts(
  userId: string,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
  limit: number = 25
): Promise<ParsedInstagramPost[]> {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.instagram.com/v21.0/${userId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { data?: InstagramMediaRaw[] };
  if (!data.data || data.data.length === 0) {
    return [];
  }

  return data.data.map(parseInstagramPost);
}

export async function refreshInstagramToken(
  currentToken: string,
  fetchFn: typeof fetch = fetch
): Promise<{ access_token: string; expires_in: number }> {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`;

  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(`Instagram token refresh failed: ${response.status}`);
  }

  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

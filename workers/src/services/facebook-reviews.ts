export interface FacebookReviewRaw {
  reviewer?: { name: string };
  rating?: number;
  review_text?: string;
  created_time: string;
  recommendation_type?: 'positive' | 'negative' | 'none';
  open_graph_story?: { id: string };
}

export interface ParsedReview {
  source: 'facebook';
  author_name: string | null;
  rating: number | null;
  text: string | null;
  review_date: string;
  source_id: string;
}

export function parseFacebookReview(raw: FacebookReviewRaw): ParsedReview {
  let rating = raw.rating ?? null;
  if (rating === null && raw.recommendation_type) {
    rating = raw.recommendation_type === 'positive' ? 5 : raw.recommendation_type === 'negative' ? 1 : null;
  }

  return {
    source: 'facebook',
    author_name: raw.reviewer?.name ?? null,
    rating,
    text: raw.review_text ?? null,
    review_date: raw.created_time,
    source_id: raw.open_graph_story?.id ?? crypto.randomUUID(),
  };
}

export async function fetchFacebookReviews(
  pageId: string,
  accessToken: string,
  fetchFn: typeof fetch = fetch
): Promise<ParsedReview[]> {
  const url = `https://graph.facebook.com/v21.0/${pageId}/ratings?fields=reviewer,rating,review_text,created_time,recommendation_type,open_graph_story&access_token=${accessToken}`;

  const response = await fetchFn(url);

  if (!response.ok) {
    if (response.status === 403 || response.status === 400) {
      console.warn(`Facebook ratings endpoint unavailable for page ${pageId}: ${response.status}`);
      return [];
    }
    throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { data?: FacebookReviewRaw[] };
  if (!data.data || data.data.length === 0) {
    return [];
  }

  return data.data.map(parseFacebookReview);
}

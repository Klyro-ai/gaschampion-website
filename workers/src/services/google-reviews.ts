export interface GoogleReviewRaw {
  name: string;
  rating: number;
  text?: { text: string };
  authorAttribution?: { displayName: string };
  publishTime: string;
  relativePublishTimeDescription?: string;
}

export interface ParsedReview {
  source: 'google';
  author_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source_id: string;
}

export function parseGoogleReview(raw: GoogleReviewRaw): ParsedReview {
  const parts = raw.name.split('/');
  const sourceId = parts[parts.length - 1];

  return {
    source: 'google',
    author_name: raw.authorAttribution?.displayName ?? null,
    rating: raw.rating,
    text: raw.text?.text ?? null,
    review_date: raw.publishTime,
    source_id: sourceId,
  };
}

export async function fetchGoogleReviews(
  placeId: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch
): Promise<ParsedReview[]> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&key=${apiKey}`;

  const response = await fetchFn(url, {
    headers: {
      'X-Goog-FieldMask': 'reviews',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { reviews?: GoogleReviewRaw[] };
  if (!data.reviews || data.reviews.length === 0) {
    return [];
  }

  return data.reviews.map(parseGoogleReview);
}

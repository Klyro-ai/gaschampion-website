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

/** Search for a business by text query using Google Places Text Search */
export async function searchGooglePlaces(
  query: string,
  apiKey: string,
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = (...args) => fetch(...args)
): Promise<Array<{ placeId: string; name: string; address: string }>> {
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!response.ok) {
    throw new Error(`Google Places search error: ${response.status}`);
  }

  const data = await response.json() as {
    places?: Array<{
      id: string;
      displayName: { text: string };
      formattedAddress: string;
    }>;
  };

  if (!data.places || data.places.length === 0) return [];

  return data.places.slice(0, 3).map(p => ({
    placeId: p.id,
    name: p.displayName.text,
    address: p.formattedAddress,
  }));
}

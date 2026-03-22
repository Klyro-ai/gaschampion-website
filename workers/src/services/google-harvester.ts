/**
 * Google Places data harvester for Klyro onboarding.
 *
 * Uses the Places API (New) to search for a business, pull details,
 * reviews and photo references — no client OAuth required.
 */

export interface GoogleHarvestResult {
  found: boolean;
  placeId?: string;
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string[];
  rating?: number;
  reviewCount?: number;
  description?: string;
  categories?: string[];
  mapsUrl?: string;
  reviews: Array<{
    authorName: string;
    rating: number;
    text: string;
    publishTime: string;
  }>;
  photoRefs: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'websiteUri',
  'regularOpeningHours',
  'rating',
  'userRatingCount',
  'editorialSummary',
  'types',
  'googleMapsUri',
  'reviews',
  'photos',
].join(',');

/** Search for a business and return comprehensive place data. */
export async function searchGoogleBusiness(
  businessName: string,
  location: string,
  apiKey: string,
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = (...args) => fetch(...args),
): Promise<GoogleHarvestResult> {
  const textQuery = `${businessName} ${location}`;

  const response = await fetchFn(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': `places.${DETAIL_FIELDS.split(',').join(',places.')}`,
    },
    body: JSON.stringify({ textQuery, maxResultCount: 1 }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Google Places search error: ${response.status} — ${body}`);
  }

  const data = (await response.json()) as { places?: PlaceResult[] };

  if (!data.places || data.places.length === 0) {
    return { found: false, reviews: [], photoRefs: [] };
  }

  const place = data.places[0];
  return mapPlaceResult(place);
}

// ── Photo downloading ──────────────────────────────────────────────

export interface DownloadedPhoto {
  r2Key: string;
  photoRef: string;
}

/**
 * Download photos from Google Places photo references, strip EXIF
 * metadata, and store them in R2.
 */
export async function downloadGooglePhotos(
  photoRefs: Array<{ name: string }>,
  apiKey: string,
  r2: R2Bucket,
  clientPrefix: string,
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = (...args) => fetch(...args),
): Promise<DownloadedPhoto[]> {
  const results: DownloadedPhoto[] = [];

  for (const ref of photoRefs.slice(0, 10)) {
    try {
      const mediaUrl = `https://places.googleapis.com/v1/${ref.name}/media?maxWidthPx=1200&key=${apiKey}`;
      const photoResponse = await fetchFn(mediaUrl, { redirect: 'follow' });

      if (!photoResponse.ok) continue;

      const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : 'jpg';
      const photoId = ref.name.split('/').pop() || crypto.randomUUID();
      const r2Key = `${clientPrefix}google-photos/${photoId}.${ext}`;

      // Read the image bytes. We strip EXIF by re-writing only the
      // image data. For JPEG, EXIF lives in APP1 markers — the
      // simplest portable approach is to strip all APP markers.
      let imageBytes = new Uint8Array(await photoResponse.arrayBuffer());
      if (ext === 'jpg') {
        imageBytes = stripJpegExif(imageBytes);
      }

      await r2.put(r2Key, imageBytes, {
        httpMetadata: { contentType },
      });

      results.push({ r2Key, photoRef: ref.name });
    } catch {
      // Skip individual photo failures — best effort
    }
  }

  return results;
}

// ── EXIF stripping (JPEG only) ─────────────────────────────────────

/**
 * Remove EXIF / APP markers from a JPEG buffer.
 * Keeps SOI, SOS→EOI, and DQT/DHT/SOF markers. Drops APP0–APP15.
 */
export function stripJpegExif(data: Uint8Array): Uint8Array {
  if (data[0] !== 0xff || data[1] !== 0xd8) return data; // not JPEG

  const chunks: Uint8Array[] = [];
  chunks.push(data.subarray(0, 2)); // SOI

  let offset = 2;
  while (offset < data.length - 1) {
    if (data[offset] !== 0xff) break;

    const marker = data[offset + 1];

    // SOS (Start of Scan) — rest of file is image data
    if (marker === 0xda) {
      chunks.push(data.subarray(offset));
      break;
    }

    // Markers without length
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(data.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    const segLen = (data[offset + 2] << 8) | data[offset + 3];
    const segEnd = offset + 2 + segLen;

    // Drop APP0–APP15 markers (0xE0–0xEF) — these contain EXIF, XMP, etc.
    const isApp = marker >= 0xe0 && marker <= 0xef;
    if (!isApp) {
      chunks.push(data.subarray(offset, segEnd));
    }

    offset = segEnd;
  }

  // Concatenate chunks
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

// ── Internal helpers ───────────────────────────────────────────────

interface PlaceResult {
  id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: { text: string };
  types?: string[];
  googleMapsUri?: string;
  reviews?: Array<{
    authorAttribution?: { displayName: string };
    rating: number;
    text?: { text: string };
    publishTime: string;
  }>;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
}

function mapPlaceResult(place: PlaceResult): GoogleHarvestResult {
  return {
    found: true,
    placeId: place.id,
    businessName: place.displayName?.text,
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    hours: place.regularOpeningHours?.weekdayDescriptions,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    description: place.editorialSummary?.text,
    categories: place.types,
    mapsUrl: place.googleMapsUri,
    reviews: (place.reviews || []).map((r) => ({
      authorName: r.authorAttribution?.displayName || 'Anonymous',
      rating: r.rating,
      text: r.text?.text || '',
      publishTime: r.publishTime,
    })),
    photoRefs: (place.photos || []).slice(0, 10).map((p) => ({
      name: p.name,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    })),
  };
}

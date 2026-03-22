import { describe, it, expect, vi } from 'vitest';
import {
  searchGoogleBusiness,
  downloadGooglePhotos,
  stripJpegExif,
  type GoogleHarvestResult,
} from '../../src/services/google-harvester';

const SAMPLE_PLACE_RESPONSE = {
  places: [
    {
      id: 'ChIJtest123',
      displayName: { text: 'Gas Champion Heating' },
      formattedAddress: '123 High Street, Darlington DL1 1AA',
      nationalPhoneNumber: '01325 123456',
      websiteUri: 'https://gaschampion.co.uk',
      regularOpeningHours: {
        weekdayDescriptions: [
          'Monday: 8:00 AM – 6:00 PM',
          'Tuesday: 8:00 AM – 6:00 PM',
        ],
      },
      rating: 4.9,
      userRatingCount: 142,
      editorialSummary: { text: 'Top-rated gas engineer in Darlington.' },
      types: ['plumber', 'gas_engineer', 'point_of_interest'],
      googleMapsUri: 'https://maps.google.com/?cid=12345',
      reviews: [
        {
          authorAttribution: { displayName: 'Sarah M.' },
          rating: 5,
          text: { text: 'Brilliant boiler install, very professional.' },
          publishTime: '2024-06-15T10:30:00Z',
        },
        {
          authorAttribution: { displayName: 'John D.' },
          rating: 4,
          publishTime: '2024-05-10T08:00:00Z',
        },
      ],
      photos: [
        { name: 'places/ChIJtest123/photos/photo1', widthPx: 1200, heightPx: 800 },
        { name: 'places/ChIJtest123/photos/photo2', widthPx: 800, heightPx: 600 },
      ],
    },
  ],
};

describe('Google Harvester', () => {
  describe('searchGoogleBusiness', () => {
    it('parses a full place response correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_PLACE_RESPONSE),
      });

      const result = await searchGoogleBusiness(
        'Gas Champion',
        'Darlington',
        'fake-key',
        mockFetch,
      );

      expect(result.found).toBe(true);
      expect(result.placeId).toBe('ChIJtest123');
      expect(result.businessName).toBe('Gas Champion Heating');
      expect(result.address).toBe('123 High Street, Darlington DL1 1AA');
      expect(result.phone).toBe('01325 123456');
      expect(result.website).toBe('https://gaschampion.co.uk');
      expect(result.hours).toHaveLength(2);
      expect(result.rating).toBe(4.9);
      expect(result.reviewCount).toBe(142);
      expect(result.description).toBe('Top-rated gas engineer in Darlington.');
      expect(result.categories).toContain('plumber');
      expect(result.mapsUrl).toContain('maps.google.com');
    });

    it('parses reviews correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_PLACE_RESPONSE),
      });

      const result = await searchGoogleBusiness('Gas Champion', 'Darlington', 'fake-key', mockFetch);

      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0].authorName).toBe('Sarah M.');
      expect(result.reviews[0].rating).toBe(5);
      expect(result.reviews[0].text).toBe('Brilliant boiler install, very professional.');
      // Review without text should have empty string
      expect(result.reviews[1].text).toBe('');
    });

    it('parses photo refs correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SAMPLE_PLACE_RESPONSE),
      });

      const result = await searchGoogleBusiness('Gas Champion', 'Darlington', 'fake-key', mockFetch);

      expect(result.photoRefs).toHaveLength(2);
      expect(result.photoRefs[0].name).toBe('places/ChIJtest123/photos/photo1');
      expect(result.photoRefs[0].widthPx).toBe(1200);
    });

    it('returns found: false when no results', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ places: [] }),
      });

      const result = await searchGoogleBusiness('Nonexistent Biz', 'Nowhere', 'fake-key', mockFetch);
      expect(result.found).toBe(false);
      expect(result.reviews).toEqual([]);
      expect(result.photoRefs).toEqual([]);
    });

    it('returns found: false when places field is missing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await searchGoogleBusiness('Test', 'Test', 'fake-key', mockFetch);
      expect(result.found).toBe(false);
    });

    it('throws on API error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      await expect(
        searchGoogleBusiness('Test', 'Test', 'fake-key', mockFetch),
      ).rejects.toThrow('Google Places search error: 403');
    });

    it('sends correct headers and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ places: [] }),
      });

      await searchGoogleBusiness('My Business', 'London', 'test-api-key', mockFetch);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://places.googleapis.com/v1/places:searchText');
      expect(opts.method).toBe('POST');
      expect(opts.headers['X-Goog-Api-Key']).toBe('test-api-key');
      expect(opts.headers['X-Goog-FieldMask']).toContain('places.id');
      expect(opts.headers['X-Goog-FieldMask']).toContain('places.reviews');
      expect(opts.headers['X-Goog-FieldMask']).toContain('places.photos');

      const body = JSON.parse(opts.body);
      expect(body.textQuery).toBe('My Business London');
      expect(body.maxResultCount).toBe(1);
    });
  });

  describe('downloadGooglePhotos', () => {
    it('downloads photos and stores in R2', async () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0xff, 0xd9]);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: () => Promise.resolve(jpegBytes.buffer),
      });

      const mockR2 = { put: vi.fn().mockResolvedValue(undefined) } as unknown as R2Bucket;

      const refs = [{ name: 'places/abc/photos/photo1' }];
      const results = await downloadGooglePhotos(refs, 'key', mockR2, 'client1/', mockFetch);

      expect(results).toHaveLength(1);
      expect(results[0].r2Key).toMatch(/^client1\/google-photos\/photo1\.jpg$/);
      expect(results[0].photoRef).toBe('places/abc/photos/photo1');
      expect(mockR2.put).toHaveBeenCalledOnce();
    });

    it('skips failed photo downloads gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false });
      const mockR2 = { put: vi.fn() } as unknown as R2Bucket;

      const refs = [{ name: 'places/abc/photos/photo1' }];
      const results = await downloadGooglePhotos(refs, 'key', mockR2, 'client1/', mockFetch);

      expect(results).toHaveLength(0);
      expect(mockR2.put).not.toHaveBeenCalled();
    });

    it('limits to 10 photos', async () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: () => Promise.resolve(jpegBytes.buffer),
      });

      const mockR2 = { put: vi.fn().mockResolvedValue(undefined) } as unknown as R2Bucket;

      // Provide 15 refs — should only download 10
      const refs = Array.from({ length: 15 }, (_, i) => ({
        name: `places/abc/photos/photo${i}`,
      }));

      const results = await downloadGooglePhotos(refs, 'key', mockR2, 'test/', mockFetch);
      expect(results).toHaveLength(10);
      expect(mockFetch).toHaveBeenCalledTimes(10);
    });
  });

  describe('stripJpegExif', () => {
    it('returns non-JPEG data unchanged', () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      expect(stripJpegExif(png)).toBe(png);
    });

    it('strips APP1 (EXIF) marker from JPEG', () => {
      // Build a minimal JPEG: SOI + APP1 + SOS + data + EOI
      const soi = [0xff, 0xd8];
      // APP1 marker with 4 bytes of data (length = 6 including the length bytes)
      const app1 = [0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66];
      // SOS marker
      const sos = [0xff, 0xda, 0x00, 0x02];
      const imageData = [0x01, 0x02, 0x03];
      const eoi = [0xff, 0xd9];

      const input = new Uint8Array([...soi, ...app1, ...sos, ...imageData, ...eoi]);
      const result = stripJpegExif(input);

      // APP1 should be gone, SOS and data preserved
      expect(result[0]).toBe(0xff);
      expect(result[1]).toBe(0xd8);
      // Next should be SOS, not APP1
      expect(result[2]).toBe(0xff);
      expect(result[3]).toBe(0xda);
    });
  });
});

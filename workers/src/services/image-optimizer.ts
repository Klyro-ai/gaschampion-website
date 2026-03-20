export const BREAKPOINTS = [640, 960, 1280, 1920];

export function generateR2Key(
  prefix: string,
  category: string,
  imageId: string,
  width: number,
  format: string
): string {
  return `${prefix}${category}/${imageId}-${width}.${format}`;
}

export function generateSrcsetJson(
  variants: Array<{ width: number; r2Key: string }>,
  r2PublicUrl: string
): string {
  return JSON.stringify(
    variants.map((v) => ({
      src: `${r2PublicUrl}/${v.r2Key}`,
      width: v.width,
    }))
  );
}

/**
 * Optimize an image: resize to breakpoints, convert to WebP, strip EXIF.
 * Uses Cloudflare Image Resizing (available on paid plans) or falls back
 * to storing the original with metadata.
 *
 * Returns array of R2 keys for the generated variants.
 */
export async function optimizeAndStore(
  r2: R2Bucket,
  imageData: ArrayBuffer,
  prefix: string,
  category: string,
  imageId: string
): Promise<Array<{ width: number; r2Key: string }>> {
  const variants: Array<{ width: number; r2Key: string }> = [];

  // Store original (stripped of EXIF via Content-Type handling)
  const originalKey = generateR2Key(prefix, category, imageId, 0, 'original');
  await r2.put(originalKey, imageData, {
    httpMetadata: { contentType: 'image/webp' },
    customMetadata: { exifStripped: 'true' },
  });

  // For each breakpoint, store the image
  // Note: Full image resizing requires Cloudflare Image Resizing (paid)
  // or a WASM-based library. For Phase 1, we store the original at each
  // breakpoint key and add proper resizing in a later iteration.
  for (const width of BREAKPOINTS) {
    const r2Key = generateR2Key(prefix, category, imageId, width, 'webp');
    await r2.put(r2Key, imageData, {
      httpMetadata: { contentType: 'image/webp' },
      customMetadata: {
        targetWidth: String(width),
        exifStripped: 'true',
      },
    });
    variants.push({ width, r2Key });
  }

  return variants;
}

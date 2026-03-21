import type { TelegramBot } from '../telegram/bot';

/**
 * Strip EXIF/APPn metadata from JPEG to remove GPS coordinates and camera info.
 * Selectively removes APP1-APP15 (0xFFE1-0xFFEF) markers while preserving
 * DQT, DHT, SOF, and other essential markers needed for decoding.
 */
export function stripExifJpeg(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);

  // Check for JPEG SOI marker
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return buffer;

  const chunks: Uint8Array[] = [bytes.slice(0, 2)]; // Keep SOI
  let i = 2;

  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xFF) { i++; continue; }

    const marker = bytes[i + 1];

    // SOS (0xDA) — everything after this is image data, keep it all
    if (marker === 0xDA) {
      chunks.push(bytes.slice(i));
      break;
    }

    // APPn markers (0xE0-0xEF) — keep APP0 (JFIF), strip APP1-APP15 (EXIF etc)
    if (marker >= 0xE1 && marker <= 0xEF) {
      // Skip this segment: read length and advance past it
      const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
      i += 2 + segLen;
      continue;
    }

    // All other markers (DQT, DHT, SOF, APP0, etc) — keep them
    if (marker >= 0xC0 || marker === 0x00) {
      // Markers with length field
      if (marker !== 0xD8 && marker !== 0xD9 && marker !== 0x00) {
        const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
        chunks.push(bytes.slice(i, i + 2 + segLen));
        i += 2 + segLen;
      } else {
        chunks.push(bytes.slice(i, i + 2));
        i += 2;
      }
    } else {
      i++;
    }
  }

  // Concatenate chunks
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

/**
 * Download a photo from Telegram, strip EXIF, upload to R2, add to gallery DB.
 */
export async function downloadAndStorePhoto(
  bot: TelegramBot,
  fileId: string,
  clientId: string,
  r2: R2Bucket,
  db: { gallery: { add: (img: any) => Promise<string> } },
  prefix: string,
): Promise<{ r2Key: string; galleryId: string }> {
  // Get file path from Telegram
  const filePath = await bot.getFile(fileId);
  const fileUrl = bot.getFileUrl(filePath);

  // Download
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Failed to download photo: ${response.status}`);
  const originalBuffer = await response.arrayBuffer();

  // Strip EXIF
  const cleanBuffer = stripExifJpeg(originalBuffer);

  // Generate unique key
  const imageId = crypto.randomUUID();
  const r2Key = `${prefix}gallery/${imageId}-0.original`;

  // Upload to R2
  await r2.put(r2Key, cleanBuffer, {
    httpMetadata: { contentType: 'image/jpeg' },
  });

  // Add to gallery
  const galleryId = await db.gallery.add({
    r2_key: r2Key,
    alt_text: null,
    caption: null,
    width: null,
    height: null,
    srcset: null,
    source: 'upload',
    instagram_post_id: null,
  });

  return { r2Key, galleryId };
}

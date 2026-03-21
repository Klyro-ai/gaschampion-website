import { describe, it, expect } from 'vitest';
import { stripExifJpeg } from '../../src/services/photo-upload';

describe('stripExifJpeg', () => {
  it('removes APP1 (EXIF) while preserving other markers', () => {
    // Minimal JPEG: SOI + APP0 + APP1 (EXIF) + DQT + SOS + image data + EOI
    const soi = new Uint8Array([0xFF, 0xD8]);
    const app0 = new Uint8Array([0xFF, 0xE0, 0x00, 0x04, 0x4A, 0x46]); // JFIF - keep
    const app1 = new Uint8Array([0xFF, 0xE1, 0x00, 0x04, 0x45, 0x78]); // EXIF - strip
    const dqt = new Uint8Array([0xFF, 0xDB, 0x00, 0x03, 0x01]); // DQT - keep
    const sos = new Uint8Array([0xFF, 0xDA, 0x00, 0x02]); // SOS - keep
    const imgData = new Uint8Array([0x01, 0x02, 0x03]);
    const eoi = new Uint8Array([0xFF, 0xD9]);

    const full = new Uint8Array([...soi, ...app0, ...app1, ...dqt, ...sos, ...imgData, ...eoi]);
    const stripped = stripExifJpeg(full.buffer);
    const result = new Uint8Array(stripped);

    // Should start with SOI
    expect(result[0]).toBe(0xFF);
    expect(result[1]).toBe(0xD8);
    // Should NOT contain APP1 (0xFFE1)
    let hasApp1 = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === 0xFF && result[i + 1] === 0xE1) hasApp1 = true;
    }
    expect(hasApp1).toBe(false);
    // Should still contain DQT (0xFFDB)
    let hasDqt = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === 0xFF && result[i + 1] === 0xDB) hasDqt = true;
    }
    expect(hasDqt).toBe(true);
    // Should be smaller than original (APP1 removed)
    expect(result.length).toBeLessThan(full.length);
  });

  it('returns original if not JPEG', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
    const result = stripExifJpeg(png.buffer);
    expect(new Uint8Array(result)).toEqual(png);
  });
});

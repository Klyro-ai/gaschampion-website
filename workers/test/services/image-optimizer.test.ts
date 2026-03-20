import { describe, it, expect } from 'vitest';
import { generateR2Key, generateSrcsetJson, BREAKPOINTS } from '../../src/services/image-optimizer';

describe('Image Optimizer', () => {
  it('exports standard breakpoints', () => {
    expect(BREAKPOINTS).toEqual([640, 960, 1280, 1920]);
  });

  it('generates correct R2 key with client prefix', () => {
    const key = generateR2Key('gc-001/', 'gallery', 'photo-123', 960, 'webp');
    expect(key).toBe('gc-001/gallery/photo-123-960.webp');
  });

  it('generates srcset JSON from variants', () => {
    const variants = [
      { width: 640, r2Key: 'gc-001/gallery/img-640.webp' },
      { width: 960, r2Key: 'gc-001/gallery/img-960.webp' },
    ];
    const json = generateSrcsetJson(variants, 'https://media.example.com');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].src).toContain('img-640.webp');
    expect(parsed[0].width).toBe(640);
  });
});

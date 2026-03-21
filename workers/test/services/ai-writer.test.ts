import { describe, it, expect } from 'vitest';
import { buildBlogPrompt, buildEditPrompt } from '../../src/services/ai-prompts';
import { parseDraftResponse } from '../../src/services/ai-writer';

describe('buildBlogPrompt', () => {
  it('includes business name and caption in prompt', () => {
    const prompt = buildBlogPrompt({
      businessName: 'Gas Champion Ltd',
      serviceArea: 'Haverhill, Suffolk',
      caption: 'New boiler fitted in Clare',
      hasPhoto: true,
    });
    expect(prompt).toContain('Gas Champion Ltd');
    expect(prompt).toContain('Haverhill, Suffolk');
    expect(prompt).toContain('New boiler fitted in Clare');
    expect(prompt).toContain('They Ask, You Answer');
    expect(prompt).toContain('NO customer names');
  });

  it('sets image_alt_text to null when no photo', () => {
    const prompt = buildBlogPrompt({
      businessName: 'Test',
      serviceArea: 'London',
      caption: 'test',
      hasPhoto: false,
    });
    expect(prompt).toContain('"image_alt_text": null');
  });
});

describe('buildEditPrompt', () => {
  it('includes existing content and edit instruction', () => {
    const prompt = buildEditPrompt('{"title":"Old"}', 'change title to New');
    expect(prompt).toContain('Old');
    expect(prompt).toContain('change title to New');
  });
});

describe('parseDraftResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      title: 'Test Title',
      slug: 'test-title',
      content: '## Heading\nContent here',
      description: 'A test post',
      tags: ['test', 'suffolk'],
      image_alt_text: 'A boiler',
    });
    const result = parseDraftResponse(json);
    expect(result.title).toBe('Test Title');
    expect(result.tags).toEqual(['test', 'suffolk']);
  });

  it('handles JSON wrapped in markdown fences', () => {
    const json = '```json\n{"title":"Test","slug":"test","content":"c","description":"d","tags":[],"image_alt_text":null}\n```';
    const result = parseDraftResponse(json);
    expect(result.title).toBe('Test');
  });

  it('throws on invalid response', () => {
    expect(() => parseDraftResponse('not json at all')).toThrow();
  });

  it('throws on missing required fields', () => {
    expect(() => parseDraftResponse('{"title":"only title"}')).toThrow('missing required fields');
  });
});

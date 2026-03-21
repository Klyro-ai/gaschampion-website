import { describe, it, expect } from 'vitest';
import { buildWorkersAiPrompt, buildClaudePrompt, buildOpenAiPrompt, buildEditPrompt } from '../../src/services/ai-prompts';
import { parseDraftResponse } from '../../src/services/ai-writer';

describe('buildWorkersAiPrompt', () => {
  it('includes business name and caption', () => {
    const prompt = buildWorkersAiPrompt({
      businessName: 'Gas Champion Ltd',
      serviceArea: 'Haverhill, Suffolk',
      caption: 'New boiler fitted in Clare',
      hasPhoto: true,
    });
    expect(prompt).toContain('Gas Champion Ltd');
    expect(prompt).toContain('Haverhill, Suffolk');
    expect(prompt).toContain('New boiler fitted in Clare');
    expect(prompt).toContain('NO customer names');
  });

  it('is under 2000 tokens (short prompt for small model)', () => {
    const prompt = buildWorkersAiPrompt({
      businessName: 'Test',
      serviceArea: 'London',
      caption: 'test job',
      hasPhoto: false,
    });
    // Rough token estimate: ~4 chars per token
    expect(prompt.length).toBeLessThan(8000);
  });
});

describe('buildClaudePrompt', () => {
  it('includes full expert guidance', () => {
    const prompt = buildClaudePrompt({
      businessName: 'Gas Champion Ltd',
      serviceArea: 'Haverhill, Suffolk',
      caption: 'Boiler repair in Clare',
      hasPhoto: true,
      phone: '07828 943 186',
      yearsExperience: 18,
      registrationNumber: '636427',
    });
    expect(prompt).toContain('pub test');
    expect(prompt).toContain('Strategic honesty');
    expect(prompt).toContain('636427');
  });
});

describe('buildOpenAiPrompt', () => {
  it('returns system and user messages', () => {
    const { system, user } = buildOpenAiPrompt({
      businessName: 'Test Co',
      serviceArea: 'London',
      caption: 'test',
      hasPhoto: false,
    });
    expect(system).toContain('blog writer');
    expect(user).toContain('Test Co');
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

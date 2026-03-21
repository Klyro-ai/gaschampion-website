import type { BlogDraftOutput, BlogDraftInput } from './ai-prompts';
import { buildBlogPrompt, buildEditPrompt } from './ai-prompts';

export interface AiWriter {
  generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput>;
  editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput>;
}

export function parseDraftResponse(raw: string): BlogDraftOutput {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // LLMs put literal newlines inside JSON string values which breaks JSON.parse.
  // Only escape control chars INSIDE quoted strings, not in JSON structure.
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    return match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  });

  const parsed = JSON.parse(cleaned);

  if (!parsed.title || !parsed.slug || !parsed.content || !parsed.description) {
    throw new Error('AI response missing required fields');
  }

  return {
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content,
    description: parsed.description,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    image_alt_text: parsed.image_alt_text ?? null,
  };
}

export class WorkersAiWriter implements AiWriter {
  constructor(private ai: Ai) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildBlogPrompt(input);
    const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }) as { response?: string };

    if (!response.response) throw new Error('Workers AI returned empty response');
    return parseDraftResponse(response.response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }) as { response?: string };

    if (!response.response) throw new Error('Workers AI returned empty response');
    return parseDraftResponse(response.response);
  }
}

export class ClaudeAiWriter implements AiWriter {
  constructor(private apiKey: string, private fetchFn: typeof fetch = fetch) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildBlogPrompt(input);
    const response = await this.callClaude(prompt);
    return parseDraftResponse(response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.callClaude(prompt);
    return parseDraftResponse(response);
  }

  private async callClaude(prompt: string): Promise<string> {
    const res = await this.fetchFn('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }> };
    return data.content[0].text;
  }
}

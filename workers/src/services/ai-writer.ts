import type { BlogDraftOutput, BlogDraftInput, AiProvider } from './ai-prompts';
import { buildWorkersAiPrompt, buildClaudePrompt, buildOpenAiPrompt, buildGeminiPrompt, buildEditPrompt } from './ai-prompts';

export interface AiWriter {
  generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput>;
  editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput>;
}

export function parseDraftResponse(raw: string): BlogDraftOutput {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // LLMs put literal control characters inside JSON string values.
  // Try parsing first; if it fails, aggressively clean control chars.
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Escape control chars inside quoted strings only.
    // Use [\s\S] instead of . to match newlines within strings.
    cleaned = cleaned.replace(/"(?:[^"\\]|\\[\s\S])*"/g, (match) => {
      return match
        .replace(/[\x00-\x1F]/g, (ch) => {
          if (ch === '\n') return '\\n';
          if (ch === '\r') return '\\r';
          if (ch === '\t') return '\\t';
          return '';
        });
    });

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Last resort: strip ALL control chars except structural whitespace
      // between JSON tokens, then parse
      const lastResort = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      parsed = JSON.parse(lastResort);
    }
  }

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

// ============================================================
// Workers AI (Llama 3.1 8b) — FREE
// ============================================================
export class WorkersAiWriter implements AiWriter {
  constructor(private ai: Ai) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildWorkersAiPrompt(input);
    const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
    }) as { response?: string };

    if (!response.response) throw new Error('Workers AI returned empty response');
    return parseDraftResponse(response.response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
    }) as { response?: string };

    if (!response.response) throw new Error('Workers AI returned empty response');
    return parseDraftResponse(response.response);
  }
}

// ============================================================
// Claude (Anthropic) — PREMIUM
// ============================================================
export class ClaudeAiWriter implements AiWriter {
  constructor(
    private apiKey: string,
    private model: string = 'claude-sonnet-4-6',
    private fetchFn: typeof fetch = fetch,
  ) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildClaudePrompt(input);
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
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Claude API error ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json() as { content: Array<{ text: string }> };
    return data.content[0].text;
  }
}

// ============================================================
// OpenAI (GPT-4o / 4o-mini) — MID-TIER
// ============================================================
export class OpenAiWriter implements AiWriter {
  constructor(
    private apiKey: string,
    private model: string = 'gpt-4o-mini',
    private fetchFn: typeof fetch = fetch,
  ) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const { system, user } = buildOpenAiPrompt(input);
    const response = await this.callOpenAi(system, user);
    return parseDraftResponse(response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.callOpenAi('You edit blog posts. Return valid JSON only.', prompt);
    return parseDraftResponse(response);
  }

  private async callOpenAi(system: string, user: string): Promise<string> {
    const res = await this.fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 4096,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
  }
}

// ============================================================
// Gemini (Google) — FREE-TO-MID
// ============================================================
export class GeminiAiWriter implements AiWriter {
  constructor(
    private apiKey: string,
    private model: string = 'gemini-2.0-flash',
    private fetchFn: typeof fetch = fetch,
  ) {}

  async generateDraft(input: BlogDraftInput): Promise<BlogDraftOutput> {
    const prompt = buildGeminiPrompt(input);
    const response = await this.callGemini(prompt);
    return parseDraftResponse(response);
  }

  async editDraft(existingContent: string, editInstruction: string): Promise<BlogDraftOutput> {
    const prompt = buildEditPrompt(existingContent, editInstruction);
    const response = await this.callGemini(prompt);
    return parseDraftResponse(response);
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 4096,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    return data.candidates[0].content.parts[0].text;
  }
}

// ============================================================
// Factory — create the right writer for a provider + API key
// ============================================================
export function createAiWriter(
  provider: AiProvider,
  config: { ai?: Ai; apiKey?: string; model?: string }
): AiWriter {
  switch (provider) {
    case 'workers-ai':
      if (!config.ai) throw new Error('Workers AI binding required');
      return new WorkersAiWriter(config.ai);
    case 'claude':
      if (!config.apiKey) throw new Error('Claude API key required');
      return new ClaudeAiWriter(config.apiKey, config.model);
    case 'openai':
      if (!config.apiKey) throw new Error('OpenAI API key required');
      return new OpenAiWriter(config.apiKey, config.model);
    case 'gemini':
      if (!config.apiKey) throw new Error('Gemini API key required');
      return new GeminiAiWriter(config.apiKey, config.model);
    default:
      if (!config.ai) throw new Error('Workers AI binding required');
      return new WorkersAiWriter(config.ai);
  }
}

export interface CtaConfig {
  defaultCta: CtaOption;
  serviceOverrides?: Array<{
    serviceKeywords: string[];
    cta: CtaOption;
  }>;
  displayMode: 'single' | 'multiple' | 'cycle';
}

export interface CtaOption {
  type: 'phone' | 'sms' | 'whatsapp' | 'booking' | 'email';
  value: string;
  label?: string;
}

export interface BlogDraftInput {
  businessName: string;
  serviceArea: string;
  caption: string;
  hasPhoto: boolean;
  phone?: string;
  yearsExperience?: number;
  registrationNumber?: string;
  nearbyAreas?: string[];
  ctaConfig?: CtaConfig;
  currentMonth?: string;
  existingPostSlugs?: string[];
}

export interface BlogDraftOutput {
  title: string;
  slug: string;
  content: string;
  description: string;
  tags: string[];
  image_alt_text: string | null;
}

export type AiProvider = 'workers-ai' | 'claude' | 'openai' | 'gemini';

function buildCtaText(input: BlogDraftInput): string {
  const phone = input.phone || '[phone]';
  if (!input.ctaConfig) return `Contact method: phone ${phone}`;

  const c = input.ctaConfig;
  let text = `Default CTA: ${c.defaultCta.type} — ${c.defaultCta.value}`;
  if (c.defaultCta.label) text += ` ("${c.defaultCta.label}")`;

  if (c.serviceOverrides?.length) {
    text += '\nService overrides:';
    for (const o of c.serviceOverrides) {
      text += `\n- ${o.serviceKeywords.join('/')}: ${o.cta.type} — ${o.cta.value}`;
      if (o.cta.label) text += ` ("${o.cta.label}")`;
    }
  }
  return text;
}

// ============================================================
// WORKERS AI (Llama 3.1 8b) — SHORT prompt, ~1500 tokens
// Small context window, copies examples verbatim, needs brevity
// ============================================================
export function buildWorkersAiPrompt(input: BlogDraftInput): string {
  const phone = input.phone || '';
  const ctaText = buildCtaText(input);

  return `Write a blog post as a UK gas engineer. First person ("I"). British English. Trade shorthand (combi, rads, TRVs, flue).

Business: ${input.businessName}, ${input.serviceArea}${phone ? `. Phone: ${phone}` : ''}${input.registrationNumber ? `. Gas Safe: ${input.registrationNumber}` : ''}

RULES:
- NO customer names, NO addresses (town only), NO prices
- NO generic "lasts 5-10 years" — explain WHY things fail
- Admit when work ISN'T needed — honesty builds trust
- Be specific: name the model, fault, part replaced
- Short paragraphs (2-3 sentences max)
- NEVER invent details not in the job description below. No appliance ages, job timings, or technical consequences unless stated. If you do not know something, do not mention it.
- No em dashes. Use commas, hyphens, or full stops instead.

${ctaText}

STRUCTURE:
## [Title with town and service — under 60 chars]
Opening: what the problem was, where (town only). Include phone if set.
## What I Found
Diagnosis, root cause, what I checked.
## What I Did
The fix, why this approach, what I chose NOT to do.
## What to Look For
Advice for homeowners, warning signs, when to call an engineer.
## FAQ
3 questions real customers ask, with expert answers (2-3 sentences each). One mentioning the town.
Closing: contact details, what to expect when they call.

Respond with ONLY valid JSON:
{"title":"under 60 chars with town","slug":"url-friendly","content":"500-700 words markdown with ## headings","description":"120-155 char meta description with service+location","tags":["service","location"],"image_alt_text":${input.hasPhoto ? '"80-120 chars describing the photo with service and town"' : 'null'}}

JOB DETAILS: ${input.caption}`;
}

// ============================================================
// CLAUDE — FULL prompt, all expert recommendations
// Large context, follows instructions precisely
// ============================================================
export function buildClaudePrompt(input: BlogDraftInput): string {
  const phone = input.phone || '';
  const years = input.yearsExperience || 15;
  const nearbyAreas = input.nearbyAreas?.slice(0, 3).join(', ') || '';
  const ctaText = buildCtaText(input);
  const month = input.currentMonth || '';

  const existingPosts = input.existingPostSlugs?.length
    ? `\nEXISTING POSTS (avoid duplicating):\n${input.existingPostSlugs.map(s => `- ${s}`).join('\n')}`
    : '';

  return `You are writing a blog post as ${input.businessName}, a gas/heating engineer in ${input.serviceArea}. ${years} years' experience.${input.registrationNumber ? ` Gas Safe: ${input.registrationNumber}.` : ''}

VOICE:
First person ("I"). You're talking to a neighbour, not writing marketing copy. Trade shorthand is natural (combi, rads, TRVs, flue, megaflow, PRV, condensate trap). Short direct sentences, 15-18 words average. One idea per paragraph, max 3 sentences per paragraph.

The pub test: if a tradesperson would cringe reading any sentence to a mate, rewrite it. No corporate speak, no self-congratulation. British understatement and dry humour are welcome.

Never use: "It's important to note", "In today's world", "comprehensive solution", "bespoke", "don't hesitate to contact", "we pride ourselves", "state-of-the-art", "cutting-edge", "navigate", "leverage", "delve", "elevate", "myriad", "seamless", "journey" (unless travel), "ensure" (use "make sure"), "utilise" (use "use"), lists of three adjectives, rhetorical transition questions, self-answering questions at the end.

UK English: British spelling, Gas Safe registered (not licensed), £ not $, rads not radiators, tap not faucet, combi not combination boiler. Reference UK regs where relevant (Building Regs Part L/J, Gas Safety Regs).

TRUST:
- 60% competence / 40% warmth. Open with empathy, then demonstrate expertise.
- Strategic honesty: admit when a service ISN'T needed. "Not every system needs a powerflush" is more persuasive than always recommending one.
- Calibrated confidence: "in my experience" and "nine times out of ten" for judgment calls. Confident for facts/regulations.
- Embed credentials naturally: "Under Gas Safe regs, any engineer working on gas must be registered" is better than "We are Gas Safe registered."
- Set standards that differentiate without attacking competitors: "A proper service should take 45-60 minutes."

TECHNICAL ACCURACY:
- Never give bare "lasts X years" claims. Explain the factors (water quality, maintenance, system design).
- Explain WHY things fail. Root causes = expertise.
- Include at least one insight only a working engineer would know.
- NEVER INVENT DETAILS not provided in the job description. No appliance ages, job timings, property descriptions, or technical consequences unless the user stated them. If you don't know something, leave it out entirely. Write around what you DO know.
- If a fault could have ANY safety implication (carbon monoxide, gas leaks, electrical risk, water damage to electrics), flag it as a safety concern. Err on the side of caution.
- No em dashes. Use commas, hyphens, or full stops instead.

${ctaText}

Place CTAs naturally: one soft mention after the opening, one contextual mid-article (bold or blockquote), one in the closing with what-happens-next.

STRUCTURE:
1. Title: under 60 chars, location + service + doing word (fixed/solved/replaced/upgraded)
2. Opening (2-3 sentences): Start with the problem or something specific — NOT a generic summary. End with soft CTA.
3. ## What I Found: diagnostic walkthrough, what was checked, the actual cause. Use property type for colour ("a 1970s semi", "tight cupboard").
4. ## What I Did: the fix, why this approach, what you chose NOT to do. Address one objection naturally (cost/disruption/necessity). Mid-article CTA.
5. ## What to Look For: preventative advice, warning signs. Bullet points. Be generous — give away useful knowledge.
6. ## FAQ: exactly 3 questions phrased as real customers ask. One with location. Direct answer first, then expert context, 2-4 sentences each.
7. Closing: CTA with contact details, what happens when they call, nearby areas covered.${nearbyAreas ? ` Mention: ${nearbyAreas}.` : ''}

Ethical urgency (use ONE if genuinely applicable): safety risk, seasonal timing, cost-of-delay, warranty implications. Never fabricate urgency.
${month ? `Current month: ${month}. Reference the season naturally where relevant.` : ''}
${existingPosts}

OUTPUT — valid JSON only, no fences:
{"title":"string under 60 chars","slug":"url-friendly","content":"800-1200 words markdown","description":"120-155 char meta with service+location+trust signal","tags":["array"],"image_alt_text":${input.hasPhoto ? '"80-120 chars, describe what\'s shown with service+town, never start with image of/photo of"' : 'null'}}

JOB: ${input.caption}`;
}

// ============================================================
// OPENAI (GPT-4o / 4o-mini) — system + user message pattern
// ============================================================
export function buildOpenAiPrompt(input: BlogDraftInput): { system: string; user: string } {
  const phone = input.phone || '';
  const years = input.yearsExperience || 15;
  const ctaText = buildCtaText(input);
  const nearbyAreas = input.nearbyAreas?.slice(0, 3).join(', ') || '';

  const system = `You are a blog writer for a UK gas/heating engineer. Write in first person ("I"), British English, with trade shorthand. Short paragraphs (2-3 sentences). The pub test: nothing a tradesperson would cringe at.

Never use AI-sounding phrases: "It's important to note", "comprehensive solution", "don't hesitate", "we pride ourselves", "navigate", "leverage", "delve", "elevate", "seamless".

Rules: NO customer names, NO addresses (town only), NO prices. Be technically accurate — explain WHY things fail, never give generic "lasts X years". Admit when work isn't needed. Embed credentials naturally, not as announcements. NEVER invent details not in the job description — no ages, timings, or consequences unless stated. No em dashes. If a fault has safety implications, flag it.

${ctaText}

Place 3 CTAs: soft opening, contextual mid-article, closing with what-happens-next.${nearbyAreas ? ` Nearby areas: ${nearbyAreas}.` : ''}

Respond with ONLY valid JSON: {"title":"under 60 chars with town","slug":"url-friendly","content":"800-1200 words markdown with ## headings","description":"120-155 char meta","tags":["array"],"image_alt_text":"80-120 chars or null"}`;

  const user = `Write a blog post for ${input.businessName}, ${input.serviceArea}. ${years} years' experience.${input.registrationNumber ? ` Gas Safe: ${input.registrationNumber}.` : ''}${phone ? ` Phone: ${phone}.` : ''}

Structure: Opening hook (the problem) → ## What I Found → ## What I Did → ## What to Look For → ## FAQ (3 questions) → Closing CTA.

${input.currentMonth ? `Month: ${input.currentMonth}.` : ''}

Job details: ${input.caption}`;

  return { system, user };
}

// ============================================================
// GEMINI — similar to Claude but tuned for Gemini's style
// ============================================================
export function buildGeminiPrompt(input: BlogDraftInput): string {
  // Gemini handles long prompts well but tends toward verbosity
  // Use the Claude prompt as base with minor adjustments
  const claudePrompt = buildClaudePrompt(input);
  return claudePrompt + '\n\nIMPORTANT: Be concise. Do not over-explain. Every sentence must earn its place.';
}

// ============================================================
// EDIT PROMPTS — per provider
// ============================================================
export function buildEditPrompt(existingContent: string, editInstruction: string): string {
  return `Edit this blog post. Apply the change, keep the same first-person tradesperson voice, British English, trade shorthand. Return the COMPLETE updated post.

CURRENT POST:
${existingContent}

CHANGE: "${editInstruction}"

Return ONLY valid JSON: {"title":"","slug":"","content":"","description":"","tags":[],"image_alt_text":""}`;
}

// ============================================================
// FACTORY — get the right prompt for the provider
// ============================================================
export function buildPromptForProvider(provider: AiProvider, input: BlogDraftInput): string {
  switch (provider) {
    case 'workers-ai':
      return buildWorkersAiPrompt(input);
    case 'claude':
      return buildClaudePrompt(input);
    case 'openai':
      // For OpenAI, concatenate system+user (the writer class handles the split)
      const { system, user } = buildOpenAiPrompt(input);
      return `${system}\n\n${user}`;
    case 'gemini':
      return buildGeminiPrompt(input);
    default:
      return buildWorkersAiPrompt(input);
  }
}

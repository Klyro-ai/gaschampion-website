export interface BlogDraftInput {
  businessName: string;
  serviceArea: string;
  caption: string;
  hasPhoto: boolean;
}

export interface BlogDraftOutput {
  title: string;
  slug: string;
  content: string;
  description: string;
  tags: string[];
  image_alt_text: string | null;
}

export function buildBlogPrompt(input: BlogDraftInput): string {
  return `You are a professional content writer for "${input.businessName}", a gas and heating engineer based in ${input.serviceArea}.

CONTENT STRATEGY — "They Ask, You Answer":
Write educational, transparent content that builds trust. Address common customer questions about this type of work. Be the most helpful, honest source of information.

LOCAL SEO REQUIREMENTS:
- Include the town/village and county in the title and naturally throughout the content
- Use service-specific keywords in headings
- Include an FAQ section with 2-3 common customer questions when relevant

TONE:
Professional but approachable. Written as a knowledgeable local tradesperson who genuinely wants to help.

HARD RULES — NEVER BREAK THESE:
- NO customer names — never mention who the work was done for
- NO addresses — never include house numbers, street names, or property-identifiable details
- Location to TOWN/VILLAGE level only (e.g. "Clare, Suffolk" not "23 High Street")
- NO specific prices — say "contact us for a quote" instead
- GDPR compliant — no personal data about customers

STRUCTURE:
1. Engaging title with location and service type (under 70 characters)
2. Opening paragraph — what was done and where (town level only)
3. Detail section — the work, why it matters, educational context
4. FAQ section (2-3 questions customers commonly ask about this service)
5. Call to action — "Contact ${input.businessName} for..."

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences:
{
  "title": "string — under 70 chars, includes location",
  "slug": "string — URL-friendly lowercase with hyphens",
  "content": "string — 500-800 words markdown with ## headings",
  "description": "string — meta description under 160 chars",
  "tags": ["string array — service type, location, brand"],
  "image_alt_text": ${input.hasPhoto ? '"string — descriptive alt text for the photo"' : 'null'}
}

USER INPUT: "${input.caption}"`;
}

export function buildEditPrompt(existingContent: string, editInstruction: string): string {
  return `You are editing a blog post. Apply the following change and return the COMPLETE updated post in the same JSON format.

CURRENT POST:
${existingContent}

REQUESTED CHANGE: "${editInstruction}"

Apply the change. Keep all the same rules (no customer names, no addresses, local SEO, etc). Return ONLY valid JSON with the same fields: title, slug, content, description, tags, image_alt_text.`;
}

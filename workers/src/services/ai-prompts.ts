export interface CtaConfig {
  defaultCta: CtaOption;
  serviceOverrides?: Array<{
    serviceKeywords: string[];  // e.g. ["boiler installation", "boiler replacement", "new boiler"]
    cta: CtaOption;
  }>;
  displayMode: 'single' | 'multiple' | 'cycle';
}

export interface CtaOption {
  type: 'phone' | 'sms' | 'whatsapp' | 'booking' | 'email';
  value: string;  // phone number, URL, or email address
  label?: string;  // custom label e.g. "Send us photos for a quote"
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

function buildCtaInstructions(input: BlogDraftInput): string {
  if (!input.ctaConfig) {
    // Fallback: simple phone CTA
    const phone = input.phone || '[phone number]';
    return `
CTA DETAILS:
Use this contact method in all 3 CTAs: Phone call — ${phone}
Opening CTA example: "If you're dealing with something similar in ${input.serviceArea}, give me a call on ${phone} — happy to take a look."
Mid-article CTA example: "> **Not sure what's going on with your [component]? Call me on ${phone} and I'll talk you through it.**"
Closing CTA: Include ${phone}, mention what happens next ("I'll have a chat, no hard sell, and if it sounds like something I can help with we'll book a time that works").`;
  }

  const cta = input.ctaConfig;
  const overridesText = cta.serviceOverrides?.map(o =>
    `- If the post is about ${o.serviceKeywords.join(' or ')}: use ${o.cta.type} — ${o.cta.value}${o.cta.label ? ` ("${o.cta.label}")` : ''}`
  ).join('\n') || '';

  const defaultText = `Default CTA: ${cta.defaultCta.type} — ${cta.defaultCta.value}${cta.defaultCta.label ? ` ("${cta.defaultCta.label}")` : ''}`;

  return `
CTA DETAILS:
${defaultText}
${overridesText ? `\nSERVICE-SPECIFIC OVERRIDES:\n${overridesText}` : ''}

Match the CTA to the service type of this post. If a service override matches, use that CTA. Otherwise use the default.

Format CTAs naturally based on type:
- phone: "Give me a call on [number]"
- sms: "Drop me a text on [number] with [details]"
- whatsapp: "Send me a WhatsApp on [number] with [details]"
- booking: "Book online at [url]"
- email: "Email me at [address]"

${cta.displayMode === 'multiple' ? 'Show ALL configured CTAs (default + any matching override) in the closing CTA.' : 'Use only the single most relevant CTA per placement.'}`;
}

export function buildBlogPrompt(input: BlogDraftInput): string {
  const phone = input.phone || '[phone number]';
  const years = input.yearsExperience || 15;
  const regNum = input.registrationNumber || '';
  const nearbyAreas = input.nearbyAreas?.slice(0, 3).join(', ') || '';
  const month = input.currentMonth || '';

  const existingPostsContext = input.existingPostSlugs?.length
    ? `\nEXISTING POSTS (do NOT duplicate these topics or target the same keyword+location):\n${input.existingPostSlugs.map(s => `- ${s}`).join('\n')}\nIf this post would cover the same ground, take a different angle or focus on a different aspect.`
    : '';

  const seasonalContext = month
    ? `\nCURRENT MONTH: ${month}. Reference the season naturally where relevant.`
    : '';

  const ctaInstructions = buildCtaInstructions(input);

  return `You are writing a blog post for "${input.businessName}", based in ${input.serviceArea}. You have ${years} years' experience.${regNum ? ` Gas Safe registered: ${regNum}.` : ''}

VOICE — THIS IS CRITICAL:
Write as a tradesperson talking to a neighbour — not as a marketing department. First person ("I") throughout. You're the person who did the work, talking about what you found and what you did.

Use trade shorthand naturally: combi, rads, TRVs, the flue, system boiler, megaflow, unvented, vented, filling loop, PRV, expansion vessel, condensate trap. Never over-explain trade terms — use them confidently.

Short, direct sentences. Average 15-18 words. One idea per paragraph. No paragraph longer than 3 sentences. Front-load every paragraph — key point first.

The pub test: if you'd cringe reading any sentence to a mate, rewrite it. No corporate speak, no self-congratulation, no false enthusiasm. British understatement and dry humour are fine. Bluntness is fine.

BANNED PHRASES — never use any of these:
"In today's world", "It's important to note", "It's worth noting", "Whether you're a", "In conclusion", "To sum up", "Look no further", "Don't hesitate to contact", "Our team of experts", "Our skilled professionals", "We pride ourselves on", "comprehensive solution", "bespoke solution", "tailored solution", "peace of mind" (unless very sparingly), "state-of-the-art", "cutting-edge", "At ${input.businessName} we believe", "navigate", "ensure" (use "make sure"), "utilise" (use "use"), "facilitate", "leverage", "crucial", "vital" (overused), "landscape", "realm", "delve", "elevate", "myriad", "seamless", "seamlessly", "journey" (unless physical travel), "amazing", "incredible", "game-changer"

Also avoid: lists of three adjectives ("efficient, reliable, and professional"), rhetorical questions as transitions, exclamation marks (one per post maximum), starting 3+ sentences with "This", ending with self-answering questions.

UK ENGLISH:
British spelling throughout (colour, centre, neighbours). UK terminology: boiler not furnace, tap not faucet, garden not yard, ground floor not first floor, flat not apartment, cupboard not closet, worktop not countertop. Gas Safe registered, not licensed. Prices in £. Mix metric and imperial naturally (the way British people actually talk).

TRUST & EXPERTISE:
- COMPETENCE-WARMTH BALANCE: 60% competence (technical detail, root causes, standards) / 40% warmth (acknowledge the homeowner's situation, explain patiently, show you care about their outcome not just the sale).
- STRATEGIC HONESTY: If a service isn't always necessary, say so. "Not every system needs a powerflush" is MORE persuasive than always recommending one. Recommend AGAINST unnecessary work — this is the strongest trust signal in home services.
- CALIBRATED CONFIDENCE: Use confident language for facts/regulations. Use "in my experience" or "nine times out of ten" for professional judgment. Use "it depends on" for genuinely variable outcomes. Never promise absolutes.
- EMPATHY MARKERS: Include at least one acknowledgement of the homeowner's situation early in the post. "No hot water in January — not ideal" before technical detail.
- CREDENTIALS — EMBED, DON'T ANNOUNCE: Never list credentials as standalone claims. Weave them into educational context: "Under Gas Safe regulations, any engineer working on your gas appliances must be registered — you can check at GasSafeRegister.co.uk" is better than "We are Gas Safe registered."
- TRUST REPAIR: Many readers have been burned by a previous tradesperson. Address this indirectly by explaining what GOOD practice looks like and giving them questions to ask ANY engineer, including you.
- DIFFERENTIATION: Never criticise competitors. Instead, set standards that implicitly differentiate: "A proper boiler service should take 45-60 minutes. If it's done in 15, key checks may have been skipped."

TECHNICAL ACCURACY — CRITICAL:
- NEVER give generic "replace every X years" advice. Component longevity depends on installation quality, water quality, and maintenance.
- Always explain the FACTORS that affect lifespan, not a bare number.
- Emphasise preventative maintenance extending life — often indefinitely.
- Always explain WHY something fails, not just WHEN. Root causes demonstrate expertise.
- Include at least one insight only a working engineer would know.
- Reference current UK regulations where relevant (Building Regs Part L/J, Gas Safety Regs 1998, BS 7671).

HARD RULES — NEVER BREAK:
- NO customer names
- NO addresses — town/village level only
- NO specific prices — "get in touch for a quote"
- GDPR compliant
- NO generic lifespan claims without explaining factors

STRUCTURE — NARRATIVE ARC:
1. TITLE: Under 60 characters. Location + service type + a doing word (fixed, solved, replaced, upgraded, restored). NOT a generic headline.
2. THE SITUATION (opening, 2-3 sentences): Start with the problem or something specific about the job — NOT a generic summary. Use a hook:
   - Problem hook: "No hot water and it's February — not ideal."
   - Detail hook: "When I pulled the old boiler off the wall, the flue was held on with gaffer tape."
   - Seasonal hook: "Every autumn I see a spike in boiler breakdowns — this one was a textbook case."
   End with CTA #1 (soft, establishing availability).
3. WHAT I FOUND (2-3 paragraphs): Walk through the diagnostic thinking. What was checked, what was ruled out, what the actual cause was. Use "what I found was..." to create a mini-revelation. Use property type for colour ("a 1970s semi", "a cottage with low ceilings").
4. WHAT I DID (2-3 paragraphs): What was done and WHY this approach over alternatives. Mention what you chose NOT to do: "Could've replaced the whole valve assembly but the diaphragm was the only failed part — no point spending money that doesn't need spending." Include CTA #2 (contextual, mid-article). Address one objection naturally (cost, disruption, necessity, or trust).
5. WHAT TO LOOK FOR (2-3 paragraphs): Zoom out. Preventative advice, warning signs, when to call an engineer vs what they can check themselves. Be generous with knowledge — giving away useful info is the strongest trust signal. Use bullet points for signs/symptoms.
6. FAQ (exactly 3 questions): Phrased as a real customer would ask. One with the location name. Answers: 2-4 sentences, direct answer first then expert context.
7. CLOSING (2-3 sentences): CTA #3 with contact details and "what happens next" — what the homeowner can expect when they get in touch. Mention 2-3 nearby areas served.${nearbyAreas ? ` Areas to mention: ${nearbyAreas}.` : ''}

ETHICAL URGENCY — use ONE where genuinely applicable:
- Safety: "A faulty flue can allow carbon monoxide into your home — this isn't something to put off."
- Seasonal: "I'd recommend getting this sorted before October — once the cold hits, my diary fills up fast."
- Cost-of-delay: "Catching this early saved a much bigger repair bill down the line."
- Warranty: "Skipping the annual service can void your manufacturer's warranty."
Never fabricate urgency. Let genuine consequences speak.

${ctaInstructions}
${existingPostsContext}
${seasonalContext}

SPECIFICITY:
Always prefer specific detail over generic statements. Name the model, the pipe size, the chemical, the fault code where possible.
BAD: "We installed a new boiler to a high standard."
GOOD: "Fitted a Worcester 30i combi with 22mm copper feeds, TRVs on every rad, and flushed the system with Sentinel X400 before filling."

LOCAL SEO:
- Primary location in title and opening paragraph
- Service-specific keywords in at least 2 headings
- Question-format headings where natural (matches voice search)
- Use ### (H3) for subsections within main ## (H2) sections

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown fences:
{
  "title": "string — under 60 chars, includes location and a doing word",
  "slug": "string — URL-friendly lowercase with hyphens",
  "content": "string — 800-1200 words markdown with ## and ### headings",
  "description": "string — meta description, 120-155 chars, includes service type + location + trust signal. Example: 'Expert boiler repair in Haverhill, Suffolk. Gas Safe registered, honest pricing. Call today.'",
  "tags": ["string array — service type, location, brand if relevant"],
  "image_alt_text": ${input.hasPhoto ? '"string — 80-120 chars, describe what\'s shown including service type and town. Never start with image of or photo of. Example: New Worcester combi boiler installed in a kitchen in Clare, Suffolk"' : 'null'}
}

USER INPUT: "${input.caption}"`;
}

export function buildEditPrompt(existingContent: string, editInstruction: string): string {
  return `You are editing a blog post. Apply the following change and return the COMPLETE updated post in the same JSON format.

Keep the same voice (first person, tradesperson talking naturally), same banned phrases rules, same technical accuracy standards. British English throughout.

CURRENT POST:
${existingContent}

REQUESTED CHANGE: "${editInstruction}"

Return ONLY valid JSON with the same fields: title, slug, content, description, tags, image_alt_text.`;
}

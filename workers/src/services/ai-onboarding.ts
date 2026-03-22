import type { SiteConfig } from '../types';
import type { AiWriter } from './ai-writer';
import { getTradeType } from '../data/trade-catalog';

export interface OnboardingInput {
  businessName: string;
  ownerName: string;
  tradeType: string;
  town: string;
  county: string;
  phone: string;
  email: string;
  address?: { street: string; town: string; county: string; postcode: string };
  yearsExperience?: number;
  registrationNumber?: string;
  serviceAreas?: string[];
  googleRating?: number;
  googleReviewCount?: number;
  googleReviews?: Array<{ text: string; rating: number; authorName: string }>;
  googleDescription?: string;
}

// ============================================================
// AI helper — uses Gemini Flash (free, high quality) with Workers AI fallback
// ============================================================
async function generateJson<T>(ai: Ai, prompt: string, googleApiKey?: string): Promise<T | null> {
  // Try Gemini Flash first (free tier, much better than Llama for structured output)
  const geminiKey = googleApiKey || '';
  if (geminiKey) {
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2000 },
        }),
      }
    );
    if (geminiRes.ok) {
      const data = await geminiRes.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleaned) as T;
      }
    }
  } catch (err) {
    console.error('Gemini generateJson failed, falling back to Workers AI:', err);
  }
  } // end if (geminiKey)

  // Fallback to Workers AI (Llama 3.1 8b)
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    }) as { response?: string };

    if (!response.response) return null;

    let cleaned = response.response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Workers AI generateJson failed:', err);
    return null;
  }
}

// ============================================================
// Generate unique service descriptions
// ============================================================
async function generateUniqueServices(googleApiKey: string | undefined, 
  ai: Ai,
  businessName: string,
  tradeName: string,
  town: string,
  services: Array<{ id: string; name: string; shortDesc: string; icon: string; features: string[] }>,
): Promise<Array<{ id: string; description: string }> | null> {
  const prompt = `Write unique, short service descriptions for ${businessName}, a ${tradeName.toLowerCase()} in ${town}.
For each service, write a 1-2 sentence description from a first-person perspective ("I" not "we").
Services: ${services.map(s => s.name).join(', ')}

Return ONLY valid JSON array with no extra text: [{"id":"${services[0].id}","description":"..."},...]
Use these exact IDs: ${services.map(s => `"${s.id}"`).join(', ')}
Keep it authentic, like a real tradesperson wrote it. No marketing speak.`;

  return generateJson(ai, prompt, googleApiKey) as any; //Array<{ id: string; description: string }>>(ai, prompt);
}

// ============================================================
// Generate unique about page content
// ============================================================
async function generateAboutContent(googleApiKey: string | undefined, 
  ai: Ai,
  businessName: string,
  ownerName: string,
  tradeName: string,
  town: string,
  county: string,
  yearsExperience?: number,
): Promise<{ description: string; ownerBackground: string } | null> {
  const ownerInfo = ownerName && ownerName !== '' ? `Owner: ${ownerName}.` : 'Do NOT mention an owner name — the owner has not provided their name.';
  const expInfo = yearsExperience && yearsExperience > 0 ? `${yearsExperience} years experience.` : 'Do NOT mention years of experience — this was not provided.';

  const prompt = `Write a brief about page intro for ${businessName}, a ${tradeName.toLowerCase()} in ${town}${county ? ', ' + county : ''}.
${ownerInfo} ${expInfo}

IMPORTANT: Only mention facts that are provided above. Do NOT invent an owner name, years of experience, or any other details that were not given. If information is missing, write around it — focus on the business's approach, values, and service to the local area.

Return ONLY valid JSON with no extra text:
{"description":"3-4 sentence business description, first person, authentic, no marketing fluff","ownerBackground":"2-3 sentences about the business approach and values"}

Mention ${town} naturally. Write authentically, not like marketing copy.`;

  return generateJson(ai, prompt, googleApiKey) as any; //{ description: string; ownerBackground: string }>(ai, prompt);
}

// ============================================================
// Generate unique FAQs
// ============================================================
async function generateUniqueFaqs(googleApiKey: string | undefined, 
  ai: Ai,
  businessName: string,
  tradeName: string,
  town: string,
): Promise<Array<{ question: string; answer: string }> | null> {
  const prompt = `Write 5 FAQs for ${businessName}, a ${tradeName.toLowerCase()} in ${town}.
Questions should be what local customers actually ask. Include the town name "${town}" in at least one question.
Keep answers concise (1-2 sentences each). First person ("I" not "we").

Return ONLY valid JSON array with no extra text: [{"question":"...","answer":"..."},...]`;

  return generateJson(ai, prompt, googleApiKey) as any; //Array<{ question: string; answer: string }>>(ai, prompt);
}

// ============================================================
// Select layout variant based on business profile
// ============================================================
interface LayoutConfig {
  hero: string;
  services: string;
  about: string;
}

async function selectLayout(
  googleApiKey: string | undefined,
  ai: Ai,
  businessName: string,
  tradeName: string,
  reviewCount: number,
  yearsExperience: number,
): Promise<LayoutConfig | null> {
  const prompt = `Select a website layout for ${businessName}, a ${tradeName}.
They have ${reviewCount} reviews and ${yearsExperience || 'unknown'} years experience.

Choose one option for each section:
- hero: "split" (image + text side by side), "centered" (full-width centered text), or "minimal" (small clean header)
- services: "grid" (card grid), "list" (horizontal rows), or "cards" (large feature cards)
- about: "story" (narrative), "stats" (numbers-first), or "simple" (brief text only)

Rules:
- If they have lots of reviews (50+), use "stats" for about
- If they have few reviews (<10), use "simple" for about
- Vary the choices — don't always pick the same combination
- "minimal" hero works best for premium/professional businesses
- "centered" hero works best for emergency/urgent services
- Mix and match — avoid always using the same combo

Return ONLY valid JSON: {"hero":"...","services":"...","about":"..."}`;

  return generateJson<LayoutConfig>(ai, prompt, googleApiKey);
}

// ============================================================
// Generate unique tagline and subtitle
// ============================================================
async function generateTagline(googleApiKey: string | undefined, 
  ai: Ai,
  businessName: string,
  tradeName: string,
  town: string,
  registrationBody?: string,
): Promise<{ tagline: string; subtitle: string } | null> {
  const prompt = `Write a short tagline and subtitle for ${businessName}, a ${tradeName.toLowerCase()} in ${town}.
${registrationBody ? registrationBody + ' registered.' : ''}

The tagline should be punchy (under 8 words), mention the area or trade naturally.
The subtitle should be one line that builds trust (mention registration, location, or experience).

Return ONLY valid JSON with no extra text: {"tagline":"...","subtitle":"..."}
No generic marketing phrases like "your trusted partner". Write like a real person.`;

  return generateJson(ai, prompt, googleApiKey) as any; //{ tagline: string; subtitle: string }>(ai, prompt);
}

// ============================================================
// Main entry point
// ============================================================
export async function generateSiteConfig(
  input: OnboardingInput,
  aiWriter: AiWriter,
  ai?: Ai,
  googleApiKey?: string,
): Promise<SiteConfig> {
  const trade = getTradeType(input.tradeType);
  if (!trade) throw new Error(`Unknown trade type: ${input.tradeType}`);

  const tradeName = trade.name;
  const town = input.town;
  const county = input.county;

  // -- Default values (used as fallbacks) --
  let tagline = `Expert ${tradeName} Services`;
  let subtitle = `${trade.registrationBody ? trade.registrationBody + ' Registered ' : ''}${tradeName} in ${town}${county ? ', ' + county : ''}`;
  let description = `${input.businessName} provides expert ${tradeName.toLowerCase()} services across ${town}${county ? ', ' + county : ''} and surrounding areas.${input.yearsExperience ? ` ${input.yearsExperience}+ years of experience.` : ''}`;
  let ownerBackground = input.yearsExperience ? `${input.yearsExperience} years experience as a ${tradeName.toLowerCase()}` : '';
  let faqs = trade.sampleFaqs;
  let serviceDescriptions: Record<string, string> = {};

  // -- AI generation (all calls are independent, run in parallel) --
  if (ai) {
    console.log(`[ai-onboarding] Generating unique content for ${input.businessName} in ${town}`);

    const [taglineResult, aboutResult, faqResult, serviceResult, layoutResult] = await Promise.all([
      generateTagline(googleApiKey, ai, input.businessName, tradeName, town, trade.registrationBody).catch(() => null),
      generateAboutContent(googleApiKey, ai, input.businessName, input.ownerName, tradeName, town, county, input.yearsExperience).catch(() => null),
      generateUniqueFaqs(googleApiKey, ai, input.businessName, tradeName, town).catch(() => null),
      generateUniqueServices(googleApiKey, ai, input.businessName, tradeName, town, trade.defaultServices).catch(() => null),
      selectLayout(googleApiKey, ai, input.businessName, tradeName, input.googleReviewCount || 0, input.yearsExperience || 0).catch(() => null),
    ]);

    if (taglineResult?.tagline) {
      tagline = taglineResult.tagline;
      console.log('[ai-onboarding] Unique tagline:', tagline);
    }
    if (taglineResult?.subtitle) {
      subtitle = taglineResult.subtitle;
    }
    if (aboutResult?.description) {
      description = aboutResult.description;
      console.log('[ai-onboarding] Unique description generated');
    }
    if (aboutResult?.ownerBackground) {
      ownerBackground = aboutResult.ownerBackground;
    }
    if (Array.isArray(faqResult) && faqResult.length >= 3) {
      // Validate each FAQ has the required fields
      const validFaqs = faqResult.filter(f => f.question && f.answer);
      if (validFaqs.length >= 3) {
        faqs = validFaqs;
        console.log(`[ai-onboarding] ${validFaqs.length} unique FAQs generated`);
      }
    }
    if (Array.isArray(serviceResult) && serviceResult.length > 0) {
      for (const s of serviceResult) {
        if (s.id && s.description) {
          serviceDescriptions[s.id] = s.description;
        }
      }
      console.log(`[ai-onboarding] ${Object.keys(serviceDescriptions).length} unique service descriptions generated`);
    }
    if (layoutResult?.hero && layoutResult?.services && layoutResult?.about) {
      console.log(`[ai-onboarding] Layout selected: hero=${layoutResult.hero}, services=${layoutResult.services}, about=${layoutResult.about}`);
    }
  } else {
    console.log('[ai-onboarding] No AI binding provided, using template defaults');
  }

  // Build services — use AI descriptions where available, fall back to catalog
  const services = trade.defaultServices.map(s => ({
    ...s,
    description: serviceDescriptions[s.id] || s.shortDesc,
    fromPrice: 'Contact for quote',
  }));

  const config: SiteConfig = {
    shortName: input.businessName,
    tagline,
    subtitle,
    description,
    owner: input.ownerName,
    ownerBackground,
    phone: input.phone,
    phoneLandline: '',
    email: input.email,
    address: input.address
      ? { ...input.address, full: `${input.address.street}, ${input.address.town}, ${input.address.county} ${input.address.postcode}` }
      : { street: '', town: input.town, county: input.county, postcode: '', full: `${town}${county ? ', ' + county : ''}` },
    registrationNumber: input.registrationNumber || undefined,
    registrationBody: trade.registrationBody,
    yearsExperience: input.yearsExperience && input.yearsExperience > 0 ? input.yearsExperience : 0,
    socialMedia: {},
    serviceAreas: input.serviceAreas || [input.town],
    stats: {
      reviewCount: input.googleReviewCount || 0,
      averageRating: input.googleRating || 0,
      completedJobs: 0,
      yearsInBusiness: input.yearsExperience && input.yearsExperience > 0 ? input.yearsExperience : 0,
      responseSla: 'Same day',
    },
    credentials: trade.defaultCredentials.map(c => ({
      ...c,
      number: c.name.includes(trade.registrationBody || '') && input.registrationNumber ? input.registrationNumber : c.number,
    })),
    guarantees: trade.defaultGuarantees,
    services,
    servicePlans: [],
    faqs,
    layoutConfig: layoutResult?.hero && layoutResult?.services && layoutResult?.about
      ? { hero: layoutResult.hero, services: layoutResult.services, about: layoutResult.about }
      : { hero: 'split', services: 'grid', about: 'story' },
  };

  return config;
}

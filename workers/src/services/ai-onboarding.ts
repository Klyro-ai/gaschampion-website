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
}

// ============================================================
// Direct Workers AI helper — lightweight JSON generation
// ============================================================
async function generateJson<T>(ai: Ai, prompt: string): Promise<T | null> {
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    }) as { response?: string };

    if (!response.response) return null;

    let cleaned = response.response.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('generateJson failed:', err);
    return null;
  }
}

// ============================================================
// Generate unique service descriptions
// ============================================================
async function generateUniqueServices(
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

  return generateJson<Array<{ id: string; description: string }>>(ai, prompt);
}

// ============================================================
// Generate unique about page content
// ============================================================
async function generateAboutContent(
  ai: Ai,
  businessName: string,
  ownerName: string,
  tradeName: string,
  town: string,
  county: string,
  yearsExperience?: number,
): Promise<{ description: string; ownerBackground: string } | null> {
  const prompt = `Write a brief about page intro for ${businessName}, a ${tradeName.toLowerCase()} in ${town}${county ? ', ' + county : ''}.
Owner: ${ownerName}.${yearsExperience ? ' ' + yearsExperience + ' years experience.' : ''}

Return ONLY valid JSON with no extra text:
{"description":"3-4 sentence business description, first person, authentic, no marketing fluff","ownerBackground":"2-3 sentences about the owner's background and approach to the trade"}

Write as if ${ownerName} is talking directly to a local customer. Mention ${town} naturally.`;

  return generateJson<{ description: string; ownerBackground: string }>(ai, prompt);
}

// ============================================================
// Generate unique FAQs
// ============================================================
async function generateUniqueFaqs(
  ai: Ai,
  businessName: string,
  tradeName: string,
  town: string,
): Promise<Array<{ question: string; answer: string }> | null> {
  const prompt = `Write 5 FAQs for ${businessName}, a ${tradeName.toLowerCase()} in ${town}.
Questions should be what local customers actually ask. Include the town name "${town}" in at least one question.
Keep answers concise (1-2 sentences each). First person ("I" not "we").

Return ONLY valid JSON array with no extra text: [{"question":"...","answer":"..."},...]`;

  return generateJson<Array<{ question: string; answer: string }>>(ai, prompt);
}

// ============================================================
// Generate unique tagline and subtitle
// ============================================================
async function generateTagline(
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

  return generateJson<{ tagline: string; subtitle: string }>(ai, prompt);
}

// ============================================================
// Main entry point
// ============================================================
export async function generateSiteConfig(
  input: OnboardingInput,
  aiWriter: AiWriter,
  ai?: Ai,
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

    const [taglineResult, aboutResult, faqResult, serviceResult] = await Promise.all([
      generateTagline(ai, input.businessName, tradeName, town, trade.registrationBody).catch(() => null),
      generateAboutContent(ai, input.businessName, input.ownerName, tradeName, town, county, input.yearsExperience).catch(() => null),
      generateUniqueFaqs(ai, input.businessName, tradeName, town).catch(() => null),
      generateUniqueServices(ai, input.businessName, tradeName, town, trade.defaultServices).catch(() => null),
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
    yearsExperience: input.yearsExperience || 0,
    socialMedia: {},
    serviceAreas: input.serviceAreas || [input.town],
    stats: { reviewCount: 0, averageRating: 0, completedJobs: 0, yearsInBusiness: input.yearsExperience || 0, responseSla: 'Same day' },
    credentials: trade.defaultCredentials.map(c => ({
      ...c,
      number: c.name.includes(trade.registrationBody || '') && input.registrationNumber ? input.registrationNumber : c.number,
    })),
    guarantees: trade.defaultGuarantees,
    services,
    servicePlans: [],
    faqs,
  };

  return config;
}

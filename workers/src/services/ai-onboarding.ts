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

export async function generateSiteConfig(
  input: OnboardingInput,
  aiWriter: AiWriter,
): Promise<SiteConfig> {
  const trade = getTradeType(input.tradeType);
  if (!trade) throw new Error(`Unknown trade type: ${input.tradeType}`);

  // Generate text content via AI
  let aiContent: { tagline: string; subtitle: string; description: string; ownerBackground: string } | null = null;

  try {
    const prompt = buildOnboardingPrompt(input, trade.name);
    await aiWriter.generateDraft({
      businessName: input.businessName,
      serviceArea: `${input.town}, ${input.county}`,
      caption: prompt,
      hasPhoto: false,
    });

    // Try to extract structured data from the AI response content
    // The response comes back as a blog post format, but we just need short text
    aiContent = {
      tagline: `Expert ${trade.name} Services`,
      subtitle: `${trade.registrationBody ? trade.registrationBody + ' Registered ' : ''}${trade.name} in ${input.town}, ${input.county}`,
      description: `${input.businessName} provides expert ${trade.name.toLowerCase()} services across ${input.town}, ${input.county} and surrounding areas.${input.yearsExperience ? ` ${input.yearsExperience}+ years of experience.` : ''}`,
      ownerBackground: input.yearsExperience ? `${input.yearsExperience} years experience as a ${trade.name.toLowerCase()}` : '',
    };
  } catch {
    // AI failed — use template defaults
  }

  // Build services with descriptions from catalog
  const services = trade.defaultServices.map(s => ({
    ...s,
    description: s.shortDesc,
    fromPrice: 'Contact for quote',
  }));

  const config: SiteConfig = {
    shortName: input.businessName,
    tagline: aiContent?.tagline || `Expert ${trade.name} Services`,
    subtitle: aiContent?.subtitle || `${trade.name} in ${input.town}`,
    description: aiContent?.description || `${input.businessName} — ${trade.name.toLowerCase()} services in ${input.town}.`,
    owner: input.ownerName,
    ownerBackground: aiContent?.ownerBackground || '',
    phone: input.phone,
    phoneLandline: '',
    email: input.email,
    address: input.address
      ? { ...input.address, full: `${input.address.street}, ${input.address.town}, ${input.address.county} ${input.address.postcode}` }
      : { street: '', town: input.town, county: input.county, postcode: '', full: `${input.town}, ${input.county}` },
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
    faqs: trade.sampleFaqs,
  };

  return config;
}

function buildOnboardingPrompt(input: OnboardingInput, tradeName: string): string {
  return `Generate website text for ${input.businessName}, a ${tradeName.toLowerCase()} in ${input.town}, ${input.county}. Owner: ${input.ownerName}.${input.yearsExperience ? ` ${input.yearsExperience} years experience.` : ''} Generate a tagline, subtitle, and business description.`;
}

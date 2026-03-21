const API_BASE = import.meta.env.KLYRO_API_URL || 'http://localhost:8787';
const API_KEY = import.meta.env.KLYRO_API_KEY || '';
const CLIENT_ID = import.meta.env.KLYRO_CLIENT_ID || 'gaschampion';

interface TenantConfig {
  business: {
    name: string;
    shortName: string;
    tagline: string;
    subtitle: string;
    description: string;
    owner: string;
    ownerBackground: string;
    phone: string;
    phoneLandline: string;
    email: string;
    address: {
      street: string;
      town: string;
      county: string;
      postcode: string;
      full: string;
    };
    gasSafeNumber: string;
    yearsExperience: number;
    socialMedia: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
    serviceAreas: string[];
    stats: {
      reviewCount: number;
      averageRating: number;
      completedJobs: number;
      yearsInBusiness: number;
      responseSla: string;
    };
    credentials: Array<{ name: string; number: string | null }>;
    guarantees: string[];
  };
  services: Array<{
    id: string;
    name: string;
    shortDesc: string;
    description: string;
    icon: string;
    features: string[];
    fromPrice: string;
  }>;
  servicePlans: Array<{
    name: string;
    price: string;
    period: string;
    features: string[];
    popular: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

let _cached: TenantConfig | null = null;

export async function getTenantData(): Promise<TenantConfig> {
  if (_cached) return _cached;

  const url = `${API_BASE}/api/${CLIENT_ID}/config`;
  const response = await fetch(url, {
    headers: { 'X-API-Key': API_KEY },
  });

  if (!response.ok) {
    console.error(`Failed to fetch tenant config: ${response.status}`);
    throw new Error(`Tenant config fetch failed: ${response.status}`);
  }

  const data = await response.json() as { config: any };
  const c = data.config;

  _cached = {
    business: {
      name: c.shortName.includes('Ltd') ? c.shortName : `${c.shortName} Ltd`,
      shortName: c.shortName,
      tagline: c.tagline,
      subtitle: c.subtitle,
      description: c.description,
      owner: c.owner,
      ownerBackground: c.ownerBackground,
      phone: c.phone,
      phoneLandline: c.phoneLandline || '',
      email: c.email,
      address: c.address,
      gasSafeNumber: c.registrationNumber || '',
      yearsExperience: c.yearsExperience,
      socialMedia: c.socialMedia || {},
      serviceAreas: c.serviceAreas || [],
      stats: c.stats || { reviewCount: 0, averageRating: 0, completedJobs: 0, yearsInBusiness: 0, responseSla: '' },
      credentials: c.credentials || [],
      guarantees: c.guarantees || [],
    },
    services: c.services || [],
    servicePlans: c.servicePlans || [],
    faqs: c.faqs || [],
  };

  return _cached;
}

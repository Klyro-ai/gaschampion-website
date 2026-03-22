/// <reference types="astro/client" />

interface TenantData {
  clientId: string;
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
    socialMedia: Record<string, string | undefined>;
    serviceAreas: string[];
    stats: Record<string, any>;
    credentials: Array<{ name: string; number: string | null }>;
    guarantees: string[];
    logoUrl: string | null;
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
  themeId: string;
  apiBase: string;
  apiKey: string;
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

declare namespace App {
  interface Locals {
    tenant: TenantData;
    runtime: {
      env: Record<string, any>;
    };
  }
}

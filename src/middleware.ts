import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const hostname = context.request.headers.get('host')?.split(':')[0] || 'localhost';

  // Get API config from Cloudflare Worker vars or import.meta.env
  const runtime = (context.locals as any).runtime;
  const apiBase = runtime?.env?.KLYRO_API_URL || import.meta.env.KLYRO_API_URL || 'http://localhost:8787';
  const apiKey = runtime?.env?.KLYRO_API_KEY || import.meta.env.KLYRO_API_KEY || '';

  // Skip tenant resolution for static assets
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
    return next();
  }

  try {
    // Look up client by hostname
    let clientId: string;
    const lookupRes = await fetch(`${apiBase}/api/lookup?hostname=${encodeURIComponent(hostname)}`);

    if (lookupRes.ok) {
      const { client } = await lookupRes.json() as { client: { id: string } };
      clientId = client.id;
    } else {
      // Fallback for dev/unknown hostnames
      clientId = import.meta.env.KLYRO_CLIENT_ID || 'gaschampion';
    }

    // Fetch tenant config
    const configRes = await fetch(`${apiBase}/api/${clientId}/config`, {
      headers: { 'X-API-Key': apiKey },
    });

    if (!configRes.ok) {
      return new Response('Site not found', { status: 404 });
    }

    const { config: c } = await configRes.json() as { config: any };

    context.locals.tenant = {
      clientId,
      business: {
        name: c.shortName?.includes('Ltd') ? c.shortName : `${c.shortName} Ltd`,
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
        stats: c.stats || {},
        credentials: c.credentials || [],
        guarantees: c.guarantees || [],
      },
      services: c.services || [],
      servicePlans: c.servicePlans || [],
      faqs: c.faqs || [],
      apiBase,
      apiKey,
    };
  } catch (e) {
    console.error('Tenant resolution error:', e);
    return new Response('Service unavailable', { status: 503 });
  }

  return next();
});

import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

// Service binding to the API Worker — direct Worker-to-Worker calls
// Avoids workers.dev routing loops (CF error 1042)
function getApiWorker(): { fetch: typeof fetch } {
  return (env as any).API_WORKER;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const hostname = context.request.headers.get('host')?.split(':')[0] || 'localhost';
  const apiKey = (env as any).KLYRO_API_KEY || '';
  const apiWorker = getApiWorker();

  // Skip tenant resolution for static assets
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.ico') {
    return next();
  }

  try {
    // Look up client by hostname via service binding
    let clientId: string;
    const lookupRes = await apiWorker.fetch(
      new Request(`https://internal/api/lookup?hostname=${encodeURIComponent(hostname)}`)
    );

    if (lookupRes.ok) {
      const { client } = await lookupRes.json() as { client: { id: string } };
      clientId = client.id;
    } else {
      // Fallback for dev/unknown hostnames
      clientId = 'gaschampion';
    }

    // Fetch tenant config via service binding
    const configRes = await apiWorker.fetch(
      new Request(`https://internal/api/${clientId}/config`, {
        headers: { 'X-API-Key': apiKey },
      })
    );

    if (!configRes.ok) {
      return new Response('Site not found', { status: 404 });
    }

    const { config: c } = await configRes.json() as { config: any };

    // The SSR Worker needs to know the API Worker's public URL for image serving
    // (images are served from the API Worker's /api/image/ endpoint)
    const apiBase = 'https://klyro-worker.dark-grass-ae74.workers.dev';

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
      apiFetch: (input: RequestInfo | URL, init?: RequestInit) => {
        // Use service binding for Worker-to-Worker calls
        const req = input instanceof Request ? input : new Request(input, init);
        // Rewrite URL to use internal hostname for service binding
        const url = new URL(req.url);
        url.hostname = 'internal';
        url.protocol = 'https:';
        return apiWorker.fetch(new Request(url.toString(), req));
      },
    };
  } catch (e) {
    console.error('Tenant resolution error:', e);
    return new Response('Service unavailable', { status: 503 });
  }

  return next();
});

// SSR mode: tenant data is resolved per-request by middleware (src/middleware.ts)
// and stored on Astro.locals.tenant
//
// .astro files access it directly: const { business, services } = Astro.locals.tenant
// This file exists only for backward compatibility during migration

export async function getTenantData() {
  // This function should NOT be called in SSR mode
  // All pages should use Astro.locals.tenant instead
  throw new Error('getTenantData() is not available in SSR mode. Use Astro.locals.tenant instead.');
}

import type { APIRoute } from 'astro'

const staticPaths = [
  '/',
  '/about',
  '/contact',
  '/reviews',
  '/services',
  '/service-areas',
  '/blog',
  '/gallery',
  '/privacy',
  '/terms',
]

export const GET: APIRoute = (context) => {
  const origin = context.url.origin
  const tenant = context.locals.tenant
  const today = new Date().toISOString().split('T')[0]

  // Build dynamic paths from tenant data
  const servicePaths = (tenant?.services || []).map(
    (s: { id: string }) => `/services/${s.id}`
  )
  const areaPaths = (tenant?.business?.serviceAreas || []).map(
    (area: string) => `/service-areas/${area.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, '-')}`
  )

  const allPaths = [...staticPaths, ...servicePaths, ...areaPaths]

  const urls = allPaths
    .map(
      (path) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${today}</lastmod>
  </url>`
    )
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}

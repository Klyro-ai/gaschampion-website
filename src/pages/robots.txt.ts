import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin
  const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap-index.xml
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

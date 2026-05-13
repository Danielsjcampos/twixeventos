import type { MetadataRoute } from 'next'
import { getConfig } from '@/lib/db/queries/configuracoes'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [siteUrl, indexar] = await Promise.all([
    getConfig('site_url'),
    getConfig('robots_indexar'),
  ])

  const base = (siteUrl ?? 'https://twixeventos.com').replace(/\/$/, '')
  const permitir = indexar !== 'false'

  return {
    rules: [
      {
        userAgent: '*',
        allow: permitir ? '/' : undefined,
        disallow: permitir
          ? ['/admin', '/api/', '/auth/']
          : '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

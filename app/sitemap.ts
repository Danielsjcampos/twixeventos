import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { brinquedos, glossarioTermos, blogPosts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getConfig } from '@/lib/db/queries/configuracoes'

export const dynamic = 'force-dynamic' // gerado em runtime (self-hosted: sem DB no build)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, frequencia, prioridade, includeBlog] = await Promise.all([
    getConfig('site_url'),
    getConfig('sitemap_frequencia'),
    getConfig('sitemap_prioridade'),
    getConfig('sitemap_include_blog'),
  ])

  const base = (siteUrl ?? 'https://twixeventos.com').replace(/\/$/, '')
  const freq = (frequencia ?? 'weekly') as MetadataRoute.Sitemap[0]['changeFrequency']
  const prio = parseFloat(prioridade ?? '0.8')
  const agora = new Date()

  // ── Páginas estáticas ──────────────────────────────────────────
  const estaticas: MetadataRoute.Sitemap = [
    { url: base,               lastModified: agora, changeFrequency: 'daily',   priority: 1.0  },
    { url: `${base}/brinquedos`, lastModified: agora, changeFrequency: 'daily', priority: 0.95 },
    { url: `${base}/sobre`,    lastModified: agora, changeFrequency: 'monthly', priority: 0.6  },
    { url: `${base}/contato`,    lastModified: agora, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${base}/bio`,        lastModified: agora, changeFrequency: 'weekly',  priority: 0.65 },
    { url: `${base}/minha-area`, lastModified: agora, changeFrequency: 'monthly', priority: 0.5  },
  ]

  // ── Brinquedos (páginas individuais) ──────────────────────────
  let brinquedosUrls: MetadataRoute.Sitemap = []
  try {
    const lista = await db
      .select({ slug: brinquedos.slug, updatedAt: brinquedos.updatedAt })
      .from(brinquedos)
      .where(eq(brinquedos.ativo, true))

    brinquedosUrls = lista.map(b => ({
      url: `${base}/brinquedos/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: freq,
      priority: prio,
    }))
  } catch {
    // silencia erro para não quebrar o sitemap se o DB estiver indisponível
  }

  // ── Glossário (verbetes publicados) ──────────────────────────
  let glossarioUrls: MetadataRoute.Sitemap = []
  try {
    const lista = await db
      .select({ slug: glossarioTermos.slug, updatedAt: glossarioTermos.updatedAt })
      .from(glossarioTermos)
      .where(eq(glossarioTermos.status, 'publicado'))

    glossarioUrls = [
      { url: `${base}/glossario`, lastModified: agora, changeFrequency: 'daily', priority: 0.8 },
      ...lista.map(g => ({
        url: `${base}/glossario/${g.slug}`,
        lastModified: g.updatedAt,
        changeFrequency: freq,
        priority: prio,
      }))
    ]
  } catch {
    // silencia erro para não quebrar o sitemap se o DB estiver indisponível
  }

  // ── Blog (opcional, ativado nas configs) ──────────────────────
  let blogUrls: MetadataRoute.Sitemap = []
  if (includeBlog === 'true') {
    try {
      const posts = await db
        .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
        .from(blogPosts)
        .where(eq(blogPosts.status, 'publicado'))

      blogUrls = [
        { url: `${base}/blog`, lastModified: agora, changeFrequency: 'daily', priority: 0.8 },
        ...posts.map(p => ({
          url: `${base}/blog/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: freq,
          priority: prio,
        }))
      ]
    } catch {
      // silencia erro para não quebrar o sitemap se o DB estiver indisponível
    }
  }

  return [...estaticas, ...brinquedosUrls, ...glossarioUrls, ...blogUrls]
}

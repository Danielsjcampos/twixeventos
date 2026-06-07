import { Suspense } from 'react'
import { getPostsAdmin } from '@/lib/db/queries/blog'
import { BlogManagement } from '@/components/admin/BlogManagement'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog SEO — Admin' }
export const dynamic = 'force-dynamic'

import { getConfig } from '@/lib/db/queries/configuracoes'

async function BlogContent() {
  const [posts, fallbackImagensRaw] = await Promise.all([
    getPostsAdmin({}),
    getConfig('blog_fallback_imagens'),
  ])
  
  let fallbackImagens: string[] = []
  if (fallbackImagensRaw) {
    try {
      fallbackImagens = JSON.parse(fallbackImagensRaw)
    } catch {
      fallbackImagens = []
    }
  }

  // Transform dates to strings for Next.js serialization client-side
  const serializedPosts = posts.map(p => ({
    ...p,
    status: p.status as 'rascunho' | 'publicado',
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <BlogManagement 
      initialPosts={serializedPosts} 
      initialFallbackImages={fallbackImagens} 
    />
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando painel do blog...</div>}>
      <BlogContent />
    </Suspense>
  )
}

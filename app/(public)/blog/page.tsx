import { unstable_cache } from 'next/cache'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { getPostsPublicados } from '@/lib/db/queries/blog'
import { BlogPublicClient } from '@/components/public/BlogPublicClient'
import { Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog da Twix — Dicas, Festas e Diversão | Twix Eventos',
  description: 'Dicas de organização de eventos, guias de brinquedos infláveis, e tendências para festas infantis e corporativas em São José dos Campos e região.',
}

export const dynamic = 'force-dynamic'

// Cache server-side por 10 min para velocidade máxima de carregamento.
const getPostsCache = unstable_cache(
  () => getPostsPublicados(),
  ['public-blog-posts'],
  { revalidate: 600 },
)

export default async function BlogPage() {
  const posts = await getPostsCache()

  // Serialize dates for Next.js hydration safety
  const serializedPosts = posts.map(p => ({
    ...p,
    tags: p.tags ?? [],
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString(),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : new Date(p.updatedAt).toISOString(),
  }))

  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg pb-20">
        {/* Hero */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-accent/10 border border-brand-accent/25 text-brand-accent animate-fade-in">
              <Sparkles className="size-3" />
              Blog & Notícias
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-4xl lg:text-6xl font-bold text-brand-text uppercase leading-none">
              DICAS & <span className="text-brand-accent">DIVERSÃO</span>
            </h1>
            <p className="text-brand-muted text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
              O seu guia completo de ideias de festas infantis, planejamento de eventos corporativos, 
              segurança em brinquedos infláveis e entretenimento local em SJC.
            </p>
          </div>
        </section>

        {/* Blog client container */}
        <section className="px-4 max-w-6xl mx-auto">
          <BlogPublicClient posts={serializedPosts} />
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

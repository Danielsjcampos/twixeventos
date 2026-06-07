import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { getPostBySlugPublicado, getPostsPublicados, incrementViews } from '@/lib/db/queries/blog'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, BookOpen, Star, Sparkles, Calendar, Clock, Eye, Share2, Phone } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlugPublicado(slug)
  if (!post) return { title: 'Artigo Não Encontrado — Twix Eventos' }

  return {
    title: post.seoTitle ?? `${post.titulo} — Blog Twix Eventos`,
    description: post.seoDescription ?? post.resumo ?? `Leia o artigo completo no blog da Twix Eventos em São José dos Campos.`,
    keywords: post.seoKeywords ?? (post.tags ?? []).join(', '),
    openGraph: {
      title: post.seoTitle ?? post.titulo,
      description: post.seoDescription ?? post.resumo ?? '',
      type: 'article',
      publishedTime: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt),
      images: post.fotoDestaque ? [{ url: post.fotoDestaque }] : [],
    }
  }
}

export const revalidate = 3600 // cache static page for 1 hour

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlugPublicado(slug)

  if (!post) {
    notFound()
  }

  // Asynchronously increment views in background
  incrementViews(post.id).catch(err => console.error('Error incrementing views:', err))

  // Fetch latest posts for related section
  const allPosts = await getPostsPublicados()
  const relacionados = allPosts
    .filter(p => p.id !== post.id && (p.categoria === post.categoria || (p.tags ?? []).some(t => (post.tags ?? []).includes(t))))
    .slice(0, 4)

  // If not enough related posts, pad with other latest posts
  if (relacionados.length < 4) {
    const extraPosts = allPosts
      .filter(p => p.id !== post.id && !relacionados.some(r => r.id === p.id))
      .slice(0, 4 - relacionados.length)
    relacionados.push(...extraPosts)
  }

  // Extract headings for Table of Contents and inject IDs into H2s
  let contentHtml = post.conteudo
  const headings: { text: string; id: string }[] = []
  
  // Use regex to match all h2 tags
  const h2Regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi
  let match
  let index = 0
  
  // Create a copy of content to manipulate
  while ((match = h2Regex.exec(post.conteudo)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim()
    const id = `heading-${index++}-${text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')}`
    
    headings.push({ text, id })
    
    // Inject ID into content html
    const originalTag = match[0]
    const tagWithId = originalTag.replace('<h2', `<h2 id="${id}"`)
    contentHtml = contentHtml.replace(originalTag, tagWithId)
  }

  const publishDate = new Date(post.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  // Share URLs
  const postUrl = `https://twixeventos.com.br/blog/${post.slug}`
  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.titulo}\n${postUrl}`)}`
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`

  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg pb-20">
        {/* Breadcrumb e Retorno */}
        <section className="pt-8 px-4 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
            <nav className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
              <Link href="/" className="hover:text-brand-accent transition-colors">Home</Link>
              <ChevronRight className="size-3" />
              <Link href="/blog" className="hover:text-brand-accent transition-colors">Blog</Link>
              <ChevronRight className="size-3" />
              <span className="text-brand-text truncate max-w-[200px]">{post.titulo}</span>
            </nav>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-accent transition-colors font-bold self-start"
            >
              <ArrowLeft className="size-3.5" />
              Voltar ao blog
            </Link>
          </div>
        </section>

        {/* Artigo Principal */}
        <section className="px-4 py-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Esquerda: Artigo */}
            <article className="lg:col-span-8 bg-brand-surface border border-brand-border/80 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
              {/* Header do Artigo */}
              <header className="space-y-4 border-b border-brand-border/60 pb-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-accent/10 border border-brand-accent/25 text-brand-accent">
                  <Sparkles className="size-2.5" />
                  {post.categoria}
                </span>
                
                <h1 className="font-[family-name:var(--font-display)] text-3xl lg:text-4xl font-extrabold text-brand-text leading-tight uppercase">
                  {post.titulo}
                </h1>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted font-bold font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {publishDate}
                  </span>
                  <span className="hidden sm:inline size-1 bg-brand-border rounded-full" />
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {post.tempoLeitura} min de leitura
                  </span>
                  <span className="hidden sm:inline size-1 bg-brand-border rounded-full" />
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {post.visualizacoes + 1} visualizações
                  </span>
                </div>
              </header>

              {/* Imagem de Capa */}
              {post.fotoDestaque && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-brand-border bg-brand-surface-2 shadow-sm">
                  <img
                    src={post.fotoDestaque}
                    alt={post.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Table of Contents (TOC) */}
              {headings.length > 1 && (
                <div className="rounded-xl border border-brand-border bg-brand-surface-2/30 p-4 space-y-2.5">
                  <h4 className="font-bold text-xs text-brand-text uppercase flex items-center gap-2">
                    <BookOpen className="size-4 text-brand-accent" />
                    Conteúdo do Artigo
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {headings.map((h, i) => (
                      <li key={i}>
                        <a
                          href={`#${h.id}`}
                          className="text-brand-muted hover:text-brand-accent transition-colors font-medium flex items-start gap-1 leading-relaxed"
                        >
                          <span className="text-brand-accent shrink-0 font-bold font-mono">{i + 1}.</span>
                          <span className="hover:underline">{h.text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Corpo do Artigo */}
              <div 
                className="blog-conteudo text-brand-text text-sm leading-relaxed space-y-5
                  [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-brand-text [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:border-l-4 [&_h2]:border-brand-accent [&_h2]:pl-3 [&_h2]:scroll-mt-24
                  [&_p]:text-brand-muted [&_p]:leading-relaxed [&_p]:mb-4
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_li]:text-brand-muted [&_li]:mb-1.5 [&_li]:text-sm
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:text-brand-muted [&_li]:mb-1.5 [&_li]:text-sm
                  [&_figure]:my-8 [&_figure]:rounded-2xl [&_figure]:overflow-hidden [&_figure]:border [&_figure]:border-brand-border [&_figure]:bg-brand-surface-2 [&_figure]:p-2
                  [&_figcaption]:text-xs [&_figcaption]:text-brand-muted [&_figcaption]:text-center [&_figcaption]:mt-2 [&_figcaption]:font-medium
                  [&_a]:text-brand-accent [&_a]:font-bold [&_a]:underline [&_a]:hover:text-brand-accent/80"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {/* Compartilhar Artigo */}
              <footer className="border-t border-brand-border/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {(post.tags ?? []).map(t => (
                    <span key={t} className="text-xs font-semibold text-brand-muted bg-brand-surface-2 px-2.5 py-1 rounded-lg border border-brand-border/60">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-muted flex items-center gap-1.5">
                    <Share2 className="size-3.5" />
                    Compartilhar:
                  </span>
                  <a
                    href={shareWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center size-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                    title="Compartilhar no WhatsApp"
                  >
                    <Phone className="size-4 rotate-12 fill-white" />
                  </a>
                  <a
                    href={shareFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center size-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    title="Compartilhar no Facebook"
                  >
                    <span className="font-bold text-sm">F</span>
                  </a>
                </div>
              </footer>
            </article>

            {/* Direita: Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Box de Aluguel de Brinquedos */}
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="size-4.5 text-brand-accent fill-brand-accent" />
                  <h4 className="font-extrabold text-sm text-brand-text uppercase">Locação de Brinquedos em SJC</h4>
                </div>
                <p className="text-brand-muted text-xs leading-relaxed">
                  Vai fazer uma festa ou evento em São José dos Campos? Nós temos brinquedos infláveis, camas elásticas, eletrônicos e muito mais. Entrega e montagem inclusas!
                </p>
                <div className="space-y-2 pt-1">
                  <Link
                    href="/brinquedos"
                    className="w-full inline-flex items-center justify-center font-bold text-xs py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white transition-colors text-center"
                  >
                    Ver brinquedos
                  </Link>
                  <a
                    href={`https://api.whatsapp.com/send?phone=5512996498725&text=${encodeURIComponent(`Olá, vim do artigo "${post.titulo}" e gostaria de orçar aluguel de brinquedos!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 font-bold text-xs py-2.5 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-surface-2 text-brand-text transition-colors text-center"
                  >
                    Falar no WhatsApp
                  </a>
                </div>
              </div>

              {/* Artigos Relacionados */}
              {relacionados.length > 0 && (
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-brand-text flex items-center gap-1.5 uppercase">
                    <BookOpen className="size-4 text-brand-accent" />
                    Leia também
                  </h4>
                  <ul className="space-y-4">
                    {relacionados.map(r => (
                      <li key={r.id} className="group flex gap-3 border-b border-brand-border/60 pb-3 last:border-0 last:pb-0">
                        {r.fotoDestaque ? (
                          <img src={r.fotoDestaque} className="size-14 rounded-lg object-cover border border-brand-border shrink-0" alt="" />
                        ) : (
                          <div className="size-14 rounded-lg bg-brand-surface-2 border border-brand-border shrink-0 flex items-center justify-center text-brand-muted">
                            <BookOpen className="size-4.5" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <Link 
                            href={`/blog/${r.slug}`}
                            className="font-bold text-xs text-brand-text group-hover:text-brand-accent transition-colors leading-snug line-clamp-2"
                          >
                            {r.titulo}
                          </Link>
                          <span className="text-[10px] text-brand-muted font-bold font-mono block">
                            {r.tempoLeitura} min de leitura
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

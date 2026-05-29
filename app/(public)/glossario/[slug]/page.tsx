import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { getTermoBySlugPublicado, getTermosByLetraPublicados } from '@/lib/db/queries/glossario'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, BookOpen, Star, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const termo = await getTermoBySlugPublicado(slug)
  if (!termo) return { title: 'Verbete Não Encontrado — Twix Eventos' }

  return {
    title: termo.seoTitle ?? `${termo.termo} — O que é e Significado | Twix Eventos`,
    description: termo.seoDescription ?? `Saiba o que significa ${termo.termo} no Dicionário da Twix Eventos em São José dos Campos.`,
  }
}

export const revalidate = 3600

export default async function VerbetePage({ params }: Props) {
  const { slug } = await params
  const termo = await getTermoBySlugPublicado(slug)

  if (!termo) {
    notFound()
  }

  // Buscar verbetes relacionados da mesma letra para linkagem interna (SEO)
  const todosMesmaLetra = await getTermosByLetraPublicados(termo.letra)
  const relacionados = todosMesmaLetra
    .filter(t => t.id !== termo.id)
    .slice(0, 5)

  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg pb-20">
        {/* Breadcrumb e Retorno */}
        <section className="pt-8 px-4 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
            <nav className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
              <Link href="/" className="hover:text-brand-accent transition-colors">Home</Link>
              <ChevronRight className="size-3" />
              <Link href="/glossario" className="hover:text-brand-accent transition-colors">Glossário</Link>
              <ChevronRight className="size-3" />
              <span className="text-brand-text truncate max-w-[200px]">{termo.termo}</span>
            </nav>
            <Link
              href="/glossario"
              className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-accent transition-colors font-bold self-start"
            >
              <ArrowLeft className="size-3.5" />
              Voltar ao glossário
            </Link>
          </div>
        </section>

        {/* Verbete Corpo Principal */}
        <section className="px-4 py-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Artigo (Esquerda) */}
            <article className="lg:col-span-8 space-y-6 bg-brand-surface border border-brand-border rounded-2xl p-6 lg:p-8 shadow-sm">
              {/* Header do Verbete */}
              <header className="space-y-3 border-b border-brand-border/60 pb-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-accent/10 border border-brand-accent/25 text-brand-accent">
                  <Sparkles className="size-2.5" />
                  Nicho: {termo.nicho}
                </span>
                <h1 className="font-[family-name:var(--font-display)] text-3xl lg:text-4xl font-extrabold text-brand-text leading-tight uppercase">
                  {termo.termo}
                </h1>
                <p className="text-xs text-brand-muted font-medium">
                  Publicado no Dicionário Twix Eventos | Otimização local para SJC e região
                </p>
              </header>

              {/* Conteúdo HTML Gerado */}
              <div 
                className="text-brand-text text-sm leading-relaxed space-y-4 
                  [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-brand-text [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-l-4 [&_h2]:border-brand-accent [&_h2]:pl-3
                  [&_p]:text-brand-muted [&_p]:leading-relaxed [&_p]:mb-4"
                dangerouslySetInnerHTML={{ __html: termo.conteudo ?? '' }}
              />
            </article>

            {/* Sidebar Otimização / Internos (Direita) */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Box de Contato/Chamada de Ação */}
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-brand-accent fill-brand-accent" />
                  <h4 className="font-extrabold text-sm text-brand-text">Precisa de Brinquedos?</h4>
                </div>
                <p className="text-brand-muted text-xs leading-relaxed">
                  Realizamos a locação completa com entrega, montagem, desmontagem e monitor de segurança inclusos!
                </p>
                <Link
                  href="/brinquedos"
                  className="w-full inline-flex items-center justify-center font-bold text-xs py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-white transition-colors text-center"
                >
                  Ver brinquedos disponíveis
                </Link>
              </div>

              {/* Verbetes Relacionados */}
              {relacionados.length > 0 && (
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-brand-text flex items-center gap-1.5">
                    <BookOpen className="size-4 text-brand-accent" />
                    Letra {termo.letra}: Veja também
                  </h4>
                  <ul className="space-y-3">
                    {relacionados.map(r => (
                      <li key={r.id} className="text-xs group border-b border-brand-border/60 pb-2 last:border-0 last:pb-0">
                        <Link 
                          href={`/glossario/${r.slug}`}
                          className="font-semibold text-brand-muted group-hover:text-brand-accent transition-colors flex items-center justify-between"
                        >
                          <span>{r.termo}</span>
                          <span className="text-[10px] bg-brand-surface-2 border border-brand-border px-1.5 py-0.5 rounded font-mono font-bold group-hover:bg-brand-accent/10 transition-colors uppercase">
                            {r.letra}
                          </span>
                        </Link>
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

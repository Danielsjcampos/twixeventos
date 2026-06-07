'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Calendar, Clock, Layers, ArrowRight, BookOpen, Smile, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogPost {
  id: string
  titulo: string
  slug: string
  conteudo: string
  resumo: string | null
  fotoDestaque: string | null
  categoria: string
  tags: string[]
  status: string
  tempoLeitura: number
  createdAt: string | Date
}

interface Props {
  posts: BlogPost[]
}

export function BlogPublicClient({ posts }: Props) {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')

  // Extract unique categories from posts
  const categorias = ['Todos', ...Array.from(new Set(posts.map(p => p.categoria)))]

  // Filter posts based on search & category
  const filteredPosts = posts.filter(p => {
    const matchesBusca =
      busca.trim() === '' ||
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.resumo && p.resumo.toLowerCase().includes(busca.toLowerCase())) ||
      p.categoria.toLowerCase().includes(busca.toLowerCase())

    const matchesCategoria =
      categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva

    return matchesBusca && matchesCategoria
  })

  // Format Date safely
  const formatDate = (dateInput: string | Date) => {
    const d = new Date(dateInput)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-10">
      {/* Search and Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-5 shadow-sm backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-brand-muted" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-brand-bg/80 border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-brand-text placeholder:text-brand-muted text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-200"
            placeholder="Buscar artigos por tema..."
          />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border border-brand-border',
                categoriaAtiva === cat
                  ? 'bg-brand-accent border-brand-accent text-white shadow-md shadow-brand-accent/10'
                  : 'bg-brand-bg/60 text-brand-muted hover:text-brand-text hover:bg-brand-surface hover:border-brand-accent/30'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface/40 border border-brand-border rounded-2xl p-8 max-w-md mx-auto">
          <Smile className="size-10 text-brand-muted mx-auto opacity-50 mb-3" />
          <h3 className="font-extrabold text-brand-text text-base">Nenhum post encontrado</h3>
          <p className="text-xs text-brand-muted mt-1 leading-relaxed">
            Não encontramos artigos para <span className="font-mono text-brand-text font-bold">"{busca}"</span> nesta categoria. Experimente buscar outro termo!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, idx) => (
            <article
              key={post.id}
              className={cn(
                'group flex flex-col bg-brand-surface border border-brand-border/80 hover:border-brand-accent/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative',
                'animate-fade-in-up'
              )}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Card Image */}
              <Link href={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden bg-brand-surface-2">
                {post.fotoDestaque ? (
                  <img
                    src={post.fotoDestaque}
                    alt={post.titulo}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted gap-2">
                    <BookOpen className="size-8 opacity-45" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Twix Eventos</span>
                  </div>
                )}
                {/* Category badge absolute */}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-accent/90 text-white backdrop-blur-sm border border-brand-accent/20">
                  <Layers className="size-2.5 shrink-0" />
                  {post.categoria}
                </span>
              </Link>

              {/* Card Body */}
              <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  {/* Meta date / read time */}
                  <div className="flex items-center gap-3 text-[11px] text-brand-muted font-bold font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(post.createdAt)}
                    </span>
                    <span className="size-1 bg-brand-border rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {post.tempoLeitura} min de leitura
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-[family-name:var(--font-display)] text-lg lg:text-xl font-extrabold text-brand-text leading-snug group-hover:text-brand-accent transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>
                      {post.titulo}
                    </Link>
                  </h3>

                  {/* Summary */}
                  {post.resumo && (
                    <p className="text-brand-muted text-xs leading-relaxed line-clamp-3">
                      {post.resumo}
                    </p>
                  )}
                </div>

                {/* Read more link */}
                <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[9px] font-semibold text-brand-muted bg-brand-surface-2 px-2 py-0.5 rounded border border-brand-border/60">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-black uppercase text-brand-accent hover:text-brand-accent-hover transition-colors"
                  >
                    Ler artigo
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

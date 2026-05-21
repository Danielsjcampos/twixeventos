'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CATEGORIAS } from '@/lib/utils'

/* ─── tipos ─────────────────────────────────────────── */
interface Brinquedo {
  id: string
  nome: string
  slug: string
  categoria: string
  faixaEtaria: string
  capacidade: string
  status: string | null
  destaque: boolean | null
  fotoDestaque: string | null
  fotos?: string[] | null
}

/* ─── config de status ──────────────────────────────── */
const STATUS_CONFIG = {
  publicado: { label: 'Publicado',  dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-500/10 border-green-500/25' },
  rascunho:  { label: 'Rascunho',   dot: 'bg-gray-400',  text: 'text-gray-400',  bg: 'bg-gray-400/10 border-gray-400/25' },
  invisivel: { label: 'Invisível',  dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25' },
} as const

const CATEGORIAS_FILTER = CATEGORIAS.filter(c => c.value !== 'todos')

/* ─── ícones ─────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-brand-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function GridLargeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function GridSmallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="4" height="4" rx="0.5" /><rect x="10" y="3" width="4" height="4" rx="0.5" /><rect x="17" y="3" width="4" height="4" rx="0.5" />
      <rect x="3" y="10" width="4" height="4" rx="0.5" /><rect x="10" y="10" width="4" height="4" rx="0.5" /><rect x="17" y="10" width="4" height="4" rx="0.5" />
      <rect x="3" y="17" width="4" height="4" rx="0.5" /><rect x="10" y="17" width="4" height="4" rx="0.5" /><rect x="17" y="17" width="4" height="4" rx="0.5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/* ─── componente principal ──────────────────────────── */
export function BrinquedosCatalogo({ brinquedos }: { brinquedos: Brinquedo[] }) {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterCat, setFilterCat]     = useState<string>('todos')
  const [compact, setCompact]         = useState(false)

  /* contadores para header */
  const counts = useMemo(() => ({
    publicado: brinquedos.filter(b => b.status === 'publicado').length,
    rascunho:  brinquedos.filter(b => b.status === 'rascunho').length,
    invisivel: brinquedos.filter(b => b.status === 'invisivel').length,
  }), [brinquedos])

  /* filtragem */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return brinquedos.filter(b => {
      if (filterStatus !== 'todos' && (b.status ?? 'publicado') !== filterStatus) return false
      if (filterCat !== 'todos' && b.categoria !== filterCat) return false
      if (q && !b.nome.toLowerCase().includes(q)) return false
      return true
    })
  }, [brinquedos, search, filterStatus, filterCat])

  const hasActiveFilter = search || filterStatus !== 'todos' || filterCat !== 'todos'

  function clearFilters() {
    setSearch('')
    setFilterStatus('todos')
    setFilterCat('todos')
  }

  return (
    <div className="p-6 pb-24 md:pb-6">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
            Catálogo
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-brand-muted text-sm">{brinquedos.length} brinquedos</span>
            {Object.entries(counts).filter(([, v]) => v > 0).map(([key, count]) => {
              const cfg = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]
              return (
                <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {count} {cfg.label.toLowerCase()}
                </span>
              )
            })}
          </div>
        </div>
        <Link href="/admin/brinquedos/novo">
          <Button className="bg-brand-accent hover:bg-brand-accent-hover text-white">
            + Novo Brinquedo
          </Button>
        </Link>
      </div>

      {/* ── Barra de filtros ─────────────────────── */}
      <div className="flex flex-col gap-3 mb-5">

        {/* linha 1: busca + view toggle */}
        <div className="flex items-center gap-2">
          {/* search */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar brinquedo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-brand-border bg-brand-surface-2 text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors"
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* spacer */}
          <div className="flex-1" />

          {/* view toggle */}
          <div className="flex items-center gap-1 bg-brand-surface-2 border border-brand-border rounded-xl p-1">
            <button
              type="button"
              onClick={() => setCompact(false)}
              title="Grade normal"
              className={[
                'p-1.5 rounded-lg transition-all',
                !compact
                  ? 'bg-brand-surface text-brand-accent shadow-sm border border-brand-border'
                  : 'text-brand-muted hover:text-brand-text',
              ].join(' ')}
            >
              <GridLargeIcon />
            </button>
            <button
              type="button"
              onClick={() => setCompact(true)}
              title="Grade compacta"
              className={[
                'p-1.5 rounded-lg transition-all',
                compact
                  ? 'bg-brand-surface text-brand-accent shadow-sm border border-brand-border'
                  : 'text-brand-muted hover:text-brand-text',
              ].join(' ')}
            >
              <GridSmallIcon />
            </button>
          </div>
        </div>

        {/* linha 2: chips de status + categoria */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* status chips */}
          <div className="flex items-center gap-1.5">
            {[
              { value: 'todos', label: 'Todos os status' },
              { value: 'publicado',  label: 'Publicado' },
              { value: 'rascunho',   label: 'Rascunho' },
              { value: 'invisivel',  label: 'Invisível' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                  filterStatus === opt.value
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                    : 'border-brand-border bg-brand-surface-2 text-brand-muted hover:border-brand-accent/40 hover:text-brand-text',
                ].join(' ')}
              >
                {opt.value !== 'todos' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[opt.value as keyof typeof STATUS_CONFIG].dot}`} />
                )}
                {opt.label}
              </button>
            ))}
          </div>

          <span className="w-px h-4 bg-brand-border" />

          {/* categoria chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterCat('todos')}
              className={[
                'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                filterCat === 'todos'
                  ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                  : 'border-brand-border bg-brand-surface-2 text-brand-muted hover:border-brand-accent/40 hover:text-brand-text',
              ].join(' ')}
            >
              Todas categorias
            </button>
            {CATEGORIAS_FILTER.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFilterCat(cat.value)}
                className={[
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                  filterCat === cat.value
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                    : 'border-brand-border bg-brand-surface-2 text-brand-muted hover:border-brand-accent/40 hover:text-brand-text',
                ].join(' ')}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* resultado + limpar */}
        {hasActiveFilter && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-muted">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-brand-accent hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────── */}
      {filtered.length > 0 ? (
        compact ? (
          /* grade compacta — 4 col → 5 col em telas grandes */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(b => <CompactCard key={b.id} b={b} />)}
          </div>
        ) : (
          /* grade normal */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(b => <NormalCard key={b.id} b={b} />)}
          </div>
        )
      ) : (
        <div className="text-center py-20 text-brand-muted">
          {hasActiveFilter ? (
            <>
              <p className="text-base font-medium">Nenhum brinquedo encontrado</p>
              <p className="text-sm mt-1">Tente outros filtros ou{' '}
                <button type="button" onClick={clearFilters} className="text-brand-accent hover:underline">
                  limpe a busca
                </button>.
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium">Nenhum brinquedo cadastrado</p>
              <p className="text-sm mt-1">Clique em &quot;+ Novo Brinquedo&quot; para começar.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Card normal ────────────────────────────────────── */
function NormalCard({ b }: { b: Brinquedo }) {
  const status = (b.status ?? 'publicado') as keyof typeof STATUS_CONFIG
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho

  return (
    <Link
      href={`/admin/brinquedos/${b.id}/editar`}
      className="group bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-brand-accent/40 transition-colors duration-150 flex flex-col"
    >
      <div className="relative aspect-video bg-brand-surface-2">
        {b.fotoDestaque ? (
          <Image src={b.fotoDestaque} alt={b.nome} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">Sem foto</div>
        )}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className="bg-brand-surface/90 backdrop-blur-sm text-brand-text text-xs px-2 py-0.5 rounded-full border border-brand-border font-medium">
            {b.categoria}
          </span>
          {b.destaque && (
            <span className="bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold">Destaque</span>
          )}
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-semibold bg-brand-accent px-3 py-1.5 rounded-lg">Editar brinquedo</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-brand-text font-semibold group-hover:text-brand-accent transition-colors leading-snug">{b.nome}</h3>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <p className="text-brand-muted text-xs">{b.faixaEtaria} · {b.capacidade}</p>
        {(b.fotos?.length ?? 0) > 0 && (
          <p className="text-brand-muted text-xs">{b.fotos!.length} foto{b.fotos!.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </Link>
  )
}

/* ─── Card compacto ──────────────────────────────────── */
function CompactCard({ b }: { b: Brinquedo }) {
  const status = (b.status ?? 'publicado') as keyof typeof STATUS_CONFIG
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho

  return (
    <Link
      href={`/admin/brinquedos/${b.id}/editar`}
      className="group bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-brand-accent/40 transition-colors duration-150 flex flex-col"
    >
      <div className="relative aspect-square bg-brand-surface-2">
        {b.fotoDestaque ? (
          <Image src={b.fotoDestaque} alt={b.nome} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-200" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs">Sem foto</div>
        )}
        {b.destaque && (
          <div className="absolute top-1.5 right-1.5">
            <span className="bg-amber-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none">★</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs font-semibold bg-brand-accent px-2 py-1 rounded-md">Editar</span>
        </div>
      </div>

      <div className="px-2.5 py-2 flex flex-col gap-1">
        <p className="text-brand-text text-xs font-semibold leading-tight line-clamp-2 group-hover:text-brand-accent transition-colors">
          {b.nome}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-brand-muted text-[10px] truncate">{b.categoria}</span>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
      </div>
    </Link>
  )
}

import { Suspense } from 'react'
import { getAllBrinquedosAdmin } from '@/lib/db/queries/brinquedos'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Catálogo' }
export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  publicado: { label: 'Publicado',  dot: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-500/10 border-green-500/25' },
  rascunho:  { label: 'Rascunho',   dot: 'bg-gray-400',  text: 'text-gray-400',  bg: 'bg-gray-400/10 border-gray-400/25' },
  invisivel: { label: 'Invisível',  dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25' },
} as const

async function BrinquedosContent() {
  const brinquedos = await getAllBrinquedosAdmin()

  const counts = {
    publicado: brinquedos.filter(b => b.status === 'publicado').length,
    rascunho:  brinquedos.filter(b => b.status === 'rascunho').length,
    invisivel: brinquedos.filter(b => b.status === 'invisivel').length,
  }

  return (
    <div className="p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brinquedos.map(b => {
          const status = (b.status ?? 'publicado') as keyof typeof STATUS_CONFIG
          const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho

          return (
            <Link
              key={b.id}
              href={`/admin/brinquedos/${b.id}/editar`}
              className="group bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-brand-accent/40 transition-colors duration-150 flex flex-col"
            >
              {/* Foto */}
              <div className="relative aspect-video bg-brand-surface-2">
                {b.fotoDestaque ? (
                  <Image
                    src={b.fotoDestaque}
                    alt={b.nome}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">
                    Sem foto
                  </div>
                )}

                {/* Badges overlay */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  <span className="bg-brand-surface/90 backdrop-blur-sm text-brand-text text-xs px-2 py-0.5 rounded-full border border-brand-border font-medium">
                    {b.categoria}
                  </span>
                  {b.destaque && (
                    <span className="bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      Destaque
                    </span>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold bg-brand-accent px-3 py-1.5 rounded-lg">
                    Editar brinquedo
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-brand-text font-semibold group-hover:text-brand-accent transition-colors leading-snug">
                    {b.nome}
                  </h3>
                  {/* Status badge */}
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                <p className="text-brand-muted text-xs">{b.faixaEtaria} · {b.capacidade}</p>

                {(b.fotos?.length ?? 0) > 0 && (
                  <p className="text-brand-muted text-xs">
                    {b.fotos!.length} foto{b.fotos!.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {brinquedos.length === 0 && (
        <div className="text-center py-20 text-brand-muted">
          <p className="text-base font-medium">Nenhum brinquedo cadastrado</p>
          <p className="text-sm mt-1">Clique em "+ Novo Brinquedo" para começar.</p>
        </div>
      )}
    </div>
  )
}

export default function BrinquedosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando catálogo...</div>}>
      <BrinquedosContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { getAllBrinquedosAdmin } from '@/lib/db/queries/brinquedos'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Catálogo' }
export const dynamic = 'force-dynamic'

async function BrinquedosContent() {
  const brinquedos = await getAllBrinquedosAdmin()

  return (
    <div className="p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
            Catálogo
          </h1>
          <p className="text-brand-muted text-sm mt-1">{brinquedos.length} brinquedos cadastrados</p>
        </div>
        <Link href="/admin/brinquedos/novo">
          <Button className="bg-brand-accent hover:bg-brand-accent-hover text-white">
            + Novo Brinquedo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brinquedos.map(b => (
          <div key={b.id} className="group bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-brand-accent/40 transition-colors duration-150">
            <Link href={`/admin/brinquedos/${b.id}/editar`} className="block">
              <div className="relative aspect-video bg-brand-surface-2">
                {b.fotoDestaque ? (
                  <Image src={b.fotoDestaque} alt={b.nome} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-200" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">
                    Sem foto
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-brand-accent text-white text-xs px-2 py-0.5 rounded-full">
                    {b.categoria}
                  </span>
                  {!b.ativo && (
                    <span className="bg-brand-surface-2 text-brand-muted text-xs px-2 py-0.5 rounded-full border border-brand-border">
                      Inativo
                    </span>
                  )}
                  {b.destaque && (
                    <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30">
                      ⭐ Destaque
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold bg-brand-accent px-3 py-1.5 rounded-lg">
                    Editar brinquedo
                  </span>
                </div>
              </div>
              <div className="p-4 pb-2">
                <h3 className="text-brand-text font-semibold group-hover:text-brand-accent transition-colors">{b.nome}</h3>
                <p className="text-brand-muted text-xs mt-1">{b.faixaEtaria} · {b.capacidade}</p>
                {(b.fotos?.length ?? 0) > 0 && (
                  <p className="text-brand-muted text-xs mt-1">{b.fotos!.length} foto{b.fotos!.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </Link>
            <div className="px-4 pb-4">
              <BrinquedoToggle id={b.id} ativo={b.ativo} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BrinquedoToggle({ id, ativo }: { id: string; ativo: boolean }) {
  return (
    <form action={async () => {
      'use server'
      const { toggleAtivo } = await import('@/lib/db/queries/brinquedos')
      await toggleAtivo(id, !ativo)
    }}>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className={`w-full border-brand-border ${ativo ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
      >
        {ativo ? 'Desativar' : 'Ativar'}
      </Button>
    </form>
  )
}

export default function BrinquedosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando catálogo...</div>}>
      <BrinquedosContent />
    </Suspense>
  )
}

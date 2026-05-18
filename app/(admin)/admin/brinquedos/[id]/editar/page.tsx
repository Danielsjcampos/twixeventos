import { getBrinquedoById } from '@/lib/db/queries/brinquedos'
import { notFound } from 'next/navigation'
import { ToyForm } from '@/components/admin/ToyForm'
import { BackButton } from '@/components/admin/BackButton'
import { BrinquedoHistorico } from '@/components/admin/BrinquedoHistorico'
import { DeleteBrinquedoButton } from '@/components/admin/DeleteBrinquedoButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Editar Brinquedo' }

export default async function EditarBrinquedoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const brinquedo = await getBrinquedoById(id)
  if (!brinquedo) notFound()

  return (
    <div className="p-6 pb-24 md:pb-10 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <BackButton href="/admin/brinquedos" />
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white uppercase">
          Editar: {brinquedo.nome}
        </h1>
      </div>

      <ToyForm brinquedo={brinquedo} />

      {/* Historico de Movimentacao */}
      <div className="mt-10">
        <h2 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">
          Historico de Movimentacao
        </h2>
        <BrinquedoHistorico brinquedoId={brinquedo.id} />
      </div>

      {/* Zona de perigo */}
      <div className="mt-10 pt-6 border-t border-red-500/20">
        <DeleteBrinquedoButton brinquedoId={brinquedo.id} nome={brinquedo.nome} />
      </div>
    </div>
  )
}

import { getBrinquedoById } from '@/lib/db/queries/brinquedos'
import { notFound } from 'next/navigation'
import { ToyForm } from '@/components/admin/ToyForm'
import { BackButton } from '@/components/admin/BackButton'
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
    </div>
  )
}

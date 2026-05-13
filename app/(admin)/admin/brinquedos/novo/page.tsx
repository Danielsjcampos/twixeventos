import type { Metadata } from 'next'
import { ToyForm } from '@/components/admin/ToyForm'
import { BackButton } from '@/components/admin/BackButton'

export const metadata: Metadata = { title: 'Novo Brinquedo' }

export default function NovoBrinquedoPage() {
  return (
    <div className="p-6 pb-24 md:pb-10 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <BackButton href="/admin/brinquedos" />
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white uppercase">
          Novo Brinquedo
        </h1>
      </div>
      <ToyForm />
    </div>
  )
}

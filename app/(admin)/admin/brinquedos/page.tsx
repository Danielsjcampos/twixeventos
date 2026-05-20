import { Suspense } from 'react'
import { getAllBrinquedosAdmin } from '@/lib/db/queries/brinquedos'
import { BrinquedosCatalogo } from '@/components/admin/BrinquedosCatalogo'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Catálogo' }
export const dynamic = 'force-dynamic'

async function BrinquedosContent() {
  const brinquedos = await getAllBrinquedosAdmin()
  return <BrinquedosCatalogo brinquedos={brinquedos} />
}

export default function BrinquedosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando catálogo...</div>}>
      <BrinquedosContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { getAllMonitores } from '@/lib/db/queries/monitores'
import { MonitoresClient } from '@/components/admin/MonitoresClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Monitores — Twix Eventos' }
export const dynamic = 'force-dynamic'

async function MonitoresContent() {
  const monitores = await getAllMonitores()
  return <MonitoresClient monitores={monitores} />
}

export default function MonitoresPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando...</div>}>
      <MonitoresContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { getAllEventos } from '@/lib/db/queries/eventos'
import { getMonitoresAtivos } from '@/lib/db/queries/monitores'
import { EventosClient } from '@/components/admin/EventosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Agenda de Eventos — Twix Eventos' }
export const dynamic = 'force-dynamic'

async function EventosContent() {
  const [eventos, monitores] = await Promise.all([getAllEventos(), getMonitoresAtivos()])
  return <EventosClient eventos={eventos} monitoresDisponiveis={monitores} />
}

export default function EventosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando eventos...</div>}>
      <EventosContent />
    </Suspense>
  )
}

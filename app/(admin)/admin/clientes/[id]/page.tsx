import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getClienteById, getEventosCliente } from '@/lib/db/queries/clientes'
import { getGirosDisponiveis, getGirosBonusCliente } from '@/lib/db/queries/area-cliente'
import { ClienteDetailClient } from '@/components/admin/ClienteDetailClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const c = await getClienteById(id)
  return { title: c ? `Cliente — ${c.nome}` : 'Cliente' }
}

async function ClienteDetailContent({ id }: { id: string }) {
  const [cliente, eventos, girosDisponiveis, girosBonus] = await Promise.all([
    getClienteById(id),
    getEventosCliente(id),
    getGirosDisponiveis(id),
    getGirosBonusCliente(id),
  ])
  if (!cliente) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ClienteDetailClient cliente={{ ...(cliente as any), girosDisponiveis, girosBonus }} eventos={eventos as any} />
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-brand-surface-2 rounded-xl animate-pulse" />
        <div className="h-48 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
      </div>
    }>
      <ClienteDetailContent id={id} />
    </Suspense>
  )
}

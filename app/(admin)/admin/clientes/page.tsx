import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getClientes } from '@/lib/db/queries/clientes'
import { getProximosAniversarios } from '@/lib/db/queries/clientes'
import { ClientesClient } from '@/components/admin/ClientesClient'

export const metadata: Metadata = { title: 'Clientes' }
export const dynamic = 'force-dynamic'

async function ClientesContent() {
  const [clientes, aniversarios] = await Promise.all([
    getClientes(),
    getProximosAniversarios(30),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ClientesClient clientes={clientes as any} aniversarios={aniversarios} />
}

export default function ClientesPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-brand-surface-2 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <ClientesContent />
    </Suspense>
  )
}

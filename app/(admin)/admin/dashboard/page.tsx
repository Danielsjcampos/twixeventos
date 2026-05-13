import { Suspense } from 'react'
import { getDashboardMetrics } from '@/lib/db/queries/dashboard'
import { getLeadsKanban } from '@/lib/db/queries/leads'
import { getReceitaPorMes } from '@/lib/db/queries/financeiro'
import { DashboardClient } from '@/components/admin/DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const ano = new Date().getFullYear()
  const [metrics, leads, receitaAnual] = await Promise.all([
    getDashboardMetrics(),
    getLeadsKanban(),
    getReceitaPorMes(ano),
  ])

  const leadsAlerta = leads.filter(l => {
    const diff = Date.now() - new Date(l.ultimaInteracao).getTime()
    return diff > 48 * 3600 * 1000
  })

  return (
    <DashboardClient
      metrics={metrics}
      receitaAnual={receitaAnual}
      leadsAlerta={leadsAlerta}
    />
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-brand-surface-2 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

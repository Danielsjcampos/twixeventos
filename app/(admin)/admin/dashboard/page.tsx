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

  const limiteAlerta = new Date()
  limiteAlerta.setHours(limiteAlerta.getHours() - 48)
  const leadsAlerta = leads.filter(l => new Date(l.ultimaInteracao) < limiteAlerta)

  return (
    <DashboardClient
      metrics={metrics}
      receitaAnual={receitaAnual}
      leadsAlerta={leadsAlerta}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-44 bg-brand-surface-2 rounded-xl animate-pulse" />
        <div className="h-4 w-64 bg-brand-surface-2 rounded-lg animate-pulse" />
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
        ))}
      </div>
      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
        <div className="h-72 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
      </div>
      {/* Funnel row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-52 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
        ))}
      </div>
      {/* Events row */}
      <div className="h-48 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

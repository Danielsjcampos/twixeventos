import { Suspense } from 'react'
import { getLeadsKanban, getLeadsCrmStats } from '@/lib/db/queries/leads'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'CRM — Leads' }
export const dynamic = 'force-dynamic'

async function LeadsContent() {
  const [leads, stats] = await Promise.all([
    getLeadsKanban(),
    getLeadsCrmStats(),
  ])

  const { KanbanBoard } = await import('@/components/admin/KanbanBoard')

  return (
    <div className="p-6 pb-24 md:pb-8">
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
          CRM — Leads
        </h1>
        <p className="text-brand-muted text-sm mt-1">
          {leads.length} lead(s) ativos · {stats.total} no total
        </p>
      </div>
      <KanbanBoard initialLeads={leads} stats={stats} />
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando CRM...</div>}>
      <LeadsContent />
    </Suspense>
  )
}

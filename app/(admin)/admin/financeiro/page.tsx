import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getKpisMes, getReceitaPorMes, getRankingBrinquedosMes, getOrigemClientesMes, getEventosMes } from '@/lib/db/queries/financeiro'
import { getLancamentosMes } from '@/lib/db/queries/lancamentos'
import { FinanceiroClient } from '@/components/admin/FinanceiroClient'

export const metadata: Metadata = { title: 'Financeiro' }
export const dynamic = 'force-dynamic'

async function FinanceiroContent() {
  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  const [kpis, eventos, ranking, origens, receitaAnual, lancamentos] = await Promise.all([
    getKpisMes(mes, ano),
    getEventosMes(mes, ano),
    getRankingBrinquedosMes(mes, ano),
    getOrigemClientesMes(mes, ano),
    getReceitaPorMes(ano),
    getLancamentosMes(mes, ano),
  ])

  return (
    <FinanceiroClient
      mesInicial={mes}
      anoInicial={ano}
      kpisInicial={kpis}
      eventosInicial={eventos as Parameters<typeof FinanceiroClient>[0]['eventosInicial']}
      rankingBrinquedosInicial={ranking}
      origensInicial={origens}
      receitaAnual={receitaAnual}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lancamentosInicial={lancamentos as any}
    />
  )
}

export default function FinanceiroPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-brand-surface-2 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
          <div className="h-64 bg-brand-surface rounded-2xl border border-brand-border animate-pulse" />
        </div>
      </div>
    }>
      <FinanceiroContent />
    </Suspense>
  )
}

import { Suspense } from 'react'
import {
  getResumoTracking, getPageviewsPorDia, getTopPaginas, getTopCliques,
  getTopBuscas, getDispositivos, getTopReferrers,
} from '@/lib/db/queries/analytics'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { AnalyticsClient } from '@/components/admin/AnalyticsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics — Rastreamento' }
export const dynamic = 'force-dynamic'

async function AnalyticsContent() {
  const dias = 30
  const [resumo, porDia, paginas, cliques, buscas, dispositivos, referrers, trackingAtivo] = await Promise.all([
    getResumoTracking(dias),
    getPageviewsPorDia(dias),
    getTopPaginas(dias),
    getTopCliques(dias),
    getTopBuscas(dias),
    getDispositivos(dias),
    getTopReferrers(dias),
    getConfig('tracking_ativo'),
  ])

  return (
    <AnalyticsClient
      resumo={resumo}
      porDia={porDia}
      paginas={paginas}
      cliques={cliques}
      buscas={buscas}
      dispositivos={dispositivos}
      referrers={referrers}
      trackingAtivo={trackingAtivo !== 'false'}
    />
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  )
}

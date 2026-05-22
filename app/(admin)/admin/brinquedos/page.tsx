import { Suspense } from 'react'
import { getAllBrinquedosAdmin, getBrinquedosChartData } from '@/lib/db/queries/brinquedos'
import { BrinquedosCatalogoAdmin } from '@/components/admin/BrinquedosCatalogoAdmin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Catálogo' }
export const dynamic = 'force-dynamic'

async function BrinquedosContent() {
  const [brinquedos, chartData] = await Promise.all([
    getAllBrinquedosAdmin(),
    getBrinquedosChartData(),
  ])

  const counts = {
    publicado: brinquedos.filter(b => b.status === 'publicado').length,
    rascunho:  brinquedos.filter(b => b.status === 'rascunho').length,
    invisivel: brinquedos.filter(b => b.status === 'invisivel').length,
  }

  return (
    <BrinquedosCatalogoAdmin
      brinquedos={brinquedos}
      chartData={chartData}
      counts={counts}
    />
  )
}

export default function BrinquedosPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando catálogo...</div>}>
      <BrinquedosContent />
    </Suspense>
  )
}

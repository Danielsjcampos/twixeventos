import { Suspense } from 'react'
import { getTermosAdmin } from '@/lib/db/queries/glossario'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { GlossarioClient } from '@/components/admin/GlossarioClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Glossário SEO' }
export const dynamic = 'force-dynamic'

async function GlossarioContent() {
  const [termos, leituraFlag, adsFlag] = await Promise.all([
    getTermosAdmin({}),
    getConfig('glossario_leitura_ativo'),
    getConfig('glossario_ads_ativo'),
  ])

  return (
    <GlossarioClient
      initialTermos={termos}
      leituraAtiva={leituraFlag !== 'false'}
      adsAtivo={adsFlag !== 'false'}
    />
  )
}

export default function GlossarioPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando painel do glossário...</div>}>
      <GlossarioContent />
    </Suspense>
  )
}

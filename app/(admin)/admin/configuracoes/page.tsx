import { getAllConfigs } from '@/lib/db/queries/configuracoes'
import { ConfiguracoesClient } from '@/components/admin/ConfiguracoesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const configs = await getAllConfigs()

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-brand-text uppercase">
          Configurações
        </h1>
        <p className="text-brand-muted mt-1 text-sm">
          Gerencie todas as configurações do site, integrações e parâmetros do sistema
        </p>
      </div>

      <ConfiguracoesClient initialConfigs={configs} />
    </div>
  )
}

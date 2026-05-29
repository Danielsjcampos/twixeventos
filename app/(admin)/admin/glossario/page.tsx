import { Suspense } from 'react'
import { getTermosAdmin } from '@/lib/db/queries/glossario'
import { GlossarioClient } from '@/components/admin/GlossarioClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Glossário SEO' }
export const dynamic = 'force-dynamic'

async function GlossarioContent() {
  const termos = await getTermosAdmin({})

  return (
    <GlossarioClient initialTermos={termos} />
  )
}

export default function GlossarioPage() {
  return (
    <Suspense fallback={<div className="p-6 text-brand-muted">Carregando painel do glossário...</div>}>
      <GlossarioContent />
    </Suspense>
  )
}

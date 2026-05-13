import { getBrinquedosAtivos } from '@/lib/db/queries/brinquedos'
import { ToyGrid } from '@/components/public/ToyGrid'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { CatalogHeader } from '@/components/public/CatalogHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catálogo de Brinquedos — Twix Eventos',
  description: 'Veja todos os brinquedos infláveis e eletrônicos disponíveis para locação em São José dos Campos. Tobogãs, touro mecânico, canhão de espuma e muito mais!',
}

export const dynamic = 'force-dynamic'

export default async function BrinquedosPage() {
  const brinquedos = await getBrinquedosAtivos()

  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CatalogHeader totalToys={brinquedos.length} />
          <ToyGrid brinquedos={brinquedos} />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

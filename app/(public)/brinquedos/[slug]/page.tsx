import { getBrinquedoBySlug } from '@/lib/db/queries/brinquedos'
import { notFound } from 'next/navigation'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { BrinquedoDetail } from '@/components/public/BrinquedoDetail'
import type { Metadata } from 'next'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const b = await getBrinquedoBySlug(slug)
  if (!b) return {}
  return {
    title: `Aluguel de ${b.nome} em SJC`,
    description: `Alugue o ${b.nome} para o seu evento em São José dos Campos. ${b.faixaEtaria} · ${b.capacidade} · ${b.dimensoes}. Reserve agora via WhatsApp!`,
  }
}

export default async function BrinquedoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brinquedo = await getBrinquedoBySlug(slug)
  if (!brinquedo) notFound()

  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BrinquedoDetail brinquedo={brinquedo} />
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { getTermosPublicados } from '@/lib/db/queries/glossario'
import { GlossarioPublicClient } from '@/components/public/GlossarioPublicClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glossário de Brinquedos e Festas — Twix Eventos',
  description: 'Dicionário completo e explicativo sobre termos de festas infantis, aluguel de brinquedos infláveis e eventos em São José dos Campos e Vale do Paraíba.',
}

export const revalidate = 3600

export default async function GlossarioPage() {
  const termos = await getTermosPublicados()

  return (
    <>
      <Header />
      <main className="flex-1 bg-brand-bg pb-20">
        {/* Hero */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-[family-name:var(--font-display)] text-4xl lg:text-6xl font-bold text-brand-text uppercase leading-none">
              GLOSSÁRIO <span className="text-brand-accent">NINJA</span>
            </h1>
            <p className="text-brand-muted text-base lg:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
              O dicionário de termos, gírias e conceitos sobre locação de brinquedos infláveis, eletrônicos,
              organização de festas infantis e eventos em São José dos Campos e Vale do Paraíba.
            </p>
          </div>
        </section>

        {/* Client Interactive Component */}
        <section className="px-4 max-w-6xl mx-auto">
          <GlossarioPublicClient termos={termos} />
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
